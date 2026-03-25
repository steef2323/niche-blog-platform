#!/usr/bin/env npx ts-node
/**
 * Google Indexing API Pinger (SIP-19)
 *
 * Reads each site's sitemap.xml and submits newly-updated URLs to the
 * Google Indexing API for immediate re-crawl.
 *
 * The script tracks which URLs have already been submitted (in
 * data/indexing-submitted.json) and only re-pings a URL when its
 * <lastmod> has changed or the URL has never been submitted.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/indexing-api-ping.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/indexing-api-ping.ts --site sipenpaints.nl
 *   npx ts-node --project tsconfig.scripts.json scripts/indexing-api-ping.ts --dry-run
 *
 * Required env (same as gsc-weekly-report.ts):
 *   GOOGLE_SERVICE_ACCOUNT_KEY   JSON string of the service account key file
 *   OR
 *   GOOGLE_APPLICATION_CREDENTIALS  Path to the service account key JSON file
 *
 * Note: The service account must be granted "Owner" permission in Google Search
 * Console for each site property, and the Indexing API must be enabled in the
 * Google Cloud Console for the project.
 *
 * State file: data/indexing-submitted.json
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
const DRY_RUN = args.includes('--dry-run');

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

const STATE_FILE = path.resolve(__dirname, '../data/indexing-submitted.json');
const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

// Google Indexing API quota: 200 requests/day total across all sites
const MAX_URLS_PER_SITE = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SitemapEntry {
  url: string;
  lastmod?: string;
}

interface SubmittedEntry {
  submittedAt: string;
  lastmod?: string;
}

type SubmittedState = Record<string, SubmittedEntry>;

// ─── Auth: Service Account JWT ────────────────────────────────────────────────

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

function loadServiceAccountKey(): ServiceAccountKey | null {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
      return null;
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
      );
    } catch {
      console.error('❌ Could not read GOOGLE_APPLICATION_CREDENTIALS file');
      return null;
    }
  }
  return null;
}

/**
 * Create a signed JWT for Google APIs using the service account key.
 * We implement this manually to avoid requiring `google-auth-library`
 * at runtime in scripts (it's a devDep anyway).
 */
async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  // Dynamic import: googleapis is a devDependency
  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: key.client_email,
      private_key: key.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();
  const tokenResponse = await (client as any).getAccessToken();
  return tokenResponse.token as string;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(url, { timeout: 10_000 }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => {
        if (body.length < 200_000) body += chunk.toString();
      });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function postJson(
  url: string,
  body: object,
  accessToken: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15_000,
    };
    const req = https.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk: Buffer) => { respBody += chunk.toString(); });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: respBody }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Sitemap Parser ───────────────────────────────────────────────────────────

async function fetchSitemap(siteUrl: string): Promise<SitemapEntry[]> {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const { status, body } = await fetchUrl(sitemapUrl);
  if (status !== 200) {
    console.warn(`  ⚠️  Sitemap ${sitemapUrl} returned ${status}`);
    return [];
  }

  const entries: SitemapEntry[] = [];
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/g;
  let block: RegExpExecArray | null;
  while ((block = urlBlockRegex.exec(body)) !== null) {
    const locMatch = block[1].match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = block[1].match(/<lastmod>([^<]+)<\/lastmod>/);
    if (locMatch) {
      entries.push({
        url: locMatch[1].trim(),
        lastmod: lastmodMatch?.[1]?.trim(),
      });
    }
  }

  return entries;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 SIP-19 Google Indexing API Pinger`);
  if (DRY_RUN) console.log(`⚠️  DRY RUN — no requests will be sent to Google`);

  const key = loadServiceAccountKey();
  if (!key) {
    console.error(
      '❌ No service account credentials found.\n' +
      '   Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.'
    );
    process.exit(1);
  }

  // Load submitted state
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  let state: SubmittedState = {};
  if (fs.existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      state = {};
    }
  }

  let accessToken = '';
  if (!DRY_RUN) {
    console.log(`\n🔑 Obtaining access token...`);
    accessToken = await getAccessToken(key);
    console.log(`  ✅ Access token obtained`);
  }

  let totalSubmitted = 0;
  let totalSkipped = 0;

  for (const siteUrl of SITES) {
    console.log(`\n🌐 Site: ${siteUrl}`);
    const entries = await fetchSitemap(siteUrl);
    console.log(`  📄 ${entries.length} URLs in sitemap`);

    // Filter to URLs that are new or have updated lastmod
    const toSubmit = entries.filter((entry) => {
      const prev = state[entry.url];
      if (!prev) return true; // Never submitted
      if (entry.lastmod && prev.lastmod !== entry.lastmod) return true; // Updated
      return false;
    });

    const capped = toSubmit.slice(0, MAX_URLS_PER_SITE);
    const skipped = entries.length - capped.length;
    totalSkipped += skipped;

    if (capped.length === 0) {
      console.log(`  ✅ All URLs already up-to-date — nothing to submit`);
      continue;
    }

    console.log(`  📤 Submitting ${capped.length} URLs (${skipped} skipped as already current)`);

    for (const entry of capped) {
      if (DRY_RUN) {
        console.log(`  [DRY] Would submit: ${entry.url}`);
        totalSubmitted++;
        continue;
      }

      try {
        const resp = await postJson(
          INDEXING_API_URL,
          { url: entry.url, type: 'URL_UPDATED' },
          accessToken
        );

        if (resp.status === 200) {
          console.log(`  ✅ ${entry.url}`);
          state[entry.url] = {
            submittedAt: new Date().toISOString(),
            lastmod: entry.lastmod,
          };
          totalSubmitted++;
        } else {
          console.warn(`  ⚠️  ${resp.status} for ${entry.url}: ${resp.body.substring(0, 200)}`);
        }

        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        console.error(`  ❌ Error submitting ${entry.url}: ${err.message}`);
      }
    }
  }

  // Persist updated state
  if (!DRY_RUN) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`\n✅ State saved to: ${STATE_FILE}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Submitted: ${totalSubmitted}`);
  console.log(`   Skipped (up-to-date): ${totalSkipped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
