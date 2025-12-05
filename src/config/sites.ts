/**
 * Static Site Configuration
 * 
 * This file provides static site configurations that rarely change:
 * - Domain mapping
 * - Theme colors
 * - Fonts
 * - Logo paths
 * - Airtable record IDs
 * - Airtable view names
 * 
 * Data is fetched from Airtable on-demand with aggressive caching
 * (30-day TTL) since this data rarely changes (maybe once a month). This gives you:
 * - Flexibility: Update in Airtable, no code deployment needed
 * - Performance: Aggressive caching means fast responses
 * - Reliability: Falls back gracefully if Airtable is unavailable
 */

import { normalizeDomain } from '@/lib/site-config';
import base, { TABLES, AirtableError } from '@/lib/airtable/config';
import { Attachment } from '@/types/airtable/common';
import { getLogoPath } from '@/lib/utils/asset-paths';

/**
 * Static site configuration interface
 * Contains all rarely-changing site data
 */
export interface StaticSiteConfig {
  // Domain identification
  domain: string;
  localDomain?: string; // For development (e.g., 'localhost:3000')
  siteId: string; // Airtable record ID (e.g., 'recXXXXXXXXXXXXXX')
  siteName?: string; // Site name from Airtable
  
  // Theme configuration (rarely changes)
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  fonts: {
    heading: string;
    body: string;
  };
  
  // Logo configuration (rarely changes)
  logo: {
    url: string; // URL to logo (from Airtable attachment or local path)
    alt: string; // Alt text for logo
    title: string; // Title attribute for logo
  };
  
  // Footer content
  footerText?: string;
  
  // Contact information
  instagram?: string;
  emailContact?: string;
  
  // Airtable view names (stable, pre-filtered views)
  // These views should be pre-configured in Airtable to filter by site
  // All tables now have site-specific views available
  airtableViews?: {
    blogPosts?: string;
    listingPosts?: string;
    pages?: string;
    categories?: string;
    authors?: string;
    features?: string;
    tags?: string; // If Tags table is used
  };
  
  // Analytics IDs
  analytics?: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
  };
}

/**
 * All static site configurations
 * 
 * To add a new site:
 * 1. Get the site's Airtable record ID
 * 2. Get colors, fonts, logo from Airtable
 * 3. Add entry here with domain as key
 */
export const staticSiteConfigs: Record<string, StaticSiteConfig> = {
  'sipandpaints.nl': {
    domain: 'sipandpaints.nl',
    localDomain: 'localhost:3000', // For development
    siteId: 'recXXXXXXXXXXXXXX', // TODO: Replace with actual Airtable record ID
    
    colors: {
      primary: '#FF6B6B', // TODO: Replace with actual primary color
      secondary: '#4ECDC4', // TODO: Replace with actual secondary color
      accent: '#fefae0', // Accent color for header, footer, and primary buttons
      background: '#FFFFFF', // TODO: Replace with actual background color
      text: '#333333', // TODO: Replace with actual text color
    },
    
    fonts: {
      heading: 'Inter', // TODO: Replace with actual heading font
      body: 'Inter', // TODO: Replace with actual body font
    },
    
    logo: {
      url: '/logos/sipandpaints-logo.png', // TODO: Replace with actual logo path or Airtable URL
      alt: 'Sip and Paints Logo', // TODO: Replace with actual alt text
      title: 'Sip and Paints', // TODO: Replace with actual title
    },
    
    footerText: undefined, // TODO: Add if hardcoding
    
    airtableViews: {
      blogPosts: 'sipandpaints.nl',
      listingPosts: 'sipandpaints.nl',
      pages: 'sipandpaints.nl',
      categories: 'sipandpaints.nl',
      authors: 'sipandpaints.nl',
      features: 'sipandpaints.nl',
      tags: 'sipandpaints.nl',
    },
    
    // Optional: Uncomment and fill in if you want to hardcode analytics
    // analytics: {
    //   googleAnalyticsId: 'G-XXXXXXXXXX',
    //   googleTagManagerId: 'GTM-XXXXXXX',
    // },
  },
  
  // Add more sites here as needed
  // 'example.com': {
  //   domain: 'example.com',
  //   localDomain: 'localhost:3001',
  //   siteId: 'recYYYYYYYYYYYYYY',
  //   colors: { ... },
  //   fonts: { ... },
  //   logo: { ... },
  //   airtableViews: { ... },
  // },
};

