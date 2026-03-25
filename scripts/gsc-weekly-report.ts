#!/usr/bin/env npx ts-node
/**
 * Google Search Console Weekly Ranking Report (SIP-9)
 *
 * Pulls impressions, clicks, and avg. position per page and query from the
 * GSC Search Analytics API for all three sip-and-paint sites, then stores a
 * dated JSON snapshot and prints a human-readable weekly report.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/gsc-weekly-report.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/gsc-weekly-report.ts --site sipenpaints.nl
 *   npx ts-node --project tsconfig.scripts.json scripts/gsc-weekly-report.ts --days 28
 *
 * Required env (one of two auth methods):
 *
 *   Method A – Service Account (recommended for CI / Vercel cron):
 *     GOOGLE_SERVICE_ACCOUNT_KEY   JSON string of the service account key file
 *     OR
 *     GOOGLE_APPLICATION_CREDENTIALS  Path to the service account key JSON file
 *
 *   Method B – OAuth2 Refresh Token (manual / local):
 *     GOOGLE_CLIENT_ID
 *     GOOGLE_CLIENT_SECRET
 *     GOOGLE_REFRESH_TOKEN
 *
 * Optional env:
 *   GSC_SITES   Comma-separated list of site URLs to query (overrides default list)
 *               e.g. "sc-domain:sipenpaints.nl,sc-domain:sipandpaints.nl"
 *
 * Snapshots are written to: data/gsc-snapshots/YYYY-MM-DD.json
 * Each snapshot is additive — new site/date entries are merged with existing ones.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
};

const CLI_SITE = getArg('--site');
const CLI_DAYS = parseInt(getArg('--days') || '7', 10);

// ─── Constants ────────────────────────────────────────────────────────────────

/** GSC site URLs — use sc-domain: prefix to match all protocols/subdomains */
const DEFAULT_SITES: string[] = [
  'sc-domain:sipenpaints.nl',
  'sc-domain:sipandpaints.nl',
  'sc-domain:sipandpaintamsterdam.nl',
];

const SNAPSHOT_DIR = path.resolve(__dirname, '../data/gsc-snapshots');
const ROW_LIMIT = 1000; // max rows per query (GSC API max is 25000)

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueryRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: Array<{ query: string; position: number; clicks: number }>;
}

interface SiteSnapshot {
  site: string;
  startDate: string;
  endDate: string;
  fetchedAt: string;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  rows: QueryRow[];
}

interface DaySnapshot {
  date: string;
  sites: SiteSnapshot[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function buildAuthClient(): Promise<OAuth2Client> {
  // Method A1: inline JSON key string
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    return (await auth.getClient()) as OAuth2Client;
  }

  // Method A2: path to key file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    return (await auth.getClient()) as OAuth2Client;
  }

