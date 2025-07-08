import { Site, Page } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

/**
 * Helper function to ensure base is available (server-side only)
 */
function ensureServerSide() {
  if (!base) {
    throw new AirtableError(
      'Airtable functions can only be called server-side',
      undefined,
      'ensureServerSide',
      'Base is not initialized - likely running on client-side'
    );
  }
}

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
 * In development, preserves port numbers for site detection
 */
export function normalizeDomain(domain: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  let normalized = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
    
  // In production, remove port numbers
  // In development, keep them for port-based site detection
  if (!isDev) {
    normalized = normalized.replace(/:\d+$/, '');
  }
  
  return normalized;
}

/**
 * Map port numbers to site identifiers for local development
 */
function getPortBasedSiteId(domain: string): string | null {
  const portMatch = domain.match(/:(\d+)$/);
  if (!portMatch) return null;
  
  const port = portMatch[1];
  const portToSiteMap: Record<string, string> = {
    '3000': 'localhost:3000', // Site 1
    '3001': 'localhost:3001', // Site 2
    '3002': 'localhost:3002', // Site 3 (future)
    '3003': 'localhost:3003', // Site 4 (future)
  };
  
  return portToSiteMap[port] || null;
}

/**
 * Test the connection to Airtable by attempting to fetch the first site
 */