/**
 * Cache for static site configs fetched from Airtable
 */
type StaticConfigCacheEntry = {
  config: StaticSiteConfig;
  timestamp: number;
};

const STATIC_CONFIG_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (aggressive caching - data changes maybe once a month)
const staticConfigCache = new Map<string, StaticConfigCacheEntry>();

/**
 * Get port-based site identifier for local development
 */
function getPortBasedSiteId(domain: string): string | null {
  const portMatch = domain.match(/:(\d+)$/);
  if (!portMatch) return null;
  
  const port = portMatch[1];
  const portToSiteMap: Record<string, string> = {
    '3000': 'localhost:3000',
    '3001': 'localhost:3001',
    '3002': 'localhost:3002',
    '3003': 'localhost:3003',
  };
  
  return portToSiteMap[port] || null;
}

/**
 * Fetch static site configuration from Airtable
 * 
 * This function fetches only the static config fields (colors, fonts, logo, etc.)
 * from the Airtable Sites table. It uses aggressive caching (30-day TTL) since
 * this data rarely changes (maybe once a month).
 * 
 * @param domain - The domain to look up (e.g., 'sipandpaints.nl' or 'localhost:3000')
 * @returns Static site configuration or null if not found
 */
export async function getStaticSiteConfigFromAirtable(domain: string): Promise<StaticSiteConfig | null> {
  const normalized = normalizeDomain(domain);
  
  // Check cache first
  const cached = staticConfigCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < STATIC_CONFIG_CACHE_DURATION) {
    console.log(`⚡ Static site config cache hit for: ${normalized}`);
    return cached.config;
  }
  
  console.log(`🔍 Fetching static site config from Airtable for: ${normalized}`);
  const startTime = Date.now();
  
  try {
    // Build filter formula
    const isDev = process.env.NODE_ENV === 'development';
    let filterFormula = `{Domain} = "${normalized}"`;
    
    // In development, check for port-based site detection
    if (isDev) {
      const portBasedSiteId = getPortBasedSiteId(domain);
      if (portBasedSiteId) {
        filterFormula = `OR({Domain} = "${normalized}", {Local domain} = "${portBasedSiteId}")`;
        console.log('Using port-based site detection for:', portBasedSiteId);
      } else {
        filterFormula = `OR({Domain} = "${normalized}", {Local domain} = "${normalized}")`;
      }
    }
    
    // Fetch site from Airtable
    const sites = await base(TABLES.SITES)
      .select({
        filterByFormula: filterFormula,
        maxRecords: 1
      })
      .firstPage();
    
    // Fallback to first active site if no match (for development)
    let siteRecord;
    if (sites.length === 0) {
      console.log(`No site found for ${normalized}, trying fallback site`);
      const fallbackSites = await base(TABLES.SITES)
        .select({
          maxRecords: 1,
          sort: [{ field: 'ID', direction: 'asc' }],
          filterByFormula: 'AND({Active} = "Active", {ID} = 1)'
        })
        .firstPage();
      
      if (fallbackSites.length === 0) {
        console.log(`❌ No site found in Airtable for domain: ${normalized}`);
        return null;
      }
      
      siteRecord = fallbackSites[0];
    } else {
      siteRecord = sites[0];
    }
    
    const fields = siteRecord.fields as any;
    const siteId = siteRecord.id;
    
    // Extract logo URL - always prefer local files over Airtable
    const normalizedDomain = fields.Domain || normalized;
    let airtableLogoUrl: string | undefined;
    
    if (fields['Site logo'] && Array.isArray(fields['Site logo']) && fields['Site logo'].length > 0) {
      const logoAttachment = fields['Site logo'][0] as Attachment;
      airtableLogoUrl = logoAttachment.url;
    }
    
    // getLogoPath checks local files first, then falls back to Airtable URL
    const logoUrl = getLogoPath(normalizedDomain, airtableLogoUrl);
    const logoAlt = fields['Site logo alt text'] || fields.Name || 'Site Logo';
    const logoTitle = fields['Site logo title'] || fields.Name || 'Site Logo';
    
    // Build static config from Airtable data
    const config: StaticSiteConfig = {
      domain: fields.Domain || normalized,
      localDomain: fields['Local domain'] || undefined, // ✅ Fetched
      siteId: siteId,
      siteName: fields.Name || undefined, // ✅ Fetched
      
      colors: {
        primary: fields['Primary color'] || '#000000',
        secondary: fields['Secondary color'] || '#666666',
        accent: fields['Accent color'] || '#000000',
        background: fields['Background color'] || '#FFFFFF',
        text: fields['Text color'] || '#333333',
      },
      
      fonts: {
        heading: fields['Heading font'] || 'Inter', // ✅ Fetched
        body: fields['Body font'] || 'Inter', // ✅ Fetched
      },
      
      logo: {
        url: logoUrl, // ✅ Fetched from Airtable attachment
        alt: fields['Site logo alt text'] || logoAlt, // ✅ Fetched
        title: fields['Site logo title'] || logoTitle, // ✅ Fetched
      },
      
      // ✅ Footer text fetched
      footerText: fields['Footer text'] || undefined,
      
      // ✅ Contact information fetched
      instagram: fields['Instagram'] || undefined,
      emailContact: fields['Email contact'] || undefined,
      
      // Get Airtable view names from site-config.ts helper (fallback)
      // In production, you should configure these views in Airtable and store them here
      airtableViews: (await import('@/lib/site-config')).getAirtableViewsForDomain(domain),
      
      // ✅ Analytics IDs fetched
      // Helper function to find field by multiple possible names
      analytics: (() => {
        // Try multiple possible field name variations
        const findField = (possibleNames: string[]): string | undefined => {
          for (const name of possibleNames) {
            const value = fields[name];
            if (value !== undefined && value !== null && value !== '') {
              return typeof value === 'string' ? value.trim() : String(value).trim();
            }
          }
          return undefined;
        };
        
        const gtmId = findField([
          'Google Tag Manager ID',
          'Google Tag Manager',
          'GTM ID',
          'GTM',
          'Tag Manager ID',
        ]);
        
        const gaId = findField([
          'Google analytics ID',
          'Google Analytics ID',
          'GA ID',
          'Google Analytics',
        ]);
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          const allGoogleFields = Object.keys(fields).filter(k => 
            k.toLowerCase().includes('google') || 
            k.toLowerCase().includes('tag') || 
            k.toLowerCase().includes('manager') ||
            k.toLowerCase().includes('analytics') ||
            k.toLowerCase().includes('gtm')
          );
          
          console.log('🔍 Analytics fields from Airtable:', {
            'GTM ID found': gtmId || 'NOT FOUND',
            'GA ID found': gaId || 'NOT FOUND',
            'All Google-related fields': allGoogleFields,
            'GTM field values': allGoogleFields.map(k => ({ field: k, value: fields[k] }))
          });
        }
        
        return {
          googleAnalyticsId: gaId || undefined,
          googleTagManagerId: gtmId || undefined,
        };
      })(),
    };
    
    // Cache the config
    staticConfigCache.set(normalized, {
      config,
      timestamp: Date.now()
    });
    
    const endTime = Date.now();
    const fetchTime = endTime - startTime;
    console.log(`✅ Static site config fetched from Airtable in ${fetchTime}ms:`, {
      domain: config.domain,
      siteId: config.siteId
    });
    
    return config;
    
  } catch (error) {
    console.error('❌ Error fetching static site config from Airtable:', error);
    
    // Try to return cached config even if expired (graceful degradation)
    if (cached) {
      console.log('⚠️ Using expired cache due to Airtable error');
      return cached.config;
    }
    
    return null;
  }
}

