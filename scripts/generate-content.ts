#!/usr/bin/env npx ts-node
/**
 * AI Content Generation Pipeline (SIP-7)
 *
 * Usage:
 *   npx ts-node scripts/generate-content.ts --keyword-id <airtable-record-id> --site-id <airtable-record-id>
 *   npx ts-node scripts/generate-content.ts --keyword "sip and paint amsterdam" --site-id <airtable-record-id>
 *   npx ts-node scripts/generate-content.ts --batch --site-id <airtable-record-id> --limit 5
 *
 * Required env vars:
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID, ANTHROPIC_API_KEY
 *
 * Pipeline: keyword → intent analysis → outline → article (Claude) → Airtable draft
 *
 * Blog post structure:
 *   H1, Introduction, H2.1+Text2.1, H2.2+Text2.2, H2.3+Text2.3 (FAQ),
 *   H2.4 (CTA heading), Conclusion, Meta title, Meta description, Slug, Links
 */

import * as dotenv from 'dotenv';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Load env from .env.local (project root)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ───────────────────────────────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appLWyLAepvyyUfed';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Keyword {
  id: string;
  keyword: string;
  searchVolume?: number;
  country?: string;
}

interface SiteInfo {
  id: string;
  name: string;
  domain: string;
  language: string;
  contentTone?: string;
  promptInput?: string;
}

interface GeneratedArticle {
  h1: string;
  slug: string;
  introduction: string;
  h2_1: string;
  text2_1: string;
  h2_2: string;
  text2_2: string;
  h2_3: string;
  text2_3: string; // FAQ section
  h2_4: string;
  conclusion: string;
  metaTitle: string;
  metaDescription: string;
  suggestedInternalLinks: string;
  mainQuestion: string;
  contentType: string;
}

// ─── Airtable helpers ─────────────────────────────────────────────────────────

