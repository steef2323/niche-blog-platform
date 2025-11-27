import { Attachment, BaseFields, RecordLink } from './common';

// Helper type for generated content fields (can be string or object with state/value)
type GeneratedContent = string | { state?: string; value?: string; isStale?: boolean };

export interface ListingPost extends BaseFields {
  ID: number;
  Site?: RecordLink[];
  Published: boolean;
  Title: string;
  Slug: string;
  Excerpt?: string;
  'Featured image'?: Attachment[];
  'Featured image alt text'?: string;
  'Published date'?: string;
  'Last updated': string;
  Categories?: RecordLink[];
  Tags?: string[];
  'Meta title'?: string;
  'Meta description'?: GeneratedContent;
  'Related blogs'?: RecordLink[];
  Author?: RecordLink[];
  Businesses?: RecordLink[]; // Links to Business records
  Conclusion?: GeneratedContent; // Conclusion content for the listicle
  
  // NEW: Listicle structure fields
  'Header 1'?: string;
  'Header 2'?: string;
  'Header 3'?: string;
  'Header 4'?: string;
  'Header 5'?: string;
  'Listicle paragraph 1'?: GeneratedContent;
  'Listicle paragraph 2'?: GeneratedContent;
  'Listicle paragraph 3'?: GeneratedContent;
  'Listicle paragraph 4'?: GeneratedContent;
  'Listicle paragraph 5'?: GeneratedContent;
  'Image (from Business) (from Businesses)'?: Attachment[]; // Array of business images
  
  // Location fields (lookup fields from Locations table via Businesses)
  'Address (from Location) (from Businesses)'?: string[]; // Array of addresses, one per business
  'Google maps link (from Location) (from Businesses)'?: string[]; // Array of Google Maps links, one per business
  'City website page (from Location) (from Businesses)'?: string[]; // Array of city website pages, one per business
  
  // Business lookup fields
  'Group size (maximum) (from Business)'?: number[];
  'Art instructor (from Business)'?: string[];
  'Language  (from Business)'?: string[][]; // Array of arrays (each business has array of languages)
  'Private event possible? (from Business)'?: string[];
  
  // Redirect fields
  'Redirect status'?: string; // e.g., "Redirect", "No redirect"
  'Redirect to'?: string; // URL or slug to redirect to
  
  // Expanded details (populated when fetching)
  AuthorDetails?: any;
  CategoryDetails?: any; // First category (for backward compatibility)
  AllCategoryDetails?: any[]; // All categories
  BusinessDetails?: any[]; // Array of Business objects
  LocationDetails?: any[]; // Array of Location objects (one per business, aligned with BusinessDetails)
} 