/**
 * Get static site configuration by domain
 * 
 * This function first checks for hardcoded configs, then falls back to
 * fetching from Airtable. Use this as the main entry point.
 * 
 * @param domain - The domain to look up (e.g., 'sipandpaints.nl' or 'localhost:3000')
 * @param useAirtable - If true, always fetch from Airtable (default: true)
 * @returns Static site configuration or null if not found
 */
export async function getStaticSiteConfig(
  domain: string,
  useAirtable: boolean = true
): Promise<StaticSiteConfig | null> {
  const normalized = normalizeDomain(domain);
  
  // First try hardcoded configs (if any exist)
  let hardcodedConfig: StaticSiteConfig | undefined;
  if (staticSiteConfigs[normalized]) {
    hardcodedConfig = staticSiteConfigs[normalized];
  } else {
    // Then try matching by localDomain (for development)
    for (const config of Object.values(staticSiteConfigs)) {
      if (config.localDomain && normalizeDomain(config.localDomain) === normalized) {
        hardcodedConfig = config;
        break;
      }
    }
  }
  
  // Always fetch from Airtable to get dynamic fields (Instagram, Email contact, Footer text)
  // Merge with hardcoded config, with Airtable taking precedence
  if (useAirtable) {
    const airtableConfig = await getStaticSiteConfigFromAirtable(domain);
    
    if (airtableConfig) {
      // If we have a hardcoded config, merge them (Airtable takes precedence for dynamic fields)
      if (hardcodedConfig) {
        console.log(`📝 Merging hardcoded static config with Airtable data for: ${normalized}`);
        return {
          ...hardcodedConfig,
          // Override with Airtable data for dynamic fields
          footerText: airtableConfig.footerText ?? hardcodedConfig.footerText,
          instagram: airtableConfig.instagram ?? hardcodedConfig.instagram,
          emailContact: airtableConfig.emailContact ?? hardcodedConfig.emailContact,
          // Also update siteId and siteName from Airtable if available
          siteId: airtableConfig.siteId || hardcodedConfig.siteId,
          siteName: airtableConfig.siteName || hardcodedConfig.siteName,
          // Merge analytics (Airtable takes precedence)
          analytics: {
            googleAnalyticsId: airtableConfig.analytics?.googleAnalyticsId ?? hardcodedConfig.analytics?.googleAnalyticsId,
            googleTagManagerId: airtableConfig.analytics?.googleTagManagerId ?? hardcodedConfig.analytics?.googleTagManagerId,
          },
        };
      }
      return airtableConfig;
    }
  }
  
  // Fall back to hardcoded config if Airtable fetch failed or disabled
  if (hardcodedConfig) {
    console.log(`📝 Using hardcoded static config for: ${normalized}`);
    return hardcodedConfig;
  }
  
  return null;
}

/**
 * Clear the static site config cache for a specific domain or all domains
 * Useful for manual cache invalidation after Airtable updates
 */
export function clearStaticSiteConfigCache(domain?: string): void {
  if (domain) {
    const normalized = normalizeDomain(domain);
    staticConfigCache.delete(normalized);
    console.log(`🗑️ Cleared static site config cache for: ${normalized}`);
  } else {
    staticConfigCache.clear();
    console.log('🗑️ Cleared all static site config cache');
  }
}

/**
 * Get all static site configs (hardcoded only)
 * Useful for validation, syncing, or bulk operations
 */
export function getAllStaticSiteConfigs(): StaticSiteConfig[] {
  return Object.values(staticSiteConfigs);
}

/**
 * Get all domain mappings
 * Useful for site detection or validation
 */
export function getAllDomains(): string[] {
  return Object.keys(staticSiteConfigs);
}

