/**
 * In-memory cache for redirects
 * Stores redirects per site to enable fast lookups in middleware
 */

interface RedirectCacheEntry {
  redirects: Map<string, string>; // slug → redirectUrl
  lastUpdated: number;
  ttl: number; // Time to live in milliseconds
}

// Cache storage: Map<siteId, RedirectCacheEntry>
const redirectCache = new Map<string, RedirectCacheEntry>();

// Default TTL: 15 minutes (900,000 ms)
const DEFAULT_TTL = 15 * 60 * 1000;

/**
 * Get redirect URL from cache for a given site and slug
 * @param siteId The site ID
 * @param slug The post slug
 * @returns Redirect URL or null if not found or cache expired
 */
export function getRedirectFromCache(siteId: string, slug: string): string | null {
  const entry = redirectCache.get(siteId);
  
  if (!entry) {
    return null; // Cache miss
  }
  
  // Check if cache is expired
  const now = Date.now();
  if (now - entry.lastUpdated > entry.ttl) {
    // Cache expired, but return the value anyway (stale-while-revalidate pattern)
    // The background refresh will update it
    console.log(`⚠️ Redirect cache expired for site ${siteId}, returning stale value`);
  }
  
  return entry.redirects.get(slug) || null;
}

/**
 * Set redirects in cache for a site
 * @param siteId The site ID
 * @param redirects Map of slug → redirectUrl
 * @param ttl Optional TTL in milliseconds (defaults to 15 minutes)
 */
export function setRedirectsInCache(
  siteId: string,
  redirects: Map<string, string>,
  ttl: number = DEFAULT_TTL
): void {
  redirectCache.set(siteId, {
    redirects,
    lastUpdated: Date.now(),
    ttl,
  });
  
  console.log(`✅ Cached ${redirects.size} redirects for site ${siteId}`);
}

/**
 * Check if cache entry exists and is valid for a site
 * @param siteId The site ID
 * @returns True if cache exists and is not expired
 */
export function isCacheValid(siteId: string): boolean {
  const entry = redirectCache.get(siteId);
  
  if (!entry) {
    return false;
  }
  
  const now = Date.now();
  return (now - entry.lastUpdated) < entry.ttl;
}

/**
 * Clear cache for a specific site
 * @param siteId The site ID (optional, clears all if not provided)
 */
export function clearRedirectCache(siteId?: string): void {
  if (siteId) {
    redirectCache.delete(siteId);
    console.log(`🗑️ Cleared redirect cache for site ${siteId}`);
  } else {
    redirectCache.clear();
    console.log(`🗑️ Cleared all redirect caches`);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  siteCount: number;
  totalRedirects: number;
  sites: Array<{ siteId: string; redirectCount: number; age: number }>;
} {
  const sites = Array.from(redirectCache.entries()).map(([siteId, entry]) => ({
    siteId,
    redirectCount: entry.redirects.size,
    age: Date.now() - entry.lastUpdated,
  }));
  
  return {
    siteCount: redirectCache.size,
    totalRedirects: sites.reduce((sum, s) => sum + s.redirectCount, 0),
    sites,
  };
}

