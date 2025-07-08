import { BlogPost, ListingPost, Site, Page, Feature } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

/**
 * Helper function to ensure base is available (server-side only)
 */
function ensureServerSide() {
  if (!base) {
    throw new AirtableError(
      'Airtable functions can only be called server-side',
      undefined,
      'ensureServerSide',
      'Base is not initialized - likely running on client-side'
    );
  }
}

/**
 * Bulk content interface for efficient data handling
 */
export interface BulkContentData {
  sites: Site[];
  blogPosts: BlogPost[];
  listingPosts: ListingPost[];
  pages: Page[];
  features: Feature[];
  timestamp: number;
}

/**
 * Get all published content in parallel for maximum efficiency
 * Reduces API calls from 6+ per page to 1 bulk call
 */
export async function getAllPublishedContent(): Promise<BulkContentData> {
  try {
    ensureServerSide();
    console.log('🚀 Bulk fetching all content - single API call strategy');
    
    const startTime = Date.now();
    
    // Fetch all content in parallel for maximum performance
    const [sitesResponse, blogPostsResponse, listingPostsResponse, pagesResponse, featuresResponse] = await Promise.all([
      // Sites - get all active sites
      base(TABLES.SITES)
        .select({
          filterByFormula: '{Active} = "Active"'
        })
        .all(),
      
      // Blog Posts - get all published posts
      base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }]
        })
        .all(),
      
      // Listing Posts - get all published listings
      base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }]
        })
        .all(),
      
      // Pages - get all published pages
      base(TABLES.PAGES)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'ID', direction: 'asc' }]
        })
        .all(),
      
      // Features - get all features
      base(TABLES.FEATURES)
        .select()
        .all()
    ]);

    const endTime = Date.now();
    const fetchTime = endTime - startTime;
    
    // Transform Airtable records to our types
    const sites = sitesResponse.map(record => ({
      ...record.fields,
      id: record.id
    })) as Site[];
    
    const blogPosts = blogPostsResponse.map(record => 
      record.fields as unknown as BlogPost
    );
    
    const listingPosts = listingPostsResponse.map(record => 
      record.fields as unknown as ListingPost
    );
    
    const pages = pagesResponse.map(record => 
      record.fields as unknown as Page
    );
    
    const features = featuresResponse.map(record => 
      record.fields as unknown as Feature
    );

    console.log('✅ Bulk content fetch completed:', {
      fetchTime: `${fetchTime}ms`,
      counts: {
        sites: sites.length,
        blogPosts: blogPosts.length,
        listingPosts: listingPosts.length,
        pages: pages.length,
        features: features.length
      }
    });

    return {
      sites,
      blogPosts,
      listingPosts,
      pages,
      features,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('❌ Error in bulk content fetch:', error);
    throw new AirtableError(
      'Failed to fetch bulk content',
      TABLES.SITES,
      'getAllPublishedContent',
      error
    );
  }
}

/**
 * Get site-specific data efficiently
 * Uses bulk data and filters client-side for performance
 */