export async function testConnection() {
  try {
    ensureServerSide();
    console.log('Attempting to connect to Airtable...');
    
    const records = await base(TABLES.SITES)
      .select({
        maxRecords: 1
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
 * In development, also checks the Local domain field and supports port-based detection
 */
export async function getSiteByDomain(domain: string): Promise<Site | null> {
  ensureServerSide();
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
    
    // In development, check for port-based site detection first
    if (isDev) {
      const portBasedSiteId = getPortBasedSiteId(domain);
      if (portBasedSiteId) {
        // Use the port-based site identifier as the local domain
        filterFormula = `OR({Domain} = "${normalizedDomain}", {Local domain} = "${portBasedSiteId}")`;
        console.log('Using port-based site detection for:', portBasedSiteId);
      } else {
        // Fallback to original local domain logic
      filterFormula = `OR({Domain} = "${normalizedDomain}", {Local domain} = "${normalizedDomain}")`;
      }
    }

    console.log('Fetching site with filter:', filterFormula);

    // Debug the parameters being passed to select
    const selectParams = {
      filterByFormula: filterFormula,
      maxRecords: 1
    };
    console.log('Select parameters:', JSON.stringify(selectParams, null, 2));

    let sites;
    try {
      sites = await base(TABLES.SITES)
        .select(selectParams)
        .firstPage();
    } catch (selectError) {
      console.error('Airtable select error details:', {
        error: selectError,
        message: selectError instanceof Error ? selectError.message : 'Unknown error',
        filterFormula,
        selectParams
      });
      
      // Fallback: Try getting all sites and filter manually
      console.log('Attempting fallback: getting all sites and filtering manually...');
      try {
        const allSites = await base(TABLES.SITES)
          .select({
            maxRecords: 10
          })
          .firstPage();
        
        console.log(`Found ${allSites.length} total sites for manual filtering`);
        
                 // Filter manually
         const portBasedSiteIdForFilter = isDev ? getPortBasedSiteId(domain) : null;
         sites = allSites.filter(site => {
           const fields = site.fields as any;
           const siteDomain = fields.Domain;
           const siteLocalDomain = fields['Local domain'];
           
           return siteDomain === normalizedDomain || 
                  siteLocalDomain === normalizedDomain ||
                  (isDev && portBasedSiteIdForFilter && siteLocalDomain === portBasedSiteIdForFilter);
         });
        
        console.log(`Manually filtered to ${sites.length} matching sites`);
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        throw selectError; // Throw the original error
      }
    }

    // If no site found, try to get the fallback site (first record)
    if (sites.length === 0) {
      console.log(`No site found for domain ${normalizedDomain}, trying fallback site`);
      const fallbackSites = await base(TABLES.SITES)
        .select({
          maxRecords: 1,
          sort: [{ field: 'ID', direction: 'asc' }],
          filterByFormula: 'AND({Active} = "Active", {ID} = 1)'
        })
        .firstPage();

      if (fallbackSites.length === 0) {
        console.error('No fallback site found!');
        return null;
      }

      const fallbackSite = fallbackSites[0];
      const siteData = {
        ...fallbackSite.fields,
        id: fallbackSite.id
      } as unknown as Site;
      
      // Fetch pages and features for this site
      if (fallbackSite.id) {
        try {
          const sitePages = await getPagesBySiteId(fallbackSite.id);
          // Enhance the site data with expanded page records
          siteData.Pages = sitePages.map(page => ({
            ...page
          }));
        } catch (pageError) {
          console.error('Error fetching pages for fallback site:', pageError);
        }

        try {
          // Import and fetch features for this site
          const { getFeaturesBySiteId } = await import('./features');
          const siteFeatures = await getFeaturesBySiteId(fallbackSite.id);
          // Enhance the site data with expanded feature records
          siteData.Features = siteFeatures.map(feature => ({
            ...feature
          })) as any;
        } catch (featureError) {
          console.error('Error fetching features for fallback site:', featureError);
        }
      }
      
      // Cache the fallback site
      siteCache.set(normalizedDomain, {
        data: siteData,
        timestamp: Date.now()
      });
      return siteData;
    }

    const site = sites[0];
    const siteData = {
      ...site.fields,
      id: site.id
    } as unknown as Site;
    
    // Fetch pages and features for this site
    if (site.id) {
      try {
        const sitePages = await getPagesBySiteId(site.id);
        // Enhance the site data with expanded page records
        siteData.Pages = sitePages.map(page => ({
          ...page
        }));
      } catch (pageError) {
        console.error('Error fetching pages for site:', pageError);
      }

      try {
        // Import and fetch features for this site
        const { getFeaturesBySiteId } = await import('./features');
        const siteFeatures = await getFeaturesBySiteId(site.id);
        // Enhance the site data with expanded feature records
        siteData.Features = siteFeatures.map(feature => ({
          ...feature
        })) as any;
      } catch (featureError) {
        console.error('Error fetching features for site:', featureError);
      }
    }
    
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
 * Fetch pages for a specific site
 * @param siteId The ID of the site to fetch pages for
 * @returns Array of Page objects
 */
export async function getPagesBySiteId(siteId: string): Promise<Page[]> {
  try {
    ensureServerSide();
    console.log(`Fetching pages for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch pages');
      return [];
    }
    
    // Try with a more reliable formula for linked records
    const pages = await base(TABLES.PAGES)
      .select({
        filterByFormula: `AND(
          {Published} = TRUE(),
          Site = "${siteId}"
        )`,
        sort: [{ field: 'ID', direction: 'asc' }]
      })
      .all();
    
    console.log(`Found ${pages.length} pages for site ID: ${siteId}`);
    
    // If no pages found, try a different approach
    if (pages.length === 0) {
      console.log('First approach failed, trying alternative formula...');
      
      const pagesAlt = await base(TABLES.PAGES)
        .select({
          filterByFormula: '{Published} = TRUE()'
        })
        .all();
      
      console.log(`Found ${pagesAlt.length} total published pages`);
      
      // Log the first page to see its structure
      if (pagesAlt.length > 0) {
        const firstPage = pagesAlt[0];
        console.log('Sample page data:', {
          id: firstPage.id,
          siteField: firstPage.fields.Site,
          siteFieldType: typeof firstPage.fields.Site,
          isArray: Array.isArray(firstPage.fields.Site)
        });
        
        // Filter manually if needed
        const filteredPages = pagesAlt.filter(page => {
          const siteField = page.fields.Site;
          if (Array.isArray(siteField)) {
            return siteField.includes(siteId);
          }
          return false;
        });
        
        console.log(`Manually filtered to ${filteredPages.length} pages for site ID: ${siteId}`);
        
        if (filteredPages.length > 0) {
          return filteredPages.map(page => page.fields as unknown as Page);
        }
      }
    }
    
    return pages.map(page => page.fields as unknown as Page);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
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