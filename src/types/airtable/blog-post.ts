import { Attachment, BaseFields, RecordLink } from './common';

/**
 * Blog Post interface matching the updated Airtable Blog posts table structure
 * 
 * Major Changes:
 * - Content is now structured in sections (H2.x + Text2.x pairs)
 * - Multiple "from Site" fields inherit dynamic content from site settings
 * - Enhanced SEO fields for keywords, content type, and questions
 * - Publication workflow with Status field
 * - Complete "Full article" field for fallback content
 */
export interface BlogPost extends BaseFields {
  // Core identification fields
  ID: number;
  Site?: RecordLink[];
  Published: boolean;
  Popular?: boolean;
  
  // Title and content structure
  H1?: string; // Primary heading (replaces Title)
  Slug: string;
  
  // NEW: Structured content sections (replaces single Content field)
  'H2.1'?: string; // Section 1 heading
  'H2.2'?: string; // Section 2 heading  
  'H2.3'?: string; // Section 3 heading
  'H2.4'?: string; // Section 4 heading
  'Text2.1'?: string; // Section 1 content
  'Text2.2'?: string; // Section 2 content
  'Text2.3'?: string; // Section 3 content
  
  // NEW: Article structure and metadata
  Introduction?: string; // Dedicated intro section
  Conclusion?: string; // Dedicated conclusion section
  'Full article'?: string; // Complete assembled article content (fallback)
  Idea?: string; // Article concept/brief
  'Main question'?: string; // Core question the article answers
  
  // Media and images
  'Featured image'?: Attachment[];
  
  // Publishing and dates
  'Published date'?: string;
  'Last updated': string;
  
  // Categorization and relationships
  Categories?: RecordLink[];
  Tags?: string[]; // Note: This is now RecordLink[] in Airtable
  'Related blogs'?: RecordLink[];
  Author?: RecordLink[];
  
  // NEW: SEO and content management
  'Meta title'?: string;
  'Meta description'?: string;
  'Content type'?: string; // e.g., "Informational", "Transactional"
  'Main keyword'?: RecordLink[]; // SEO keyword targeting
  Status?: string; // Publication workflow status (e.g., "Write", "Review", "Published")
  
  // Redirect fields
  'Redirect status'?: string; // e.g., "Redirect", "No redirect"
  'Redirect to'?: string; // URL or slug to redirect to
  
  // NEW: Dynamic site integration ("from Site" fields)
  'Content tone (from Site)'?: string[]; // Inherited content tone
  'Language (from Site)'?: string[]; // Inherited language settings
  'Site topic (from Site)'?: string[]; // Inherited site topic
  
  // Expanded details (populated when fetching)
  AuthorDetails?: any;
  CategoryDetails?: any;
  
  // DEPRECATED: Fields that may not exist in new Airtable setup
  // Keep for backward compatibility but mark as deprecated
  /** @deprecated Use H1 instead */
  Title?: string;
  /** @deprecated Use structured sections (H2.x + Text2.x) and Full article instead */
  Content?: string;
  /** @deprecated Field no longer exists in Airtable */
  Excerpt?: string;
  /** @deprecated Field no longer exists in Airtable */
  'Featured image 2'?: Attachment[];
  /** @deprecated Field no longer exists in Airtable */
  'Featured image 3'?: Attachment[];
  /** @deprecated Field no longer exists in Airtable */
  'Review 1'?: string;
  /** @deprecated Field no longer exists in Airtable */
  'Review reviewer 1'?: string;
}

/**
 * Interface for structured content sections
 * Used to work with H2/Text pairs in a type-safe way
 */
export interface BlogContentSection {
  heading: string;
  content: string;
  sectionNumber: 1 | 2 | 3 | 4;
}

/**
 * Interface for SEO-related fields
 */
export interface BlogSEOData {
  metaTitle?: string;
  metaDescription?: string;
  contentType?: string;
  mainKeyword?: RecordLink[];
  mainQuestion?: string;
}

/**
 * Interface for site-inherited content
 */
export interface BlogSiteContent {
  contentTone?: string[];
  language?: string[];
  siteTopic?: string[];
} 