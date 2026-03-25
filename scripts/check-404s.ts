#!/usr/bin/env npx ts-node
/**
 * Automated 404 Detection & Duplicate Meta Checker (SIP-19)
 *
 * 1. Fetches each site's sitemap.xml
 * 2. Checks every URL for HTTP errors (404, 500, etc.)
 * 3. Scans for duplicate meta titles / descriptions across pages
 * 4. Writes a JSON report to data/404-reports/YYYY-MM-DD.json
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/check-404s.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/check-404s.ts --site sipenpaints.nl
 *   npx ts-node --project tsconfig.scripts.json scripts/check-404s.ts --concurrency 5
 *
 * Env (optional):
 *   CHECK_404_SITES  Comma-separated list of site base URLs to check
 *                   (overrides default list)
 *
 * Reports are written to: data/404-reports/YYYY-MM-DD.json
 * Each run is additive — new site entries are merged with existing ones.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
};

const CLI_SITE = getArg('--site');
const CLI_CONCURRENCY = parseInt(getArg('--concurrency') || '3', 10);

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SITES = [
  'https://www.sipenpaints.nl',
  'https://www.sipandpaints.nl',
  'https://www.sipandpaintamsterdam.nl',
];

const SITES: string[] = (() => {
  if (CLI_SITE) return [`https://www.${CLI_SITE.replace(/^https?:\/\//, '').replace(/^www\./, '')}`];
  if (process.env.CHECK_404_SITES) return process.env.CHECK_404_SITES.split(',').map(s => s.trim());
  return DEFAULT_SITES;
})();

const REPORT_DIR = path.resolve(__dirname, '../data/404-reports');
const TODAY = new Date().toISOString().split('T')[0];
const REPORT_FILE = path.join(REPORT_DIR, `${TODAY}.json`);

const REQUEST_TIMEOUT_MS = 10_000;
const USER_AGENT = 'SipAndPaint-404Bot/1.0 (+https://sipenpaints.nl/robots.txt)';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UrlCheckResult {
  url: string;
  status: number | null;
  error?: string;
  metaTitle?: string;
  metaDescription?: string;
  checkedAt: string;
}

interface SiteReport {
  siteUrl: string;
  checkedAt: string;
  totalUrls: number;
  errors: UrlCheckResult[];
  duplicateMeta: {
    titles: Record<string, string[]>;
    descriptions: Record<string, string[]>;
  };
  allResults: UrlCheckResult[];
}

type DailyReport = Record<string, SiteReport>;

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(
      url,
      {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          // Limit body to 50 KB to keep memory usage low
          if (body.length < 50_000) body += chunk.toString();
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

// ─── Meta Tag Extraction ──────────────────────────────────────────────────────

function extractMeta(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return {
    title: titleMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  };
}

// ─── Sitemap Parser ───────────────────────────────────────────────────────────

async function fetchSitemapUrls(siteUrl: string): Promise<string[]> {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  console.log(`  📄 Fetching sitemap: ${sitemapUrl}`);
  try {
    const { status, body } = await fetchUrl(sitemapUrl);
    if (status !== 200) {
      console.warn(`  ⚠️  Sitemap returned ${status}`);
      return [];
    }
    // Extract all <loc> values
    const locs: string[] = [];
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    let match: RegExpExecArray | null;
    while ((match = locRegex.exec(body)) !== null) {
      locs.push(match[1].trim());
    }
    console.log(`  ✅ Found ${locs.length} URLs in sitemap`);
    return locs;
  } catch (err: any) {
    console.error(`  ❌ Error fetching sitemap: ${err.message}`);
    return [];
  }
}

// ─── Concurrency Control ──────────────────────────────────────────────────────

async function pLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─── URL Checker ──────────────────────────────────────────────────────────────

async function checkUrl(url: string): Promise<UrlCheckResult> {
  const now = new Date().toISOString();
  try {
    const { status, body } = await fetchUrl(url);
    const meta = status === 200 ? extractMeta(body) : {};
    return {
      url,
      status,
      metaTitle: meta.title,
      metaDescription: meta.description,
      checkedAt: now,
    };
  } catch (err: any) {
    return {
      url,
      status: null,
      error: err.message,
      checkedAt: now,
    };
  }
}

// ─── Duplicate Meta Detection ─────────────────────────────────────────────────

function detectDuplicateMeta(results: UrlCheckResult[]): {
  titles: Record<string, string[]>;
  descriptions: Record<string, string[]>;
} {
  const titleMap: Record<string, string[]> = {};
  const descMap: Record<string, string[]> = {};

  for (const r of results) {
    if (r.status !== 200) continue;
    if (r.metaTitle) {
      titleMap[r.metaTitle] = titleMap[r.metaTitle] || [];
      titleMap[r.metaTitle].push(r.url);
    }
    if (r.metaDescription) {
      descMap[r.metaDescription] = descMap[r.metaDescription] || [];
      descMap[r.metaDescription].push(r.url);
    }
  }

  return {
    titles: Object.fromEntries(
      Object.entries(titleMap).filter(([, urls]) => urls.length > 1)
    ),
    descriptions: Object.fromEntries(
      Object.entries(descMap).filter(([, urls]) => urls.length > 1)
    ),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function checkSite(siteUrl: string): Promise<SiteReport> {
  console.log(`\n🔍 Checking site: ${siteUrl}`);

  const urls = await fetchSitemapUrls(siteUrl);

  if (urls.length === 0) {
    console.warn(`  ⚠️  No URLs found — falling back to homepage only`);
    urls.push(siteUrl + '/');
  }

  console.log(`  🌐 Checking ${urls.length} URLs (concurrency: ${CLI_CONCURRENCY})...`);

  let done = 0;
  const tasks = urls.map((url) => async () => {
    const result = await checkUrl(url);
    done++;
    if (result.status !== 200) {
      console.log(
        `  [${done}/${urls.length}] ${result.status ?? 'ERR'} ${url}${result.error ? ` — ${result.error}` : ''}`
      );
    } else {
      process.stdout.write(`\r  [${done}/${urls.length}] ✓`);
    }
    return result;
  });

  const allResults = await pLimit(tasks, CLI_CONCURRENCY);
  console.log(''); // newline after progress

  const errors = allResults.filter((r) => r.status !== 200 || r.error);
  const duplicateMeta = detectDuplicateMeta(allResults);

  const dupTitleCount = Object.keys(duplicateMeta.titles).length;
  const dupDescCount = Object.keys(duplicateMeta.descriptions).length;

  console.log(`  📊 Results:`);
  console.log(`     Total URLs: ${urls.length}`);
  console.log(`     Errors (non-200 / unreachable): ${errors.length}`);
  console.log(`     Duplicate meta titles: ${dupTitleCount}`);
  console.log(`     Duplicate meta descriptions: ${dupDescCount}`);

  if (errors.length > 0) {
    console.log(`\n  ❌ Error URLs:`);
    errors.forEach((e) => {
      console.log(`     ${e.status ?? 'ERR'} — ${e.url}${e.error ? ` (${e.error})` : ''}`);
    });
  }

  if (dupTitleCount > 0) {
    console.log(`\n  ⚠️  Duplicate meta titles:`);
    Object.entries(duplicateMeta.titles).forEach(([title, pages]) => {
      console.log(`     "${title.substring(0, 60)}..."`);
      pages.forEach((p) => console.log(`       → ${p}`));
    });
  }

  return {
    siteUrl,
    checkedAt: new Date().toISOString(),
    totalUrls: urls.length,
    errors,
    duplicateMeta,
    allResults,
  };
}

async function main() {
  console.log(`\n🚀 SIP-19 404 Detection & Crawl Audit`);
  console.log(`📅 Date: ${TODAY}`);
  console.log(`🌐 Sites: ${SITES.join(', ')}`);

  // Load existing report if present
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  let report: DailyReport = {};
  if (fs.existsSync(REPORT_FILE)) {
    try {
      report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    } catch {
      report = {};
    }
  }

  for (const siteUrl of SITES) {
    const siteReport = await checkSite(siteUrl);
    const domainKey = new URL(siteUrl).hostname;
    report[domainKey] = siteReport;
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${REPORT_FILE}`);

  // Exit with error code if any 404s found (useful in CI)
  const totalErrors = Object.values(report).reduce((sum, r) => sum + r.errors.length, 0);
  if (totalErrors > 0) {
    console.log(`\n⚠️  Found ${totalErrors} URL error(s) across all sites.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All URLs returned 200 OK.`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
