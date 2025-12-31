/**
 * Image Proxy Utilities
 * 
 * Converts Airtable CDN URLs to proxy URLs served from your own domain.
 * This hides the relationship between sites by making all images appear
 * to be hosted on each site's own domain.
 */

/**
 * Check if a URL is from Airtable CDN
 */
export function isAirtableUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('airtableusercontent.com') ||
      urlObj.hostname.includes('dl.airtable.com')
    );
  } catch {
    // If URL parsing fails, check if it contains Airtable domain
    return url.includes('airtableusercontent.com') || url.includes('dl.airtable.com');
  }
}

/**
 * Convert an Airtable CDN URL to a proxy URL
 * 
 * @param airtableUrl - The original Airtable CDN URL
 * @returns Proxy URL served from your own domain, or original URL if not Airtable
 * 
 * @example
 * // Input: https://v5.airtableusercontent.com/xxx/yyy/image.jpg
 * // Output: /api/image-proxy?url=https%3A%2F%2Fv5.airtableusercontent.com%2Fxxx%2Fyyy%2Fimage.jpg
 */
export function getProxiedImageUrl(airtableUrl: string | undefined | null): string {
  if (!airtableUrl) return '';
  
  // If it's not an Airtable URL, return as-is (local images, external images, etc.)
  if (!isAirtableUrl(airtableUrl)) {
    return airtableUrl;
  }

  // Encode the URL for use as a query parameter
  const encodedUrl = encodeURIComponent(airtableUrl);
  
  // Return the proxy URL
  return `/api/image-proxy?url=${encodedUrl}`;
}

/**
 * Convert multiple Airtable URLs to proxy URLs
 * Useful for processing arrays of image URLs
 */
export function getProxiedImageUrls(urls: (string | undefined | null)[]): string[] {
  return urls
    .filter((url): url is string => !!url)
    .map(url => getProxiedImageUrl(url));
}

/**
 * Batch convert URLs (for performance when processing many images)
 */
export function batchProxiedImageUrls(urls: string[]): string[] {
  return urls.map(url => getProxiedImageUrl(url));
}

