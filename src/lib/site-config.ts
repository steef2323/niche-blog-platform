/**
 * Centralized Site Configuration System
 * 
 * This file contains all essential information needed to retrieve and display
 * site-specific content. It centralizes:
 * - Site detection logic
 * - Airtable table/view names (if using views)
 * - Site-specific configuration
 * - Content filtering rules
 */

import { Site, Page, Feature } from '@/types/airtable';

/**
 * Site configuration interface
 * Contains all essential information for a site
 */
export interface SiteConfig {
  site: Site;
  siteId: string;
  pages: Page[];
  features: Feature[];
  homepageContent: Page | null;
  // Airtable view names for site-specific content filtering
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
}

/**
 * Normalize a domain for consistent matching
 * Removes protocol, www, and trailing slashes
 * In development, preserves port numbers for port-based site detection
 * In production, removes port numbers and uses actual domain
 */
export function normalizeDomain(domain: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  let normalized = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
    
  // In production, remove port numbers (use actual domain)
  // In development, keep them for port-based site detection
  if (!isDev) {
    normalized = normalized.replace(/:\d+$/, '');
  }
  
  return normalized;
}

/**
 * Map port numbers to actual site domains
 * ONLY works in development - in production, use actual URL/domain
 */
export function getPortBasedSiteId(domain: string): string | null {
  // Only use port-based detection in development
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return null;
  }
  
  const portMatch = domain.match(/:(\d+)$/);
  if (!portMatch) return null;
  
  const port = portMatch[1];
  // Map ports to actual site domains (development only)
  const portToSiteMap: Record<string, string> = {
    '3000': 'sipandpaints.nl', // Site 1
    '3001': 'localhost:3001', // Site 2
    '3002': 'sipandpaintamsterdam.nl', // Amsterdam site
    '3003': 'localhost:3003', // Site 4
    '3004': 'sipenpaints.nl', // sipenpaints.nl on port 3004 (development only)
  };
  
  return portToSiteMap[port] || null;
}

/**
 * Get domain matching strategy for site lookup
 * Returns the domains/identifiers to check for a given domain
 * Port-based detection ONLY works in development
 */
export function getDomainMatchingStrategy(domain: string): {
  normalizedDomain: string;
  portBasedId: string | null;
  isDevelopment: boolean;
} {
  const normalizedDomain = normalizeDomain(domain);
  const isDev = process.env.NODE_ENV === 'development';
  // Port-based detection ONLY in development
  const portBasedId = isDev ? getPortBasedSiteId(domain) : null;
  
  return {
    normalizedDomain,
    portBasedId,
    isDevelopment: isDev
  };
}

/**
 * Get Airtable view names for a specific domain
 * This maps domains to their corresponding Airtable view names
 * Views are pre-filtered in Airtable to show only site-specific content
 * 
 * NOTE: This is a fallback. The primary source is now getStaticSiteConfig()
 * which fetches view names from Airtable or uses hardcoded configs.
 */
export function getAirtableViewsForDomain(domain: string): {
  blogPosts?: string;
  listingPosts?: string;
  pages?: string;
  categories?: string;
  authors?: string;
  features?: string;
  tags?: string;
} {
  // Check if this is a port-based domain that maps to another domain (development only)
  const portBasedDomain = getPortBasedSiteId(domain);
  const domainToCheck = portBasedDomain || domain;
  const normalizedDomain = normalizeDomain(domainToCheck);
  
  // Map domains to their Airtable view names
  // Views should be pre-configured in Airtable to filter by site
  // Format: {domain} for all tables, or {domain} - {TableName} for specific tables
  // All tables now have site-specific views available
  const domainToViews: Record<string, {
    blogPosts?: string;
    listingPosts?: string;
    pages?: string;
    categories?: string;
    authors?: string;
    features?: string;
    tags?: string;
  }> = {
    'sipandpaints.nl': {
      blogPosts: 'sipandpaints.nl',
      listingPosts: 'sipandpaints.nl',
      pages: 'sipandpaints.nl',
      categories: 'sipandpaints.nl',
      authors: 'sipandpaints.nl',
      features: 'sipandpaints.nl',
      tags: 'sipandpaints.nl' // If Tags table is used
    },
    'sipenpaints.nl': {
      blogPosts: 'sipenpaints.nl',
      listingPosts: 'sipenpaints.nl',
      pages: 'sipenpaints.nl',
      categories: 'sipenpaints.nl',
      authors: 'sipenpaints.nl',
      features: 'sipenpaints.nl',
      tags: 'sipenpaints.nl' // If Tags table is used
    },
    // Add more domain mappings as needed
    // 'example.com': {
    //   blogPosts: 'example.com',
    //   listingPosts: 'example.com',
    //   pages: 'example.com',
    //   categories: 'example.com',
    //   authors: 'example.com',
    //   features: 'example.com'
    // }
  };
  
  return domainToViews[normalizedDomain] || {};
}

