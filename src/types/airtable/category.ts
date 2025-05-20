import { Attachment, BaseFields, RecordLink } from './common';

export interface Category extends BaseFields {
  Name: string;
  Published: boolean;
  Title: string;
  Slug: string;
  Description?: string;
  'Featured image'?: Attachment[];
  'Last updated': string;
  'Blog posts'?: RecordLink[];
  'Listing posts'?: RecordLink[];
} 