/**
 * Next.js CSS, JS, and site images live under /_next/ and /api/image-proxy.
 * Google needs those files to render pages and index images, so they must
 * stay allowed. Explicit Allow rules also override Disallow: /*?* (query
 * strings), which would otherwise block /_next/image?url=... and
 * /api/image-proxy?url=...
 */
const ASSET_ALLOW_RULES = `Allow: /_next/static/
Allow: /_next/image
Allow: /api/image-proxy`;

export const STANDARD_ROBOTS_RULES = `User-agent: *
Allow: /
${ASSET_ALLOW_RULES}

Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /draft/

# Block duplicate parameter URLs (preserve crawl budget)
Disallow: /*?*

# Block debug and test endpoints from crawlers
Disallow: /api/test-*
Disallow: /api/debug-*
Disallow: /api/fetch-all-sites
Disallow: /api/list-tables
Disallow: /api/create-*
Disallow: /api/fix-*
Disallow: /api/update-*
Disallow: /site-switcher
Disallow: /port-testing`;

const AI_BOT_RULES = `# AI Bot Protection
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Omgilibot
Disallow: /`;

export function buildRobotsTxt({
  sitemapUrl,
  customRules,
  crawlDelay,
  customUserAgentRules,
}: {
  sitemapUrl: string;
  customRules?: string;
  crawlDelay?: number;
  customUserAgentRules?: string;
}): string {
  let robotsTxt = STANDARD_ROBOTS_RULES;

  if (customRules) {
    robotsTxt += `\n${customRules}`;
  }

  if (crawlDelay) {
    robotsTxt += `\nCrawl-delay: ${crawlDelay}`;
  }

  // Repeat Allow after custom rules so query-string Disallow: /*?* cannot
  // win on first-match crawlers. Google uses longest-match either way.
  robotsTxt += `\n\n${ASSET_ALLOW_RULES}`;
  robotsTxt += `\n\n${AI_BOT_RULES}`;
  robotsTxt += `\n\nSitemap: ${sitemapUrl}`;

  if (customUserAgentRules) {
    robotsTxt += `\n\n${customUserAgentRules}`;
  }

  return robotsTxt;
}
