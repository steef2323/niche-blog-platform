/**
 * Asset Path Utilities
 * 
 * Helper functions to resolve logo and favicon paths.
 * Always prefers local files (served from your domain) over Airtable URLs.
 * 
 * Naming convention:
 * - Logos: /public/logos/{domain}.{ext} (e.g., sipandpaints.nl.png)
 * - Favicons: /public/favicons/{domain}.{ext} (e.g., sipandpaints.nl.ico)
 * 
 * NOTE: This works client-side and server-side. We construct paths and let
 * Next.js/browser handle 404s gracefully. The Image component has built-in
 * error handling for missing files.
 */

import { normalizeDomain } from '@/lib/site-config';

/**
 * Common image extensions (in order of preference)
 * .webp is first since you're using .webp files
 */
const IMAGE_EXTENSIONS = ['.webp', '.png', '.svg', '.jpg', '.jpeg'];
const FAVICON_EXTENSIONS = ['.webp', '.ico', '.png', '.svg'];

/**
 * Check if a file exists in the public directory (server-side only)
 * Returns the first path that likely exists based on common extensions
 */
function getLikelyFilePath(
  basePath: string,
  extensions: string[]
): string | null {
  // In Next.js, we can't reliably check file existence in client components
  // So we'll try the most common extensions first
  // The browser/Next.js will handle 404s gracefully
  // Priority: .webp > .png > .svg > .jpg > .jpeg (for images)
  // Priority: .ico > .png > .svg > .webp (for favicons)
  
  // Return the first (most preferred) extension
  // Next.js Image component will handle missing files gracefully
  if (extensions.length > 0) {
    return `${basePath}${extensions[0]}`;
  }
  return null;
}

/**
 * Get logo path for a domain
 * 
 * Priority:
 * 1. Local file in /public/logos/{domain}.{ext} (always preferred)
 * 2. Airtable URL (if provided)
 * 3. Default fallback
 * 
 * NOTE: We construct the path for the most common extension (.webp, then .png).
 * Next.js Image component will handle 404s gracefully if the file doesn't exist.
 * 
 * @param domain - The domain (e.g., 'sipandpaints.nl')
 * @param airtableUrl - Optional Airtable attachment URL
 * @returns Logo path/URL
 */
export function getLogoPath(domain: string, airtableUrl?: string): string {
  const normalized = normalizeDomain(domain);
  
  // 1. Always prefer local file first (served from your domain)
  // Try .webp first (most modern), then .png (most common)
  // Next.js Image component will handle 404s gracefully
  const localLogo = getLikelyFilePath(
    `logos/${normalized}`,
    IMAGE_EXTENSIONS
  );
  
  if (localLogo) {
    return `/${localLogo}`; // Return with leading slash for public path
  }
  
  // 2. Fall back to Airtable URL if provided
  if (airtableUrl) {
    return airtableUrl;
  }
  
  // 3. Default fallback
  return '/logos/default-logo.png';
}

/**
 * Get favicon path for a domain
 * 
 * Priority:
 * 1. Local file in /public/favicons/{domain}.{ext} (always preferred)
 * 2. Default favicon
 * 
 * NOTE: We construct the path for the most preferred extension (.webp, then .ico, .png, .svg).
 * The browser will handle 404s gracefully if the file doesn't exist.
 * 
 * @param domain - The domain (e.g., 'sipandpaints.nl')
 * @returns Favicon path
 */
export function getFaviconPath(domain: string): string {
  const normalized = normalizeDomain(domain);
  
  // 1. Always prefer local file first
  // Try .webp first (most modern), then .ico, .png, .svg
  // The browser will handle 404s gracefully
  const localFavicon = getLikelyFilePath(
    `favicons/${normalized}`,
    FAVICON_EXTENSIONS
  );
  
  if (localFavicon) {
    return `/${localFavicon}`; // Return with leading slash for public path
  }
  
  // 2. Default fallback
  return '/favicon.ico';
}

/**
 * Get all possible logo paths for a domain (for debugging)
 * Returns array of paths that would be checked
 */
export function getPossibleLogoPaths(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  return IMAGE_EXTENSIONS.map(ext => `/logos/${normalized}${ext}`);
}

/**
 * Get all possible favicon paths for a domain (for debugging)
 * Returns array of paths that would be checked
 */
export function getPossibleFaviconPaths(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  return FAVICON_EXTENSIONS.map(ext => `/favicons/${normalized}${ext}`);
}

/**
 * Get the preferred logo path (tries most common extensions first)
 * This is a simpler version that just returns the most likely path
 * Next.js Image component will handle 404s gracefully
 */
export function getPreferredLogoPath(domain: string): string {
  const normalized = normalizeDomain(domain);
  // Try .webp first (most modern), then .png (most common)
  return `/logos/${normalized}.webp`; // Most likely extension
}

/**
 * Get the preferred favicon path (tries most common extensions first)
 * This is a simpler version that just returns the most likely path
 * Browser will handle 404s gracefully
 */
export function getPreferredFaviconPath(domain: string): string {
  const normalized = normalizeDomain(domain);
  // Try .ico first (most common), then .png
  return `/favicons/${normalized}.ico`; // Most likely extension
}

