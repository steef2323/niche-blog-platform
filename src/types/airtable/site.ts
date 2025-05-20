import { Attachment, BaseFields, RecordLink } from './common';

export type SiteStatus = 'Active' | 'Inactive';
export type FontOption = 'Inter' | 'Roboto';

export interface Site extends BaseFields {
  Name: string;
  ID: number;
  Active: SiteStatus;
  Domain: string;
  'Local domain'?: string;  // For development/testing
  'Site logo'?: Attachment[];
  
  // Theme configuration
  'Primary color': string;
  'Secondary color': string;
  'Accent color': string;
  'Background color': string;
  'Text color': string;
  'Heading font': FontOption;
  'Body font': FontOption;

  // Features and content
  Features?: RecordLink[];
  Pages?: RecordLink[];
  'Blog posts'?: RecordLink[];
  'Listing posts'?: RecordLink[];

  // Analytics and tracking
  'Google analytics ID'?: string;
  'Google Tag Manager ID'?: string;

  // SEO
  'Default meta title'?: string;
  'Default meta description'?: string;
} 