/**
 * Fetches redirects from Airtable for a specific site
 * Only fetches posts that have redirect status and redirect URL set
 */

import base, { TABLES } from '@/lib/airtable/config';

// Ensure we're on the server side
function ensureServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
}

/**
 * Fetch all redirects for a site from Airtable
 * @param siteId The site ID
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Map of slug → redirectUrl
 */
export async function fetchRedirectsFromAirtable(
  siteId: string,
  viewName?: string
): Promise<Map<string, string>> {
  ensureServerSide();
  
  const redirects = new Map<string, string>();
  
  try {
    console.log(`🔍 Fetching redirects for site ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    // Fetch blog posts and listing posts with redirects IN PARALLEL for speed
    const [blogPostsRedirects, listingPostsRedirects] = await Promise.all([
      fetchRedirectsFromTable(TABLES.BLOG_POSTS, siteId, viewName),
      fetchRedirectsFromTable(TABLES.LISTING_POSTS, siteId, viewName)
    ]);
    
    // Merge both maps
    blogPostsRedirects.forEach((url, slug) => redirects.set(slug, url));
    listingPostsRedirects.forEach((url, slug) => redirects.set(slug, url));
    
    console.log(`✅ Found ${redirects.size} total redirects for site ${siteId} (${blogPostsRedirects.size} blog + ${listingPostsRedirects.size} listing)`);
    
    return redirects;
  } catch (error) {
    console.error(`❌ Error fetching redirects for site ${siteId}:`, error);
    return new Map(); // Return empty map on error
  }
}

/**
 * Fetch redirects from a specific table
 */
async function fetchRedirectsFromTable(
  tableName: string,
  siteId: string,
  viewName?: string
): Promise<Map<string, string>> {
  const redirects = new Map<string, string>();
  
  try {
    let records: readonly any[] = [];
    
    if (viewName) {
      // Use view if provided (assumes view is pre-filtered for site)
      // Since view now contains both published and unpublished posts, this should be fast
      try {
        // OPTIMIZED: Only fetch 3 fields and filter for redirects in the query
        // This is much faster than fetching all posts
        records = await base(tableName)
          .select({
            view: viewName,
            fields: ['Slug', 'Redirect status', 'Redirect to'], // Only fetch what we need
            filterByFormula: `AND(
              {Redirect status} != "",
              {Redirect to} != "",
              FIND("redirect", LOWER({Redirect status})) > 0
            )`,
            maxRecords: 100, // Limit to 100 redirects per table (should be plenty)
          })
          .all();
        
        console.log(`✅ Found ${records.length} redirects in view "${viewName}" for ${tableName}`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback
      }
    }
    
    // Fallback: Only run if view returned 0 results (safety net)
    // Since the view now contains both published and unpublished posts,
    // the fallback should rarely be needed, but we keep it as a safety net
    if (records.length === 0 && !viewName) {
      // Only run fallback if no view was provided
      console.log(`🔄 No view provided, running fallback query for ${tableName}...`);
      try {
        const fallbackRecords = await base(tableName)
          .select({
            fields: ['Slug', 'Redirect status', 'Redirect to', 'Site'],
            filterByFormula: `AND(
              Site = "${siteId}",
              {Redirect status} != "",
              {Redirect to} != "",
              FIND("redirect", LOWER({Redirect status})) > 0
            )`,
          })
          .all();
        
        console.log(`✅ Found ${fallbackRecords.length} redirects via fallback query for ${tableName}`);
        records = fallbackRecords;
      } catch (fallbackError) {
        console.error(`Error in fallback query for ${tableName}:`, fallbackError);
      }
    } else if (records.length > 0) {
      console.log(`✅ Using ${records.length} redirects from view for ${tableName}`);
    } else {
      console.log(`ℹ️ No redirects found in view for ${tableName}`);
    }
    
    // Process records and build redirect map
    for (const record of records) {
      const slug = record.fields.Slug;
      const redirectTo = record.fields['Redirect to'];
      
      if (slug && redirectTo && typeof redirectTo === 'string') {
        const trimmedUrl = redirectTo.trim();
        if (trimmedUrl.length > 0) {
          redirects.set(slug, trimmedUrl);
        }
      }
    }
    
    console.log(`✅ Found ${redirects.size} redirects in ${tableName} for site ${siteId}`);
    
    return redirects;
  } catch (error) {
    console.error(`❌ Error fetching redirects from ${tableName}:`, error);
    return new Map();
  }
}

