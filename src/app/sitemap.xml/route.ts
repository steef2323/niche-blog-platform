import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteConfig } from '@/lib/site-detection';
import { 
  getBlogPostsBySiteId, 
  getListingPostsBySiteId, 
  getCategoriesBySiteId,
  getAuthorsBySiteId
} from '@/lib/airtable/content';
import { BlogPost, ListingPost, Author, Category } from '@/types/airtable';

export async function GET(request: NextRequest) {
  try {
    // Get the host from headers
    const headersList = headers();
    const host = headersList.get('host') || '';
    
    // Get the site config (uses static config with views)
    const siteConfig = await getSiteConfig(host);
    
    if (!siteConfig || !siteConfig.site) {
      // Return a basic sitemap if no site is found
      const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${host}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${host}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
      
      return new NextResponse(basicSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }

    const site = siteConfig.site;
    const siteId = siteConfig.siteId;
    const airtableViews = siteConfig.airtableViews;
    
    // Fetch all content for the site using views if available
    const [blogPosts, listingPosts, categories, authors] = await Promise.all([
      getBlogPostsBySiteId(siteId, undefined, airtableViews?.blogPosts),
      getListingPostsBySiteId(siteId, undefined, airtableViews?.listingPosts),
      getCategoriesBySiteId(siteId, airtableViews?.categories),
      getAuthorsBySiteId(siteId, airtableViews?.authors)
    ]);

    // Build the sitemap XML
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const siteUrl = site['Site URL'] || `https://${host}`;

    // Add homepage
    sitemapXml += `
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add blog index page
    sitemapXml += `
  <url>
    <loc>${siteUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Add blog posts
    blogPosts.forEach((post: BlogPost) => {
      const lastmod = post['Published date'] || post['Last updated'] || new Date().toISOString();
      sitemapXml += `
  <url>
    <loc>${siteUrl}/blog/${post.Slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add listing posts
    listingPosts.forEach((post: ListingPost) => {
      const lastmod = post['Published date'] || post['Last updated'] || new Date().toISOString();
      sitemapXml += `
  <url>
    <loc>${siteUrl}/blog/${post.Slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add category pages
    categories.forEach((category: Category) => {
      sitemapXml += `
  <url>
    <loc>${siteUrl}/blog/category/${category.Slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    // Add author pages (only if author has a slug-like identifier)
    authors.forEach((author: Author) => {
      // Use author ID as slug since Author type doesn't have a Slug field
      const authorSlug = author.id || author.ID?.toString() || author.Name?.toLowerCase().replace(/\s+/g, '-');
      if (authorSlug) {
        sitemapXml += `
  <url>
    <loc>${siteUrl}/blog/author/${authorSlug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    });

    // Close the XML
    sitemapXml += `
</urlset>`;

    return new NextResponse(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap.xml:', error);
    
    // Return a fallback sitemap in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${headers().get('host') || 'localhost'}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${headers().get('host') || 'localhost'}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
} 