import { BaseFields, RecordLink } from './common';

export interface Category extends BaseFields {
  ID: number;
  Name: string;
  Slug: string;
  Description?: string;
  'Page title'?: string; // Display title for the category page
  'Meta title'?: string; // SEO meta title
  'Meta description'?: string; // SEO meta description
  Color?: string;
  Priority?: number; // For sorting categories by importance/order
  'Blog posts'?: RecordLink[];
  Site?: RecordLink[]; // Categories might be linked to specific sites
} 