  // Method B: OAuth2 refresh token
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  ) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return oauth2 as unknown as OAuth2Client;
  }

  throw new Error(
    'No GSC credentials found. Set one of:\n' +
      '  GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)\n' +
      '  GOOGLE_APPLICATION_CREDENTIALS (file path)\n' +
      '  GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN',
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── GSC fetch ────────────────────────────────────────────────────────────────

async function fetchSiteData(
  webmasters: ReturnType<typeof google.webmasters>,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<SiteSnapshot> {
  console.log(`  → Fetching ${siteUrl} (${startDate} – ${endDate}) …`);

  const response = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: ROW_LIMIT,
      dataState: 'all', // include fresh data
    },
  });

  const raw = response.data.rows ?? [];

  const rows: QueryRow[] = raw.map((r) => ({
    query: (r.keys?.[0] ?? '') as string,
    page: (r.keys?.[1] ?? '') as string,
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const avgPosition =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.position, 0) / rows.length
      : 0;

  return {
    site: siteUrl,
    startDate,
    endDate,
    fetchedAt: new Date().toISOString(),
    totalClicks,
    totalImpressions,
    avgPosition: Math.round(avgPosition * 10) / 10,
    rows,
  };
}

// ─── Snapshot storage ─────────────────────────────────────────────────────────

function loadSnapshot(date: string): DaySnapshot {
  const file = path.join(SNAPSHOT_DIR, `${date}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as DaySnapshot;
  }
  return { date, sites: [] };
}

function saveSnapshot(snap: DaySnapshot): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const file = path.join(SNAPSHOT_DIR, `${snap.date}.json`);
  fs.writeFileSync(file, JSON.stringify(snap, null, 2), 'utf-8');
  console.log(`  ✅ Snapshot saved → ${file}`);
}

function mergeSnapshot(existing: DaySnapshot, fresh: SiteSnapshot): DaySnapshot {
  const sites = existing.sites.filter((s) => s.site !== fresh.site);
  return { ...existing, sites: [...sites, fresh] };
}

// ─── Report ───────────────────────────────────────────────────────────────────

function buildPageRows(rows: QueryRow[]): PageRow[] {
  const byPage = new Map<string, PageRow>();

  for (const r of rows) {
    if (!byPage.has(r.page)) {
      byPage.set(r.page, {
        page: r.page,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        topQueries: [],
      });
    }
    const p = byPage.get(r.page)!;
    p.clicks += r.clicks;
    p.impressions += r.impressions;
    p.topQueries.push({ query: r.query, position: r.position, clicks: r.clicks });
  }

  // Compute per-page averages
  for (const p of byPage.values()) {
    const pageRows = rows.filter((r) => r.page === p.page);
    p.ctr =
      p.impressions > 0 ? Math.round((p.clicks / p.impressions) * 10000) / 100 : 0;
    p.position =
      pageRows.length > 0
        ? Math.round((pageRows.reduce((s, r) => s + r.position, 0) / pageRows.length) * 10) / 10
        : 0;
    p.topQueries.sort((a, b) => b.clicks - a.clicks);
    p.topQueries = p.topQueries.slice(0, 5); // top 5 queries per page
  }

  return [...byPage.values()].sort((a, b) => b.clicks - a.clicks);
}

function printReport(snap: SiteSnapshot, prevSnap?: SiteSnapshot): void {
  const pages = buildPageRows(snap.rows);
  const prevPages = prevSnap ? buildPageRows(prevSnap.rows) : [];

  const prevClickMap = new Map(prevPages.map((p) => [p.page, p.clicks]));
  const prevPosMap = new Map(prevPages.map((p) => [p.page, p.position]));

  const domain = snap.site.replace('sc-domain:', '');
  const separator = '─'.repeat(80);

  console.log(`\n${separator}`);
  console.log(`  ${domain.toUpperCase()}  |  ${snap.startDate} → ${snap.endDate}`);
  console.log(separator);
  console.log(
    `  Total clicks: ${snap.totalClicks.toLocaleString()}` +
      (prevSnap
        ? `  (prev: ${prevSnap.totalClicks.toLocaleString()}, Δ ${snap.totalClicks - prevSnap.totalClicks >= 0 ? '+' : ''}${snap.totalClicks - prevSnap.totalClicks})`
        : ''),
  );
  console.log(
    `  Total impr:   ${snap.totalImpressions.toLocaleString()}` +
      (prevSnap
        ? `  (prev: ${prevSnap.totalImpressions.toLocaleString()}, Δ ${snap.totalImpressions - prevSnap.totalImpressions >= 0 ? '+' : ''}${snap.totalImpressions - prevSnap.totalImpressions})`
        : ''),
  );
  console.log(`  Avg position: ${snap.avgPosition}`);

  // ── Top 10 pages ──────────────────────────────────────────────────────────
  console.log(`\n  TOP 10 PAGES (by clicks)`);
  console.log(`  ${'Page'.padEnd(55)} Clicks Impr  Pos   ΔPos`);
  console.log(`  ${'-'.repeat(75)}`);

  pages.slice(0, 10).forEach((p) => {
    const shortUrl = p.page.replace(/https?:\/\/[^/]+/, '').slice(0, 52);
    const prevPos = prevPosMap.get(p.page);
    const dPos =
      prevPos !== undefined
        ? (p.position - prevPos >= 0 ? '+' : '') + (p.position - prevPos).toFixed(1)
        : '  — ';
    const prevClicks = prevClickMap.get(p.page) ?? 0;
    const dClicks =
      prevClickMap.has(p.page)
        ? (p.clicks - prevClicks >= 0 ? '+' : '') + (p.clicks - prevClicks)
        : '';
    console.log(
      `  ${shortUrl.padEnd(55)} ${String(p.clicks).padStart(4)}${dClicks ? `(${dClicks})`.padStart(7) : '       '}  ${String(p.impressions).padStart(5)}  ${String(p.position).padStart(5)}  ${dPos}`,
    );
  });

  // ── Positions 4-15 (optimization targets) ────────────────────────────────
  const targets = pages.filter((p) => p.position >= 4 && p.position <= 15);
  if (targets.length > 0) {
    console.log(`\n  OPTIMIZATION TARGETS (positions 4–15): ${targets.length} pages`);
    console.log(`  ${'Page'.padEnd(55)} Pos   Clicks Impr`);
    console.log(`  ${'-'.repeat(75)}`);
    targets.slice(0, 15).forEach((p) => {
      const shortUrl = p.page.replace(/https?:\/\/[^/]+/, '').slice(0, 52);
      console.log(
        `  ${shortUrl.padEnd(55)} ${String(p.position).padStart(5)}  ${String(p.clicks).padStart(5)}  ${String(p.impressions).padStart(5)}`,
      );
    });
  }

  // ── Top queries by impressions ────────────────────────────────────────────
  const queryMap = new Map<string, { clicks: number; impressions: number; position: number; count: number }>();
  for (const r of snap.rows) {
    const existing = queryMap.get(r.query) ?? { clicks: 0, impressions: 0, position: 0, count: 0 };
    queryMap.set(r.query, {
      clicks: existing.clicks + r.clicks,
      impressions: existing.impressions + r.impressions,
      position: existing.position + r.position,
      count: existing.count + 1,
    });
  }

  const topQueries = [...queryMap.entries()]
    .map(([q, v]) => ({ query: q, ...v, avgPos: Math.round((v.position / v.count) * 10) / 10 }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  console.log(`\n  TOP 15 QUERIES (by impressions)`);
  console.log(`  ${'Query'.padEnd(45)} Pos   Clicks Impr`);
  console.log(`  ${'-'.repeat(70)}`);
  topQueries.forEach((q) => {
    const shortQ = q.query.slice(0, 42);
    console.log(
      `  ${shortQ.padEnd(45)} ${String(q.avgPos).padStart(5)}  ${String(q.clicks).padStart(5)}  ${String(q.impressions).padStart(5)}`,
    );
  });

  console.log('');
}

// ─── JSON report output ───────────────────────────────────────────────────────

interface ReportOutput {
  generatedAt: string;
  period: { startDate: string; endDate: string };
  sites: Array<{
    site: string;
    summary: {
      totalClicks: number;
      totalImpressions: number;
      avgPosition: number;
      deltaClicks?: number;
      deltaImpressions?: number;
    };
    topPages: PageRow[];
    optimizationTargets: PageRow[];
    topQueries: Array<{ query: string; clicks: number; impressions: number; avgPos: number }>;
  }>;
}

function buildJsonReport(
  snapshots: SiteSnapshot[],
  prevSnapshots: SiteSnapshot[],
): ReportOutput {
  const prevMap = new Map(prevSnapshots.map((s) => [s.site, s]));

  const sites = snapshots.map((snap) => {
    const prev = prevMap.get(snap.site);
    const pages = buildPageRows(snap.rows);

    const queryMap = new Map<
      string,
      { clicks: number; impressions: number; position: number; count: number }
    >();
    for (const r of snap.rows) {
      const existing = queryMap.get(r.query) ?? {
        clicks: 0,
        impressions: 0,
        position: 0,
        count: 0,
      };
      queryMap.set(r.query, {
        clicks: existing.clicks + r.clicks,
        impressions: existing.impressions + r.impressions,
        position: existing.position + r.position,
        count: existing.count + 1,
      });
    }

    const topQueries = [...queryMap.entries()]
      .map(([q, v]) => ({
        query: q,
        clicks: v.clicks,
        impressions: v.impressions,
        avgPos: Math.round((v.position / v.count) * 10) / 10,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 25);

    return {
      site: snap.site,
      summary: {
        totalClicks: snap.totalClicks,
        totalImpressions: snap.totalImpressions,
        avgPosition: snap.avgPosition,
        ...(prev
          ? {
              deltaClicks: snap.totalClicks - prev.totalClicks,
              deltaImpressions: snap.totalImpressions - prev.totalImpressions,
            }
          : {}),
      },
      topPages: pages.slice(0, 25),
      optimizationTargets: pages.filter((p) => p.position >= 4 && p.position <= 15),
      topQueries,
    };
  });

  const startDate = snapshots[0]?.startDate ?? '';
  const endDate = snapshots[0]?.endDate ?? '';

  return { generatedAt: new Date().toISOString(), period: { startDate, endDate }, sites };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Google Search Console Weekly Report (SIP-9)');
  console.log(`   Period: last ${CLI_DAYS} days\n`);

  // Determine which sites to query
  let sites: string[];
  if (CLI_SITE) {
    // Accept bare domain or sc-domain: prefix
    sites = [CLI_SITE.startsWith('sc-domain:') ? CLI_SITE : `sc-domain:${CLI_SITE}`];
  } else if (process.env.GSC_SITES) {
    sites = process.env.GSC_SITES.split(',').map((s) => s.trim());
  } else {
    sites = DEFAULT_SITES;
  }

  // Date range
  const endDate = toDateStr(nDaysAgo(3)); // GSC data has ~3 day lag
  const startDate = toDateStr(nDaysAgo(CLI_DAYS + 3));

  // Previous period for WoW comparison
  const prevEndDate = toDateStr(nDaysAgo(CLI_DAYS + 3));
  const prevStartDate = toDateStr(nDaysAgo(CLI_DAYS * 2 + 3));

  // Build auth
  let auth: OAuth2Client;
  try {
    auth = await buildAuthClient();
  } catch (err) {
    console.error('\n❌ Auth error:', (err as Error).message);
    process.exit(1);
  }

  const webmasters = google.webmasters({ version: 'v3', auth: auth as any });

  const today = toDateStr(new Date());
  let currentSnap = loadSnapshot(today);
  let prevSnap = loadSnapshot(prevStartDate);

  const freshSnapshots: SiteSnapshot[] = [];
  const prevSnapshots: SiteSnapshot[] = [];

  for (const site of sites) {
    try {
      const snap = await fetchSiteData(webmasters, site, startDate, endDate);
      freshSnapshots.push(snap);
      currentSnap = mergeSnapshot(currentSnap, snap);

      const pSnap = await fetchSiteData(webmasters, site, prevStartDate, prevEndDate);
      prevSnapshots.push(pSnap);
      prevSnap = mergeSnapshot(prevSnap, pSnap);
    } catch (err: any) {
      if (err?.code === 403 || err?.status === 403) {
        console.error(
          `  ⚠️  No access to ${site} — verify ownership or service account permission in GSC.`,
        );
      } else if (err?.code === 400 || err?.message?.includes('Invalid site')) {
        console.error(
          `  ⚠️  Site not found in GSC: ${site} — add & verify it at search.google.com/search-console`,
        );
      } else {
        console.error(`  ❌ Error fetching ${site}:`, err?.message ?? err);
      }
    }
  }

  // Save snapshots
  console.log('\n📦 Saving snapshots …');
  saveSnapshot(currentSnap);
  saveSnapshot(prevSnap);

  if (freshSnapshots.length === 0) {
    console.error('\n❌ No data fetched — check credentials and site access.');
    process.exit(1);
  }

  // Print report
  console.log('\n📊 WEEKLY GSC REPORT\n');
  for (const snap of freshSnapshots) {
    const prev = prevSnapshots.find((p) => p.site === snap.site);
    printReport(snap, prev);
  }

  // Save JSON report
  const report = buildJsonReport(freshSnapshots, prevSnapshots);
  const reportFile = path.join(SNAPSHOT_DIR, `report-${today}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 JSON report written → ${reportFile}`);

  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
