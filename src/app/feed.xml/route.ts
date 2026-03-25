import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteConfig } from '@/lib/site-detection';
import { getBlogPostsBySiteId } from '@/lib/airtable/content';
import { BlogPost } from '@/types/airtable';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: NextRequest) {
  const headersList = headers();
  const host = headersList.get('host') || '';

  try {
    const siteConfig = await getSiteConfig(host);

    if (!siteConfig || !siteConfig.site) {
      return new NextResponse('Site not found', { status: 404 });
    }

    const site = siteConfig.site;
    const siteId = siteConfig.siteId;
    const airtableViews = siteConfig.airtableViews;

    const blogPosts = await getBlogPostsBySiteId(siteId, undefined, airtableViews?.blogPosts);

    const siteUrl = (site['Site URL'] || `https://${host}`).replace(/\/$/, '');
    const siteTitle = escapeXml(site.Name || site.Domain || host);
    const siteDescription = escapeXml(site['Default meta description'] || `${site.Name || host} blog`);
    const siteLanguage = (site.Language || 'nl').toLowerCase();

    // Sort by published date descending, limit to 20
    const sortedPosts = [...blogPosts]
      .filter((p: BlogPost) => p.Published && p.Slug)
      .sort((a: BlogPost, b: BlogPost) => {
        const dateA = a['Published date'] || a['Last updated'] || '';
        const dateB = b['Published date'] || b['Last updated'] || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 20);

    const items = sortedPosts.map((post: BlogPost) => {
      const title = escapeXml(post.H1 || post.Title || post.Slug);
      const link = `${siteUrl}/blog/${post.Slug}`;
      const description = escapeXml(post['Meta description'] || post.Introduction || '');
      const pubDate = new Date(post['Published date'] || post['Last updated'] || Date.now()).toUTCString();
      const authorName = post.AuthorDetails?.Name
        ? escapeXml(post.AuthorDetails.Name)
        : '';

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>${authorName ? `\n      <author>${authorName}</author>` : ''}
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>${siteLanguage}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating feed.xml:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
