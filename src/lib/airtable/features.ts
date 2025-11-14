import { Feature } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

/**
 * Get all features enabled for a specific site, optionally using an Airtable view
 * @param siteId The Airtable record ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of Feature objects
 */
export async function getFeaturesBySiteId(siteId: string, viewName?: string): Promise<Feature[]> {
  try {
    console.log(`Fetching features for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch features');
      return [];
    }
    
    let features: Feature[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // No filterByFormula, no manual filtering - the view is pre-filtered
      console.log(`Using Airtable view "${viewName}" - fetching all features from view`);
      
      try {
        const featureRecords = await base(TABLES.FEATURES)
      .select({
            view: viewName,
            // Don't use filterByFormula with view - view is already filtered
      })
      .all();
    
        features = featureRecords.map(record => record.fields as unknown as Feature);
        console.log(`✅ Found ${features.length} features in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, fetch all and filter manually
    if (!viewName || features.length === 0) {
      if (!viewName) {
        console.log('Using fallback method - fetching all features and filtering manually');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      const featureRecords = await base(TABLES.FEATURES)
        .select({})
        .all();
      
      console.log(`Found ${featureRecords.length} total features`);
    
    // Filter features that are enabled for this site
      const enabledFeatures = featureRecords.filter(feature => {
      const enabledSites = feature.fields['Enabled sites'];
      if (Array.isArray(enabledSites)) {
        return enabledSites.includes(siteId);
      }
      return false;
    });
    
    console.log(`Found ${enabledFeatures.length} enabled features for site ID: ${siteId}`);
      features = enabledFeatures.map(feature => feature.fields as unknown as Feature);
    }
    
    return features;
  } catch (error) {
    console.error('Error fetching features:', error);
    throw new AirtableError(
      'Failed to fetch features for site',
      TABLES.FEATURES,
      'getFeaturesBySiteId',
      error
    );
  }
}

/**
 * Check if a specific feature is enabled for a site
 * @param siteId The Airtable record ID of the site
 * @param featureName The name of the feature to check
 * @returns Boolean indicating if the feature is enabled
 */
export async function isFeatureEnabled(siteId: string, featureName: string): Promise<boolean> {
  try {
    const features = await getFeaturesBySiteId(siteId);
    return features.some(feature => feature.Name === featureName);
  } catch (error) {
    console.error(`Error checking if feature ${featureName} is enabled:`, error);
    return false;
  }
}

/**
 * Get all available features (for admin/debugging purposes)
 */
export async function getAllFeatures(): Promise<Feature[]> {
  try {
    const features = await base(TABLES.FEATURES)
      .select({
        sort: [{ field: 'ID', direction: 'asc' }]
      })
      .all();
    
    return features.map(feature => feature.fields as unknown as Feature);
  } catch (error) {
    console.error('Error fetching all features:', error);
    throw new AirtableError(
      'Failed to fetch all features',
      TABLES.FEATURES,
      'getAllFeatures',
      error
    );
  }
} 