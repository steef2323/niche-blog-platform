/**
 * Centralized Site Detection System
 * 
 * This module provides a SINGLE entry point for site detection.
 * It fetches all site-related data in parallel for maximum performance.
 * 
 * IMPORTANT: This should be the ONLY place where site detection happens per request.
 * All other code should use the SiteConfig returned from this function.
 */

import { Site, Page, Feature } from '@/types/airtable';
import { getPagesBySiteId } from '@/lib/airtable/sites';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { getHomepageContent } from '@/lib/airtable/content';
import { SiteConfig, getDomainMatchingStrategy, getAirtableViewsForDomain } from './site-config';
import { normalizeDomain } from './site-config';
import { getStaticSiteConfig } from '@/config/sites';

// Simple in-memory cache for complete site configs
type SiteConfigCacheEntry = {
  config: SiteConfig;
  timestamp: number;
};

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (aggressive caching - content changes maybe once a month)
const siteConfigCache = new Map<string, SiteConfigCacheEntry>();

/**
 * Get complete site configuration in a SINGLE optimized call
 * 
 * This function:
 * 1. Normalizes the domain
 * 2. Checks cache first
 * 3. Fetches site, pages, features, and homepage content IN PARALLEL
 * 4. Returns complete SiteConfig with all essential data
 * 
 * @param domain - The domain/host from the request headers
 * @returns Complete site configuration or null if site not found
 */
export async function getSiteConfig(domain: string): Promise<SiteConfig | null> {
  const normalizedDomain = normalizeDomain(domain);
  
  // Check cache first
  const cached = siteConfigCache.get(normalizedDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`⚡ Site config cache hit for: ${normalizedDomain}`);
    return cached.config;
  }

  console.log(`🔍 Fetching site config for: ${normalizedDomain}`);
  const startTime = Date.now();

  try {
    // Step 1: Get static site config (colors, fonts, logo, etc.) from Airtable with caching
    // This is faster and cached for 2 hours since this data rarely changes
    const staticConfig = await getStaticSiteConfig(domain);
    
    if (!staticConfig) {
      console.log(`❌ No static site config found for domain: ${normalizedDomain}`);
      return null;
    }

    const siteId = staticConfig.siteId;
    console.log(`✅ Found static config for: ${staticConfig.domain} (ID: ${siteId})`);

    // Step 2: Fetch dynamic content (pages, features, homepage) in parallel
    // These change more frequently, so we fetch them separately
    // Use Airtable views if available for faster queries
    const [pages, features, homepageContent] = await Promise.all([
      getPagesBySiteId(siteId, staticConfig.airtableViews?.pages),
      getFeaturesBySiteId(siteId, staticConfig.airtableViews?.features),
      getHomepageContent(siteId, staticConfig.airtableViews?.pages) // Use pages view for homepage too
    ]);

    // Step 3: Build Site object from static config + dynamic data
    // This merges the static config (colors, fonts, logo) with dynamic content
    const site: Site = {
      id: siteId,
      Name: staticConfig.siteName || staticConfig.domain, // Use site name from Airtable
      Domain: staticConfig.domain,
      'Local domain': staticConfig.localDomain,
      Active: 'Active', // Assume active if we found it
      ID: 1, // Default ID, can be enhanced if needed
      
      // Theme from static config (fetched from Airtable with caching)
      'Primary color': staticConfig.colors.primary,
      'Secondary color': staticConfig.colors.secondary,
      'Accent color': staticConfig.colors.accent,
      'Background color': staticConfig.colors.background,
      'Text color': staticConfig.colors.text,
      'Heading font': staticConfig.fonts.heading,
      'Body font': staticConfig.fonts.body,
      
      // Logo from static config (uses local files first, then Airtable)
      'Site logo': [{ url: staticConfig.logo.url }] as any,
      'Site logo alt text': staticConfig.logo.alt,
      'Site logo title': staticConfig.logo.title,
      
      // Footer text from static config
      'Footer text': staticConfig.footerText,
      
      // Analytics from static config
      'Google analytics ID': staticConfig.analytics?.googleAnalyticsId,
      'Google Tag Manager ID': staticConfig.analytics?.googleTagManagerId,
    } as Site;

    const endTime = Date.now();
    const fetchTime = endTime - startTime;
    console.log(`✅ Site config fetched in ${fetchTime}ms:`, {
      site: site.Name,
      pages: pages.length,
      features: features.length,
      hasHomepage: !!homepageContent,
      colors: '✅ From static config (cached)',
      logo: '✅ From static config (local/Airtable)'
    });

    // Step 4: Get Airtable view names for this domain
    const airtableViews = staticConfig.airtableViews || getAirtableViewsForDomain(domain);

    // Step 5: Build complete site configuration
    const config: SiteConfig = {
      site,
      siteId,
      pages,
      features,
      homepageContent,
      airtableViews: Object.keys(airtableViews).length > 0 ? airtableViews : undefined
    };

    // Step 4: Cache the complete config
    siteConfigCache.set(normalizedDomain, {
      config,
      timestamp: Date.now()
    });

    return config;

  } catch (error) {
    console.error('❌ Error fetching site config:', error);
    return null;
  }
}

/**
 * Clear the site config cache for a specific domain or all domains
 * Useful for manual cache invalidation after content updates
 */
export function clearSiteConfigCache(domain?: string): void {
  if (domain) {
    const normalizedDomain = normalizeDomain(domain);
    siteConfigCache.delete(normalizedDomain);
    console.log(`🗑️ Cleared site config cache for: ${normalizedDomain}`);
  } else {
    siteConfigCache.clear();
    console.log('🗑️ Cleared all site config cache');
  }
}

/**
 * Get site config from cache only (no API calls)
 * Returns null if not in cache
 */
export function getCachedSiteConfig(domain: string): SiteConfig | null {
  const normalizedDomain = normalizeDomain(domain);
  const cached = siteConfigCache.get(normalizedDomain);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.config;
  }
  
  return null;
}

