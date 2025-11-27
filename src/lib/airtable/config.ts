import Airtable from 'airtable';

// Debug logging
console.log('Environment variables check:');
console.log('AIRTABLE_API_KEY exists:', !!process.env.AIRTABLE_API_KEY);
console.log('AIRTABLE_API_KEY starts with:', process.env.AIRTABLE_API_KEY?.substring(0, 4));
console.log('AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID);
console.log('AIRTABLE_BASE_ID value:', process.env.AIRTABLE_BASE_ID);

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not defined');
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not defined');
}

// Configure Airtable with Personal Access Token
const apiKey = process.env.AIRTABLE_API_KEY;
console.log('Using token type:', apiKey.startsWith('pat') ? 'Personal Access Token' : 'Legacy API Key');

Airtable.configure({
  apiKey,
  endpointUrl: 'https://api.airtable.com',
  requestTimeout: 30000, // 30 second timeout
});

// Create base instance
const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

// Test the configuration
console.log('Airtable configuration completed:', {
  hasApiKey: !!Airtable.apiKey,
  apiKeyLength: Airtable.apiKey?.length,
  baseId: process.env.AIRTABLE_BASE_ID,
  isPersonalAccessToken: apiKey.startsWith('pat')
});

// Export singleton instance
export default base;

// Export table names as constants to avoid typos
export const TABLES = {
  SITES: 'Sites',
  FEATURES: 'Features',
  PAGES: 'Pages',
  BLOG_POSTS: 'Blog posts',
  LISTING_POSTS: 'Listing posts',
  AUTHORS: 'Authors',
  CATEGORIES: 'Categories',
  BUSINESSES: 'Businesses',
  LOCATIONS: 'Locations',
  PRIVATE_EVENT_REQUESTS: 'Private Event Requests',
} as const;

// Helper type for table names
export type TableNames = typeof TABLES[keyof typeof TABLES];

// Basic error class for Airtable operations
export class AirtableError extends Error {
  constructor(
    message: string,
    public readonly table?: TableNames,
    public readonly operation?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AirtableError';
  }
} 