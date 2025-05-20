import { BaseFields, RecordLink } from './common';

export interface Feature extends BaseFields {
  Name: string;
  ID: number;
  Description?: string;
  'Enabled sites'?: RecordLink[];
} 