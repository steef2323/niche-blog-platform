import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getCanonicalOrigin } from '@/lib/utils/canonical-url';

/**
 * Next.js CSS, JS, and optimized images live under /_next/.
 * Google needs those files to render pages, so they must stay allowed.
 * Explicit Allow rules also override Disallow: /*?* (query strings),
 * which would otherwise block /_next/image?url=... and Vercel ?dpl= assets.
 */
const STANDARD_ROBOTS_RULES = `User-agent: *
Allow: /
Allow: /_next/static/
Allow: /_next/image

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

function robotsResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function buildRobotsTxt({
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
  robotsTxt += `\n\nAllow: /_next/static/\nAllow: /_next/image`;
  robotsTxt += `\n\n${AI_BOT_RULES}`;
  robotsTxt += `\n\nSitemap: ${sitemapUrl}`;

  if (customUserAgentRules) {
    robotsTxt += `\n\n${customUserAgentRules}`;
  }

  return robotsTxt;
}

export async function GET(_request: NextRequest) {
  const host = headers().get('host') || '';

  try {
    const site = await getSiteByDomain(host);

    if (!site) {
      return robotsResponse(
        buildRobotsTxt({ sitemapUrl: `${getCanonicalOrigin(host)}/sitemap.xml` })
      );
    }

    const siteUrl = getCanonicalOrigin(host, site['Site URL'], site.Domain);

    return robotsResponse(
      buildRobotsTxt({
        sitemapUrl: `${siteUrl}/sitemap.xml`,
        customRules: site['Custom robots.txt rules'],
        crawlDelay: site['Crawl delay'],
        customUserAgentRules: site['Custom user agent rules'],
      })
    );
  } catch (error) {
    console.error('Error generating robots.txt:', error);

    return robotsResponse(
      buildRobotsTxt({
        sitemapUrl: `${getCanonicalOrigin(host)}/sitemap.xml`,
      })
    );
  }
}
