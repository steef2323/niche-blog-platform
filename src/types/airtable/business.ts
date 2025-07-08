import { Attachment, BaseFields, RecordLink } from './common';

export interface Business extends BaseFields {
  ID?: number;
  Competitor: string; // Business name
  Price?: number;
  'Duration (minutes)'?: number;
  'Group size (maximum)'?: number;
  'Art instructor'?: string;
  'Private event possible?'?: string;
  'Language '?: string[]; // Note the space in the field name
  Website?: string;
  Information?: string; // Long description
  Image?: Attachment[];
  Cities?: string[];
  'Number of events per week'?: number;
  'Around since'?: string;
  Activity?: string[];
  'What they do well'?: string;
  'What they don\'t do well'?: string;
  'Link to good ads'?: string;
  'Listing posts'?: RecordLink[];
} 