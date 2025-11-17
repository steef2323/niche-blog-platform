import { Attachment, BaseFields, RecordLink } from './common';

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
  'Meta description'?: string;
  'Related blogs'?: RecordLink[];
  Author?: RecordLink[];
  Businesses?: RecordLink[]; // Links to Business records
  Conclusion?: string; // Conclusion content for the listicle
  
  // Redirect fields
  'Redirect status'?: string; // e.g., "Redirect", "No redirect"
  'Redirect to'?: string; // URL or slug to redirect to
  
  // Expanded details (populated when fetching)
  AuthorDetails?: any;
  CategoryDetails?: any;
  BusinessDetails?: any[]; // Array of Business objects
} 