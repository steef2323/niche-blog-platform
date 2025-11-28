import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get all sites
    const sites = await base(TABLES.SITES).select().all();
    
    // Get all pages with site links
    const pages = await base(TABLES.PAGES)
      .select({
        filterByFormula: '{Published} = TRUE()'
      })
      .all();
    
    // Get all blog posts with site links  
    const blogPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()'
      })
      .all();

    const siteData = sites.map(site => {
      const siteId = site.id;
      const fields = site.fields as any;
      
      // Count content linked to this site
      const linkedPages = pages.filter(page => {
        const siteField = page.fields.Site;
        return Array.isArray(siteField) && siteField.includes(siteId);
      });
      
      const linkedBlogPosts = blogPosts.filter(post => {
        const siteField = post.fields.Site;
        return Array.isArray(siteField) && siteField.includes(siteId);
      });
      
      return {
        id: siteId,
        name: fields.Name || 'Unnamed Site',
        domain: fields.Domain,
        localDomain: fields['Local domain'],
        pagesCount: linkedPages.length,
        blogPostsCount: linkedBlogPosts.length,
        hasHomePage: linkedPages.some(p => p.fields.Page === 'Home'),
        pageIds: linkedPages.map(p => p.id),
        blogPostIds: linkedBlogPosts.map(p => p.id)
      };
    });

    return NextResponse.json({
      sites: siteData,
      totalSites: sites.length,
      totalPages: pages.length,
      totalBlogPosts: blogPosts.length
    });
  } catch (error) {
    console.error('Error in debug sites API:', error);
    return NextResponse.json(
      { error: 'Failed to debug sites', details: error },
      { status: 500 }
    );
  }
} 