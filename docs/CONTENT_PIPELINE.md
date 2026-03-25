# AI Content Generation Pipeline

Generates SEO-optimized sip & paint blog posts from Airtable keywords via Claude.

## Setup

1. Pull env vars: `npx vercel env pull .env.local --yes --environment production`
2. Add Anthropic key to `.env.local`: `ANTHROPIC_API_KEY="sk-ant-..."`
3. Also add to Vercel: `npx vercel env add ANTHROPIC_API_KEY production`

## Usage

**Single keyword by Airtable record ID:**
```bash
npm run content:generate -- --site-id recORZQLJbwzLsVU0 --keyword-id rec43lxpylK7DKDUa
```

**Single keyword by text (must exist in Keywords table):**
```bash
npm run content:generate -- --site-id recnn2AatU9qhOKxF --keyword "sip en paint amsterdam"
```

**Batch (process top 5 unprocessed keywords by search volume):**
```bash
npm run content:generate -- --site-id recORZQLJbwzLsVU0 --batch --limit 5
```

## Site IDs

| Site | ID | Language |
|---|---|---|
| sipandpaints.nl | `recORZQLJbwzLsVU0` | English |
| sipenpaints.nl | `recnn2AatU9qhOKxF` | Dutch |
| sipandpaintamsterdam.nl | `recPF6vkupQHSvVd9` | English |

## Output structure in Airtable

Each generated post is written to the **Blog posts** table with:

| Field | Content |
|---|---|
| `H1` | SEO heading with keyword |
| `Slug` | URL slug |
| `Introduction` | 150-200 word hook |
| `H2.1` + `Text2.1` | First content section |
| `H2.2` + `Text2.2` | Second content section |
| `H2.3` + `Text2.3` | FAQ section (4-5 Q&As) |
| `H2.4` | CTA heading |
| `Conclusion` | 100-150 word conclusion |
| `Meta title` | 55-60 char SEO title |
| `Meta description` | 140-155 char description |
| `Links` | 3-5 suggested internal links |
| `Status` | `Draft` |
| `Site` | Linked to the target site |
| `Main keyword` | Linked to the source keyword |
| `Notes` | Generation metadata |

## Review & publish

1. Open Airtable → Blog posts → filter `Status = Draft`
2. Review/edit content as needed
3. Set `Status = Published` and `Published = true` to go live

## Target: 20+ posts/month

Run batch nightly or weekly:
```bash
# 5 posts for Dutch site
npm run content:generate -- --site-id recnn2AatU9qhOKxF --batch --limit 5

# 5 posts for English site
npm run content:generate -- --site-id recORZQLJbwzLsVU0 --batch --limit 5
```
