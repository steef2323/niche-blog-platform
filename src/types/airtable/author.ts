import { BaseFields, RecordLink } from './common';

export interface Author extends BaseFields {
  ID: number;
  Name: string;
  Slug?: string; // Author slug for URL generation
  Email?: string;
  Bio?: string;
  'Profile picture'?: any[];
  'Meta title'?: string; // SEO meta title
  'Meta description'?: string; // SEO meta description
  'Blog posts'?: RecordLink[];
} 