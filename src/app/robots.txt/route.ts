import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getCanonicalOrigin } from '@/lib/utils/canonical-url';
import { buildRobotsTxt } from '@/lib/utils/robots-txt';

function robotsResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
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
