import { Attachment, BaseFields, RecordLink } from './common';

export interface BlogPost extends BaseFields {
  ID: number;
  Site?: RecordLink[];
  Published: boolean;
  Title: string;
  Slug: string;
  Content: string;
  Excerpt?: string;
  'Featured image'?: Attachment[];
  'Featured image 2'?: Attachment[];
  'Featured image 3'?: Attachment[];
  'Published date'?: string;
  'Last updated': string;
  Categories?: RecordLink[];
  Tags?: string[];
  'Meta title'?: string;
  'Meta description'?: string;
  'Related blogs'?: RecordLink[];
} 