import { BaseFields, RecordLink } from './common';

export interface PrivateEventRequest extends BaseFields {
  Name: string;
  Email: string;
  Phone?: string;
  Date: string;
  'Preferred time'?: string;
  Location: string;
  'Number of guests'?: number;
  'Extra information'?: string;
  'Site link'?: RecordLink[];
  Status?: 'New' | 'In Progress' | 'Confirmed' | 'Declined';
  Notes?: string;
  'Follow-up date'?: string;
  'Last modified': string;
  'Submitted date': string;
} 