import { Feature } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

/**
 * Get all features enabled for a specific site
 * @param siteId The Airtable record ID of the site
 * @returns Array of Feature objects
 */
export async function getFeaturesBySiteId(siteId: string): Promise<Feature[]> {
  try {
    console.log(`Fetching features for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch features');
      return [];
    }
    
    // Fetch all features and filter by enabled sites
    const features = await base(TABLES.FEATURES)
      .select({
      })
      .all();
    
    console.log(`Found ${features.length} total features`);
    
    // Filter features that are enabled for this site
    const enabledFeatures = features.filter(feature => {
      const enabledSites = feature.fields['Enabled sites'];
      if (Array.isArray(enabledSites)) {
        return enabledSites.includes(siteId);
      }
      return false;
    });
    
    console.log(`Found ${enabledFeatures.length} enabled features for site ID: ${siteId}`);
    
    return enabledFeatures.map(feature => feature.fields as unknown as Feature);
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