async function airtableGet(table: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${AIRTABLE_BASE_URL}/${encodeURIComponent(table)}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Airtable GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function airtableGetRecord(table: string, recordId: string): Promise<any> {
  const res = await fetch(`${AIRTABLE_BASE_URL}/${encodeURIComponent(table)}/${recordId}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Airtable GET record ${recordId} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function airtableCreate(table: string, fields: Record<string, any>): Promise<any> {
  const res = await fetch(`${AIRTABLE_BASE_URL}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable CREATE in ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Keyword fetching ─────────────────────────────────────────────────────────

async function fetchKeywordById(id: string): Promise<Keyword> {
  const record = await airtableGetRecord('Keywords', id);
  return {
    id: record.id,
    keyword: record.fields['Keyword'],
    searchVolume: record.fields['Search Volume'],
    country: record.fields['Country'],
  };
}

async function fetchKeywordByText(keyword: string): Promise<Keyword | null> {
  const data = await airtableGet('Keywords', {
    filterByFormula: `LOWER({Keyword}) = "${keyword.toLowerCase()}"`,
    maxRecords: '1',
  });
  if (!data.records?.length) return null;
  const record = data.records[0];
  return {
    id: record.id,
    keyword: record.fields['Keyword'],
    searchVolume: record.fields['Search Volume'],
    country: record.fields['Country'],
  };
}

async function fetchUnprocessedKeywords(siteId: string, limit: number): Promise<Keyword[]> {
  // Fetch keywords not yet linked to any blog post for this site
  const data = await airtableGet('Keywords', {
    filterByFormula: `AND({Blog Posts} = "", OR({Country} = "Netherlands", {Country} = ""))`,
    maxRecords: String(limit),
    sort: JSON.stringify([{ field: 'Search Volume', direction: 'desc' }]),
  });
  return (data.records || []).map((r: any) => ({
    id: r.id,
    keyword: r.fields['Keyword'],
    searchVolume: r.fields['Search Volume'],
    country: r.fields['Country'],
  }));
}

// ─── Site fetching ────────────────────────────────────────────────────────────

async function fetchSite(siteId: string): Promise<SiteInfo> {
  const record = await airtableGetRecord('Sites', siteId);
  return {
    id: record.id,
    name: record.fields['Name'] || '',
    domain: record.fields['Domain'] || '',
    language: record.fields['Language'] || 'English',
    contentTone: record.fields['Content tone'],
    promptInput: record.fields['Prompt input'],
  };
}

// ─── Claude generation ────────────────────────────────────────────────────────

function buildSystemPrompt(site: SiteInfo): string {
  const lang = site.language === 'Dutch' ? 'Dutch (Nederlands)' : 'English';
  const tone = site.contentTone || 'friendly and informative';
  const customInstructions = site.promptInput ? `\n\nSite-specific instructions:\n${site.promptInput}` : '';

  return `You are an expert SEO content writer for ${site.name} (${site.domain}), a website about sip & paint events in the Netherlands.

Language: ${lang}
Tone: ${tone}
Target audience: Dutch residents looking for creative social activities (sip & paint, paint & sip, painting with wine)
Goal: Rank #1 in Dutch search results for sip & paint related queries${customInstructions}

Rules:
- Write in ${lang}
- Use natural, ${tone} tone
- Include target keyword naturally (3-5 times, not stuffed)
- Structured for featured snippets and People Also Ask
- Rich text sections should use markdown: **bold**, *italic*, bullet lists (- item), numbered lists
- FAQ answers should be 40-80 words each, directly answering the question
- Internal link suggestions should reference real topic areas: [sip and paint amsterdam](/sip-en-paint-amsterdam), [sip and paint rotterdam](/sip-en-paint-rotterdam), etc.
- All dates/events should be generic (no specific dates)
- Never fabricate specific business names or prices`;
}

function buildUserPrompt(keyword: Keyword, site: SiteInfo): string {
  const isNL = site.language === 'Dutch';
  const vol = keyword.searchVolume ? ` (search volume: ${keyword.searchVolume}/mo)` : '';

  return `Generate a complete SEO blog post for the keyword: "${keyword.keyword}"${vol}

Return a JSON object with EXACTLY these fields:
{
  "h1": "H1 heading containing the keyword",
  "slug": "url-safe-slug-from-keyword",
  "introduction": "150-200 word intro paragraph that hooks the reader and contains the keyword in first 100 chars. Markdown.",
  "h2_1": "First H2 heading (informational/topic)",
  "text2_1": "300-400 word body for section 1. Use bullet lists or numbered steps where appropriate. Markdown.",
  "h2_2": "Second H2 heading (tips/advice/how-to)",
  "text2_2": "300-400 word body for section 2. Markdown.",
  "h2_3": "${isNL ? 'Veelgestelde vragen' : 'Frequently Asked Questions'}",
  "text2_3": "4-5 FAQ Q&A pairs. Format each as:\\n\\n**Q: [question]**\\n\\n[answer in 40-80 words]\\n",
  "h2_4": "${isNL ? 'Boek je sip & paint ervaring' : 'Book Your Sip & Paint Experience'}",
  "conclusion": "100-150 word conclusion with soft CTA to explore the site. Markdown.",
  "metaTitle": "SEO meta title (55-60 chars) with keyword near start",
  "metaDescription": "Meta description (140-155 chars) with keyword and CTA",
  "suggestedInternalLinks": "3-5 suggested internal links as markdown: [anchor text](/slug)",
  "mainQuestion": "The core question this article answers (1 sentence)",
  "contentType": "${isNL ? 'Informational' : 'Informational'}"
}

IMPORTANT: Return valid JSON only — no markdown code blocks, no extra text.`;
}

async function generateArticle(keyword: Keyword, site: SiteInfo): Promise<GeneratedArticle> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local or export it in your shell.');
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  console.log(`  🤖 Calling Claude (${MODEL}) for "${keyword.keyword}"...`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(site),
    messages: [{ role: 'user', content: buildUserPrompt(keyword, site) }],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip any accidental markdown fences
  const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: GeneratedArticle;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Claude JSON response:\n', rawText.substring(0, 500));
    throw new Error('Claude returned invalid JSON');
  }

  return parsed;
}

// ─── Airtable write ───────────────────────────────────────────────────────────

async function writeDraftToAirtable(
  article: GeneratedArticle,
  keyword: Keyword,
  site: SiteInfo
): Promise<string> {
  const fields: Record<string, any> = {
    'H1': article.h1,
    'Slug': article.slug,
    'Introduction': article.introduction,
    'H2.1': article.h2_1,
    'Text2.1': article.text2_1,
    'H2.2': article.h2_2,
    'Text2.2': article.text2_2,
    'H2.3': article.h2_3,
    'Text2.3': article.text2_3,
    'H2.4': article.h2_4,
    'Conclusion': article.conclusion,
    'Meta title': article.metaTitle,
    'Meta description': article.metaDescription,
    'Links': article.suggestedInternalLinks,
    'Main question': article.mainQuestion,
    'Content type': article.contentType,
    'Status': 'Draft',
    'Published': false,
    'Site': [{ id: site.id }],
    'Main keyword': [{ id: keyword.id }],
    'Notes': `Generated by AI pipeline on ${new Date().toISOString().slice(0, 10)} | Keyword: ${keyword.keyword} | Search volume: ${keyword.searchVolume ?? 'unknown'}/mo`,
  };

  const record = await airtableCreate('Blog posts', fields);
  return record.id;
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function processKeyword(keyword: Keyword, site: SiteInfo): Promise<void> {
  console.log(`\n🔍 Processing keyword: "${keyword.keyword}" (${keyword.searchVolume ?? '?'}/mo)`);

  // Step 1: Intent analysis (baked into the Claude prompt)
  console.log(`  📊 Intent analysis → informational/transactional (handled by Claude)`);

  // Step 2: Generate article via Claude
  const article = await generateArticle(keyword, site);

  console.log(`  ✅ Generated: "${article.h1}"`);
  console.log(`     Slug: /${article.slug}`);
  console.log(`     Meta: ${article.metaTitle}`);

  // Step 3: Write to Airtable
  const recordId = await writeDraftToAirtable(article, keyword, site);
  console.log(`  💾 Saved to Airtable: ${recordId}`);
  console.log(`     https://airtable.com/${AIRTABLE_BASE_ID}/Blog posts/${recordId}`);
}

async function main(): Promise<void> {
  // Validate env
  if (!AIRTABLE_API_KEY) throw new Error('AIRTABLE_API_KEY is required');
  if (!ANTHROPIC_API_KEY) {
    console.error('\n❌ ANTHROPIC_API_KEY is not set.');
    console.error('   Add it to .env.local: ANTHROPIC_API_KEY="sk-ant-..."');
    console.error('   Or export it: export ANTHROPIC_API_KEY="sk-ant-..."\n');
    process.exit(1);
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const has = (flag: string): boolean => args.includes(flag);

  const keywordId = get('--keyword-id');
  const keywordText = get('--keyword');
  const siteId = get('--site-id');
  const batch = has('--batch');
  const limit = parseInt(get('--limit') || '5', 10);

  if (!siteId) {
    console.error('Usage: npx ts-node scripts/generate-content.ts --site-id <id> [--keyword-id <id> | --keyword <text> | --batch [--limit N]]');
    console.error('\nActive site IDs:');
    console.error('  sipandpaints.nl   → recORZQLJbwzLsVU0');
    console.error('  sipenpaints.nl    → recnn2AatU9qhOKxF');
    process.exit(1);
  }

  console.log('\n🚀 AI Content Generation Pipeline starting...');
  console.log(`   Base: ${AIRTABLE_BASE_ID}`);
  console.log(`   Model: ${MODEL}`);

  // Fetch site info
  const site = await fetchSite(siteId);
  console.log(`   Site: ${site.name} (${site.language})`);

  // Resolve keyword(s)
  let keywords: Keyword[] = [];

  if (keywordId) {
    keywords = [await fetchKeywordById(keywordId)];
  } else if (keywordText) {
    const kw = await fetchKeywordByText(keywordText);
    if (!kw) {
      console.error(`Keyword "${keywordText}" not found in Airtable Keywords table.`);
      process.exit(1);
    }
    keywords = [kw];
  } else if (batch) {
    keywords = await fetchUnprocessedKeywords(siteId, limit);
    if (!keywords.length) {
      console.log('No unprocessed keywords found. Add keywords to the Airtable Keywords table.');
      process.exit(0);
    }
    console.log(`   Batch mode: ${keywords.length} keywords to process`);
  } else {
    console.error('Specify --keyword-id, --keyword, or --batch');
    process.exit(1);
  }

  // Process
  let success = 0;
  let failed = 0;

  for (const keyword of keywords) {
    try {
      await processKeyword(keyword, site);
      success++;
      // Rate limit: 1 request per 2 seconds to stay within Airtable limits
      if (keywords.length > 1) await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ❌ Failed for "${keyword.keyword}":`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n✅ Done. ${success} generated, ${failed} failed.`);
  if (success > 0) {
    console.log(`   Review drafts: https://airtable.com/${AIRTABLE_BASE_ID}`);
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
