import { marked } from 'marked';

/**
 * Parse markdown content to HTML
 * @param content Markdown content from Airtable
 * @returns HTML string
 */
export function parseMarkdownToHtml(content: string): string {
  if (!content) return '';
  
  try {
    // Configure marked with basic options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
    });
    
    // Parse markdown to HTML
    let html = marked(content) as string;
    
    // Add IDs to headings for table of contents
    let headingCounter = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    html = html.replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => {
      const levelKey = `h${level}` as keyof typeof headingCounter;
      headingCounter[levelKey]++;
      
      // Create semantic IDs for common sections
      const cleanText = text.toLowerCase().trim();
      let id = '';
      
      if (cleanText === 'conclusion') {
        id = 'conclusion';
      } else if (cleanText === 'introduction') {
        id = 'introduction';
      } else if (level === '2') {
        // For H2 sections, use section-based IDs
        id = `section-${headingCounter.h2}`;
      } else {
        // For other headings, create slug from text
        const escapedText = text.toLowerCase().replace(/[^\w\s]+/g, '').replace(/\s+/g, '-');
        id = `heading-${escapedText}`;
      }
      
      return `<h${level} id="${id}">${text}</h${level}>`;
    });
    
    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback: return content with basic formatting
    return content.replace(/\n/g, '<br>');
  }
}

/**
 * Extract plain text from markdown for reading time calculation
 * @param content Markdown content
 * @returns Plain text string
 */
export function extractPlainTextFromMarkdown(content: string): string {
  if (!content) return '';
  
  try {
    // First convert to HTML, then strip HTML tags
    const html = marked(content) as string;
    return html.replace(/<[^>]*>/g, '');
  } catch (error) {
    console.error('Error extracting plain text from markdown:', error);
    // Fallback: basic markdown stripping
    return content
      .replace(/#{1,6}\s+/g, '') // Remove heading markers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link formatting
      .replace(/`([^`]+)`/g, '$1'); // Remove code formatting
  }
} 