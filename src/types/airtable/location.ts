import { BaseFields, RecordLink } from './common';

export interface Location extends BaseFields {
  ID?: number;
  Address?: string;
  'Google maps link'?: string;
  'City website page'?: string;
  Price?: number;
  Website?: string;
  'Art instructor'?: string;
  'Language '?: string[]; // Note the space in the field name
  'Private event possible?'?: string;
  'Group size (maximum)'?: number;
  Businesses?: RecordLink[]; // Links back to Business records
  
  // Lookup fields from Business table
  'Group size (maximum) (from Business)'?: number[];
  'Art instructor (from Business)'?: string[];
  'Language  (from Business)'?: string[]; // Note double space - flat array of languages
  'Private event possible? (from Business)'?: string[];
}

