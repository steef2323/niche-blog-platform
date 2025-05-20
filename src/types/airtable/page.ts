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
} 