export async function getSiteDataOptimized(domain: string, bulkData?: BulkContentData): Promise<{
  site: Site | null;
  blogPosts: BlogPost[];
  listingPosts: ListingPost[];
  pages: Page[];
  features: Feature[];
  homepageContent: Page | null;
}> {
  try {
    ensureServerSide();
    
    // Get bulk data if not provided
    const data = bulkData || await getAllPublishedContent();
    
    console.log(`🔍 Filtering content for domain: ${domain}`);
    
    // Normalize domain for matching
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    
    // Find the site
    let site = data.sites.find(s => 
      s.Domain?.toLowerCase() === normalizedDomain ||
      s['Local domain']?.toLowerCase() === normalizedDomain
    );
    
    // Fallback to first active site if no match (for development)
    if (!site && data.sites.length > 0) {
      site = data.sites.find(s => s.ID === 1) || data.sites[0];
      console.log(`⚠️ No site found for ${normalizedDomain}, using fallback: ${site.Name}`);
    }
    
    if (!site || !site.id) {
      console.log(`❌ No site found for domain: ${domain}`);
      return {
        site: null,
        blogPosts: [],
        listingPosts: [],
        pages: [],
        features: [],
        homepageContent: null
      };
    }
    
    const siteId = site.id;
    console.log(`✅ Found site: ${site.Name} (ID: ${siteId})`);
    
    // Filter content by site ID - CRITICAL for domain-specific content isolation
    const blogPosts = data.blogPosts.filter(post => {
      const siteField = post.Site;
      return Array.isArray(siteField) && siteField.includes(siteId as any);
    });
    
    const listingPosts = data.listingPosts.filter(post => {
      const siteField = post.Site;
      return Array.isArray(siteField) && siteField.includes(siteId as any);
    });
    
    const pages = data.pages.filter(page => {
      const siteField = page.Site;
      return Array.isArray(siteField) && siteField.includes(siteId as any);
    });
    
    const features = data.features.filter(feature => {
      const enabledSites = feature['Enabled sites'];
      return Array.isArray(enabledSites) && enabledSites.includes(siteId as any);
    });
    
    // Find homepage content
    const homepageContent = pages.find(page => page.Page === 'Home') || null;
    
    console.log(`🎯 Filtered content for site ${site.Name}:`, {
      blogPosts: blogPosts.length,
      listingPosts: listingPosts.length,
      pages: pages.length,
      features: features.length,
      hasHomepage: !!homepageContent
    });

    return {
      site,
      blogPosts,
      listingPosts,
      pages,
      features,
      homepageContent
    };

  } catch (error) {
    console.error('❌ Error in optimized site data fetch:', error);
    throw new AirtableError(
      'Failed to get optimized site data',
      TABLES.SITES,
      'getSiteDataOptimized',
      error
    );
  }
}

/**
 * Get combined blog and listing posts for a site (most popular content)
 */
export function getCombinedPostsForSite(
  blogPosts: BlogPost[], 
  listingPosts: ListingPost[], 
  limit?: number
): Array<(BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' })> {
  // Combine and sort by published date (most recent first)
  const allPosts = [
    ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
    ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a['Published date'] || '').getTime();
    const dateB = new Date(b['Published date'] || '').getTime();
    return dateB - dateA; // Most recent first
  });

  // Apply limit if specified
  if (limit && allPosts.length > limit) {
    return allPosts.slice(0, limit);
  }

  return allPosts;
}

/**
 * Get posts by category for a site
 */
export function getPostsByCategoryForSite(
  blogPosts: BlogPost[], 
  listingPosts: ListingPost[]
): { [categoryId: string]: { blogs: BlogPost[], listings: ListingPost[] } } {
  const postsByCategory: { [categoryId: string]: { blogs: BlogPost[], listings: ListingPost[] } } = {};
  
  // Group blog posts by category
  blogPosts.forEach(post => {
    if (post.Categories && Array.isArray(post.Categories)) {
      post.Categories.forEach(categoryRef => {
        const categoryId = typeof categoryRef === 'string' ? categoryRef : categoryRef.id;
        if (!postsByCategory[categoryId]) {
          postsByCategory[categoryId] = { blogs: [], listings: [] };
        }
        postsByCategory[categoryId].blogs.push(post);
      });
    }
  });
  
  // Group listing posts by category
  listingPosts.forEach(post => {
    if (post.Categories && Array.isArray(post.Categories)) {
      post.Categories.forEach(categoryRef => {
        const categoryId = typeof categoryRef === 'string' ? categoryRef : categoryRef.id;
        if (!postsByCategory[categoryId]) {
          postsByCategory[categoryId] = { blogs: [], listings: [] };
        }
        postsByCategory[categoryId].listings.push(post);
      });
    }
  });
  
  return postsByCategory;
} 