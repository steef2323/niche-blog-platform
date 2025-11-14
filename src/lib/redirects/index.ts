/**
 * Main redirect management module
 * Handles fetching, caching, and refreshing redirects
 */

import { getRedirectFromCache, setRedirectsInCache, isCacheValid, clearRedirectCache } from './cache';
import { fetchRedirectsFromAirtable } from './fetcher';
import { getSiteConfig } from '@/lib/site-detection';

// Track which sites have background refresh started
const backgroundRefreshStarted = new Set<string>();

/**
 * Get redirect URL for a slug, with automatic cache management
 * @param host The request host (e.g., 'localhost:3000' or 'sipandpaints.nl')
 * @param slug The post slug
 * @returns Redirect URL or null if no redirect
 */
export async function getRedirectUrl(host: string, slug: string): Promise<string | null> {
  try {
    // Get site config to find siteId and view name
    const siteConfig = await getSiteConfig(host);
    
    if (!siteConfig?.siteId) {
      return null;
    }
    
    const { siteId, airtableViews } = siteConfig;
    
    // Start background refresh on first request for this site (lazy initialization)
    if (!backgroundRefreshStarted.has(siteId)) {
      backgroundRefreshStarted.add(siteId);
      // Import dynamically to avoid circular dependencies
      import('./background-refresh').then(({ startBackgroundRefresh }) => {
        startBackgroundRefresh(host);
      }).catch(error => {
        console.error(`Error starting background refresh for ${host}:`, error);
      });
    }
    
    // Check cache first
    const cachedRedirect = getRedirectFromCache(siteId, slug);
    if (cachedRedirect) {
      console.log(`✅ Redirect cache hit for ${slug} → ${cachedRedirect}`);
      return cachedRedirect;
    }
    
    // Cache miss or expired - fetch redirects now (await on first request)
    if (!isCacheValid(siteId)) {
      console.log(`🔄 Cache miss for ${slug}, fetching redirects for site ${siteId}...`);
      try {
        // On cache miss, we need to fetch immediately (not in background)
        // This ensures redirects work on first request
        // Use Promise.race to timeout after 2 seconds to avoid blocking too long
        const fetchPromise = refreshRedirectsForSite(siteId, airtableViews?.blogPosts);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redirect fetch timeout')), 2000)
        );
        
        await Promise.race([fetchPromise, timeoutPromise]);
        
        // Check cache again after refresh
        const refreshedRedirect = getRedirectFromCache(siteId, slug);
        if (refreshedRedirect) {
          console.log(`✅ Found redirect after refresh: ${slug} → ${refreshedRedirect}`);
          return refreshedRedirect;
        }
      } catch (error) {
        // If fetch fails or times out, continue without redirect (page component will handle it)
        console.error(`Error refreshing redirects for site ${siteId}:`, error);
      }
    }
    
    // Return null if not in cache (will be handled by page component)
    console.log(`❌ No redirect found for ${slug} in cache`);
    return null;
  } catch (error) {
    console.error(`Error getting redirect URL for ${host}/${slug}:`, error);
    return null;
  }
}

/**
 * Refresh redirects for a specific site
 * @param siteId The site ID
 * @param viewName Optional view name for blog posts
 */
export async function refreshRedirectsForSite(
  siteId: string,
  viewName?: string
): Promise<void> {
  try {
    console.log(`🔄 Refreshing redirects for site ${siteId}...`);
    
    const redirects = await fetchRedirectsFromAirtable(siteId, viewName);
    
    // Update cache
    setRedirectsInCache(siteId, redirects);
    
    console.log(`✅ Successfully refreshed ${redirects.size} redirects for site ${siteId}`);
  } catch (error) {
    console.error(`❌ Error refreshing redirects for site ${siteId}:`, error);
    throw error;
  }
}

/**
 * Initialize redirect cache for all sites (call on server startup)
 * This pre-warms the cache so first requests are fast
 */
export async function initializeRedirectCache(hosts: string[]): Promise<void> {
  console.log(`🚀 Initializing redirect cache for ${hosts.length} sites...`);
  
  const promises = hosts.map(async (host) => {
    try {
      const siteConfig = await getSiteConfig(host);
      if (siteConfig?.siteId) {
        await refreshRedirectsForSite(
          siteConfig.siteId,
          siteConfig.airtableViews?.blogPosts
        );
      }
    } catch (error) {
      console.error(`Error initializing cache for ${host}:`, error);
    }
  });
  
  await Promise.all(promises);
  
  console.log(`✅ Redirect cache initialization complete`);
}

/**
 * Clear redirect cache (useful for testing or manual invalidation)
 */
export { clearRedirectCache };

