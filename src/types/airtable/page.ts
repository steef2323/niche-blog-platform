import { Attachment, BaseFields, RecordLink } from './common';

export type PageType = 'Home' | 'About us' | 'Contact';

export interface Page extends BaseFields {
  ID: number;
  Published: boolean;
  Page: PageType;
  Site?: RecordLink[];
  Title: string;
  Slug: string;
  Content?: string;
  'Featured image'?: Attachment[];
  'Featured image 2'?: Attachment[];
  'Featured image 3'?: Attachment[];
  'Last updated': string;
  
  // Info Component fields for homepage sections
  'Header 2'?: string;
  'Content 2'?: string;
  'Featured image 2 alt text'?: string;
  'Featured image 2 title'?: string;
  'Header 3'?: string;
  'Content 3'?: string;
  'Featured image 3 alt text'?: string;
  'Featured image 3 title'?: string;
  
  // Home page-specific fields for section titles and content
  'Home - Category 1'?: string;
  'Home - Subtitle 1'?: string;
  'Home - Category 2'?: string;
  'Home - Subtitle 2'?: string;
  'Home - Category 3'?: string;
  'Home - Subtitle 3'?: string;
  'Home - Category 4'?: string;
  'Home - Subtitle 4'?: string;
  'Home - Category link 1'?: RecordLink[];
  'Home - Category link 2'?: RecordLink[];
  
  // Review component fields
  'Review 1'?: string;
  'Review reviewer 1'?: string;
  
  // Button fields for homepage CTAs - single fields used for all buttons
  'Button text'?: string;
  'Button url'?: string;
  
  // Private event form fields
  'Private event form - Title'?: string;
  'Private event form - Subtitle'?: string;
  'Private event form - Success message'?: string;
} 