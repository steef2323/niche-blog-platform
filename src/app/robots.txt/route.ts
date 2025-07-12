import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteByDomain } from '@/lib/airtable/sites';

export async function GET(request: NextRequest) {
  try {
    // Get the host from headers
    const headersList = headers();
    const host = headersList.get('host') || '';
    
    // Get the site data from Airtable
    const site = await getSiteByDomain(host);
    
    if (!site) {
      // Return a basic robots.txt if no site is found
      const basicRobotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /_next/static/
Disallow: /_next/image/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /draft/

# AI Bot Protection
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
Disallow: /

Sitemap: https://${host}/sitemap.xml`;
      
      return new NextResponse(basicRobotsTxt, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }

    // Build the robots.txt content
    let robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /_next/static/
Disallow: /_next/image/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /draft/`;

    // Add site-specific disallow rules from Airtable if they exist
    if (site['Custom robots.txt rules']) {
      robotsTxt += `\n${site['Custom robots.txt rules']}`;
    }

    // Add crawl delay if specified in Airtable
    if (site['Crawl delay']) {
      robotsTxt += `\nCrawl-delay: ${site['Crawl delay']}`;
    }

    // Add AI Bot Protection
    robotsTxt += `\n
# AI Bot Protection
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

    // Add sitemap reference
    const siteUrl = site['Site URL'] || `https://${host}`;
    robotsTxt += `\n\nSitemap: ${siteUrl}/sitemap.xml`;

    // Add site-specific user agent rules if they exist
    if (site['Custom user agent rules']) {
      robotsTxt += `\n\n${site['Custom user agent rules']}`;
    }

    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    // Return a fallback robots.txt in case of error
    const fallbackRobotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /_next/static/
Disallow: /_next/image/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /draft/

# AI Bot Protection
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
Disallow: /

Sitemap: https://${headers().get('host') || 'localhost'}/sitemap.xml`;
    
    return new NextResponse(fallbackRobotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
} 