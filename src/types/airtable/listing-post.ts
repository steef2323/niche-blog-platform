import { Attachment, BaseFields, RecordLink } from './common';

export interface ListingPost extends BaseFields {
  ID: number;
  Site?: RecordLink[];
  Published: boolean;
  Title: string;
  Slug: string;
  Excerpt?: string;
  'Featured image'?: Attachment[];
  'Business 1'?: string;
  'Featured image 1'?: Attachment[];
  'Business 2'?: string;
  'Featured image 2'?: Attachment[];
  'Business 3'?: string;
  'Featured image 3'?: Attachment[];
  'Published date'?: string;
  'Last updated': string;
  Categories?: RecordLink[];
  Tags?: string[];
  'Meta title'?: string;
  'Meta description'?: string;
  'Related blogs'?: RecordLink[];
} 