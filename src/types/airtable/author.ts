import { BaseFields, RecordLink } from './common';

export interface Author extends BaseFields {
  ID: number;
  Name: string;
  Email?: string;
  Bio?: string;
  'Profile picture'?: any[];
  'Blog posts'?: RecordLink[];
} 