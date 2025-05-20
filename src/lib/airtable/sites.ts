import { Site } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

interface AirtableErrorType extends Error {
  error?: string;
  details?: unknown;
}

// Simple in-memory cache
type CacheEntry = {
  data: Site;
  timestamp: number;
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const siteCache = new Map<string, CacheEntry>();

/**
 * Normalize a domain for consistent matching
 * Removes protocol, www, and trailing slashes
 */
export function normalizeDomain(domain: string): string {
  // Remove port number if present
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .replace(/:\d+$/, ''); // Remove port number
}

/**
 * Test the connection to Airtable by attempting to fetch the first site
 */
export async function testConnection() {
  try {
    console.log('Attempting to connect to Airtable...');
    
    const records = await base(TABLES.SITES)
      .select({
        maxRecords: 1,
        view: 'Grid view'
      })
      .firstPage();
    
    console.log('Successfully connected to Airtable. Sample data:', {
      tableName: TABLES.SITES,
      recordCount: records.length,
      firstRecordId: records[0]?.id,
      firstRecordFields: records[0]?.fields
    });

    return records[0];
  } catch (error) {
    const airtableError = error as AirtableErrorType;
    
    console.error('Detailed error information:', {
      error: airtableError,
      errorName: airtableError.name,
      errorMessage: airtableError.message,
      errorStack: airtableError.stack,
      isAirtableError: airtableError instanceof Error,
      errorDetails: airtableError.error || airtableError.details || 'No additional details'
    });
    
    throw new AirtableError(
      'Failed to test Airtable connection',
      TABLES.SITES,
      'testConnection',
      error
    );
  }
}

/**
 * Get a site by its domain, with caching
 * In development, also checks the Local domain field
 */
export async function getSiteByDomain(domain: string): Promise<Site | null> {
  const normalizedDomain = normalizeDomain(domain);
  
  // Check cache first
  const cached = siteCache.get(normalizedDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Build the filter formula
    const isDev = process.env.NODE_ENV === 'development';
    let filterFormula = `{Domain} = "${normalizedDomain}"`;
    
    // In development, also check the Local domain field
    if (isDev) {
      filterFormula = `OR(${filterFormula}, {Local domain} = "${normalizedDomain}")`;
    }

    console.log('Fetching site with filter:', filterFormula);

    const sites = await base(TABLES.SITES)
      .select({
        filterByFormula: filterFormula,
        maxRecords: 1,
        view: "Grid view"
      })
      .firstPage();

    // If no site found, try to get the fallback site (first record)
    if (sites.length === 0) {
      console.log(`No site found for domain ${normalizedDomain}, trying fallback site`);
      const fallbackSites = await base(TABLES.SITES)
        .select({
          maxRecords: 1,
          sort: [{ field: 'ID', direction: 'asc' }],
          view: "Grid view"
        })
        .firstPage();

      if (fallbackSites.length === 0) {
        console.error('No fallback site found!');
        return null;
      }

      const fallbackSite = fallbackSites[0];
      const siteData = fallbackSite.fields as unknown as Site;
      // Cache the fallback site
      siteCache.set(normalizedDomain, {
        data: siteData,
        timestamp: Date.now()
      });
      return siteData;
    }

    const site = sites[0];
    const siteData = site.fields as unknown as Site;
    // Cache the found site
    siteCache.set(normalizedDomain, {
      data: siteData,
      timestamp: Date.now()
    });
    return siteData;

  } catch (error) {
    console.error('Error fetching site:', error);
    return null;
  }
}

/**
 * Clear the cache for a specific domain
 * Useful for manual cache invalidation
 */
export function clearSiteCache(domain?: string) {
  if (domain) {
    siteCache.delete(normalizeDomain(domain));
  } else {
    siteCache.clear();
  }
} 