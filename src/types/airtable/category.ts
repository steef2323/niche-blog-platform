import { BaseFields, RecordLink } from './common';

export interface Category extends BaseFields {
  ID: number;
  Name: string;
  Slug: string;
  Description?: string;
  Color?: string;
  Priority?: number; // For sorting categories by importance/order
  'Blog posts'?: RecordLink[];
  Site?: RecordLink[]; // Categories might be linked to specific sites
} 