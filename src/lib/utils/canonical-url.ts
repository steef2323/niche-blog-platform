/**
 * Canonical URL utilities
 * Ensures canonical URLs are properly normalized and consistent
 */

/**
 * Normalize a canonical URL to ensure consistency
 * - Always uses HTTPS
 * - Removes trailing slashes (except for homepage which should have one)
 * - Ensures consistent format
 * 
 * @param url - The URL to normalize
 * @param isHomepage - Whether this is the homepage (should have trailing slash)
 * @returns Normalized canonical URL
 */
export function normalizeCanonicalUrl(url: string, isHomepage: boolean = false): string {
  if (!url) return url;
  
  // Remove any existing protocol
  let normalized = url.replace(/^https?:\/\//, '');
  
  // Ensure HTTPS protocol
  normalized = `https://${normalized}`;
  
  // Remove trailing slash (we'll add it back for homepage if needed)
  normalized = normalized.replace(/\/$/, '');
  
  // For homepage, ensure trailing slash
  if (isHomepage) {
    normalized = `${normalized}/`;
  }
  
  return normalized;
}

/**
 * Build a canonical URL from site configuration
 * Uses Site URL from Airtable if available, otherwise constructs from domain
 * 
 * @param siteUrl - Site URL from Airtable (may be undefined)
 * @param domain - Domain name (fallback)
 * @param path - Path to append (optional, should not include leading slash for homepage)
 * @returns Canonical URL
 */
export function buildCanonicalUrl(
  siteUrl: string | undefined,
  domain: string,
  path: string = ''
): string {
  // Use Site URL if available, otherwise construct from domain
  const baseUrl = siteUrl || `https://${domain}`;
  
  // Normalize the base URL (remove trailing slash)
  let normalized = baseUrl.replace(/\/$/, '');
  
  // Ensure HTTPS
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  } else if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }
  
  // Add path if provided
  if (path) {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    normalized = `${normalized}${cleanPath}`;
  } else {
    // For homepage, ensure trailing slash
    normalized = `${normalized}/`;
  }
  
  return normalized;
}



