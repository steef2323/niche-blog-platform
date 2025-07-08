import { BlogPost, BlogContentSection } from '@/types/airtable';
import { parseMarkdownToHtml } from './markdown';

/**
 * Extract structured content sections from blog post
 * Returns sections with heading and content pairs
 */
export function extractContentSections(post: BlogPost): BlogContentSection[] {
  const sections: BlogContentSection[] = [];
  
  // Check for structured content sections (H2.x + Text2.x pairs)
  for (let i = 1; i <= 4; i++) {
    const headingKey = `H2.${i}` as keyof BlogPost;
    const textKey = `Text2.${i}` as keyof BlogPost;
    
    const heading = post[headingKey] as string;
    const content = post[textKey] as string;
    
    if (heading && content) {
      sections.push({
        heading: heading.trim(),
        content: content.trim(),
        sectionNumber: i as 1 | 2 | 3 | 4
      });
    }
  }
  
  return sections;
}

/**
 * Process text content to preserve line breaks from Airtable rich text fields
 * Preserves both single line breaks and paragraph breaks
 */
function processTextContent(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    // Normalize line endings first
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Convert single line breaks to markdown line breaks (double space + newline)
    .replace(/\n/g, '  \n')
    // Convert double spaces + double newlines back to paragraph breaks
    .replace(/  \n  \n/g, '\n\n')
    .trim();
}

/**
 * Get the best available content for a blog post
 * Priority: Structured sections > Full article > Content (deprecated)
 */
export function getBlogContent(post: BlogPost): string {
  const sections = extractContentSections(post);
  
  // If we have structured sections, use them
  if (sections.length > 0) {
    return buildStructuredContent(post, sections);
  }
  
  // Fallback to "Full article" field
  if (post['Full article']) {
    return processTextContent(post['Full article']);
  }
  
  // Final fallback to deprecated "Content" field
  if (post.Content) {
    return processTextContent(post.Content);
  }
  
  return '';
}

/**
 * Build complete article content from structured sections
 * Includes introduction, sections, and conclusion with proper spacing
 */
export function buildStructuredContent(post: BlogPost, sections: BlogContentSection[]): string {
  let content = '';
  
  // Add introduction if available
  if (post.Introduction) {
    content += processTextContent(post.Introduction) + '\n\n';
  }
  
  // Add structured sections
  sections.forEach(section => {
    content += `## ${section.heading}\n\n`;
    content += processTextContent(section.content) + '\n\n';
  });
  
  // Add conclusion if available
  if (post.Conclusion) {
    content += `## Conclusion\n\n`;
    content += processTextContent(post.Conclusion) + '\n\n';
  }
  
  return content.trim();
}

/**
 * Render structured content as HTML with proper sections
 * Each section gets its own container for better styling
 */
export function renderStructuredHTML(post: BlogPost): string {
  const sections = extractContentSections(post);
  
  // If we have structured sections, render them properly
  if (sections.length > 0) {
    const content = buildStructuredContent(post, sections);
    return parseMarkdownToHtml(content);
  }
  
  // Fallback to existing content rendering
  const content = getBlogContent(post);
  return parseMarkdownToHtml(content);
}

/**
 * Get content for reading time calculation
 * Uses the most complete content available
 */
export function getContentForReadingTime(post: BlogPost): string {
  const content = getBlogContent(post);
  
  // Strip markdown for more accurate word count
  return content
    .replace(/#+\s/g, '') // Remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link markup, keep text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Generate table of contents from structured content
 * Returns headings from both H1 and structured H2 sections
 */
export function generateTableOfContents(post: BlogPost): Array<{id: string, text: string, level: number}> {
  const toc: Array<{id: string, text: string, level: number}> = [];
  const sections = extractContentSections(post);
  
  // Add main H1 if available
  if (post.H1 || post.Title) {
    const title = post.H1 || post.Title || '';
    toc.push({
      id: 'main-title',
      text: title,
      level: 1
    });
  }
  
  // Add structured sections as H2
  sections.forEach((section, index) => {
    toc.push({
      id: `section-${section.sectionNumber}`,
      text: section.heading,
      level: 2
    });
  });
  
  // Add conclusion if it exists
  if (post.Conclusion && sections.length > 0) {
    toc.push({
      id: 'conclusion',
      text: 'Conclusion',
      level: 2
    });
  }
  
  return toc;
}

/**
 * Get the best available title for the blog post
 * Priority: H1 > Title (deprecated) > Meta title
 */
export function getBlogTitle(post: BlogPost): string {
  return post.H1 || post.Title || post['Meta title'] || 'Untitled';
}

/**
 * Get the best available excerpt/description for the blog post
 * Priority: Meta description > Introduction > Excerpt (deprecated) > Idea
 */
export function getBlogExcerpt(post: BlogPost): string {
  return post['Meta description'] || 
         post.Introduction || 
         post.Excerpt || 
         post.Idea || 
         '';
} 