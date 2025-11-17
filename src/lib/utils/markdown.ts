import { marked } from 'marked';

/**
 * Process [LINK: link text: slug] patterns in content
 * Converts "[LINK: sip and paint workshop: slug]" to "[sip and paint workshop](/blog/slug)"
 * Also handles markdown formatting: "**[LINK: text: slug]**"
 * Handles both slugs and full URLs
 * @param content Markdown content
 * @returns Content with LINK patterns converted to markdown links
 */
function processLinkPatterns(content: string): string {
  if (!content) return '';
  
  // Pattern to match: [LINK: link text: slug]
  // The format is: [LINK: text: target]
  // We need to find the last colon before the closing bracket to split text and target
  // Also handle optional markdown formatting: **[LINK: text: slug]**
  
  // First, handle cases with ** before and/or after: **[LINK: text: slug]** or [LINK: text: slug]**
  let processed = content.replace(/(\*\*)?\[LINK:\s*([^\]]+)\](?:\*\*)?/g, 
    (match, formatBefore, linkContent) => {
      // Check if there's closing ** by checking if match ends with ]**
      const hasClosingFormat = match.endsWith(']**');
      const formatAfter = hasClosingFormat ? '**' : '';
      const formatBeforeStr = formatBefore || '';
      
      // Split on colon to separate text and target
      // Look for ": " (colon + space) first, as that's the intended separator
      // We need to find the LAST ": " that's followed by something that looks like a URL or slug
      let splitIndex = -1;
      
      // First, try to find the last ": " (colon followed by space) that's followed by a URL/slug
      let searchIndex = 0;
      let lastValidColonSpace = -1;
      while (true) {
        const colonSpaceIndex = linkContent.indexOf(': ', searchIndex);
        if (colonSpaceIndex === -1) break;
        
        // Check if what comes after ": " looks like a URL or slug
        const afterColonSpace = linkContent.substring(colonSpaceIndex + 2).trim();
        if (afterColonSpace.startsWith('http://') || 
            afterColonSpace.startsWith('https://') || 
            afterColonSpace.startsWith('/') ||
            /^[\w-]+/.test(afterColonSpace)) {
          lastValidColonSpace = colonSpaceIndex;
        }
        searchIndex = colonSpaceIndex + 1;
      }
      
      if (lastValidColonSpace !== -1) {
        splitIndex = lastValidColonSpace;
      }
      
      // If no ": " found, look for a colon where the part after it starts with http:// or https://
      if (splitIndex === -1) {
        let searchIndex2 = 0;
        while (true) {
          const colonIndex = linkContent.indexOf(':', searchIndex2);
          if (colonIndex === -1) break;
          
          const afterColon = linkContent.substring(colonIndex + 1).trim();
          if (afterColon.startsWith('http://') || afterColon.startsWith('https://')) {
            splitIndex = colonIndex;
            break; // Use first colon that's followed by http:// or https://
          }
          searchIndex2 = colonIndex + 1;
        }
      }
      
      // If still no separator found, use the last colon as fallback
      if (splitIndex === -1) {
        splitIndex = linkContent.lastIndexOf(':');
      }
      
      if (splitIndex === -1) {
        // No colon found, treat entire content as target (backward compatibility)
        const cleanTarget = linkContent.trim();
        let linkUrl: string;
        
        if (cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://')) {
          linkUrl = cleanTarget;
        } else if (cleanTarget.startsWith('/')) {
          linkUrl = cleanTarget;
        } else {
          linkUrl = `/blog/${cleanTarget}`;
        }
        
        // If no text specified, use the target as text
        return `${formatBeforeStr}[${cleanTarget}](${linkUrl})${formatAfter}`;
      }
      
      // Extract text (before separator) and target (after separator)
      // If separator was ": ", skip the space; otherwise just use the colon position
      const isColonSpace = linkContent.substring(splitIndex, splitIndex + 2) === ': ';
      const linkText = linkContent.substring(0, splitIndex).trim();
      const linkTarget = linkContent.substring(splitIndex + (isColonSpace ? 2 : 1)).trim();
      
      if (!linkText || !linkTarget) {
        // Invalid format, return as-is
        return match;
      }
      
      // Determine the link URL
      let linkUrl: string;
      
      if (linkTarget.startsWith('http://') || linkTarget.startsWith('https://')) {
        linkUrl = linkTarget;
      } else if (linkTarget.startsWith('/')) {
        linkUrl = linkTarget;
      } else {
        linkUrl = `/blog/${linkTarget}`;
      }
      
      // Convert to markdown link format
      return `${formatBeforeStr}[${linkText}](${linkUrl})${formatAfter}`;
    }
  );
  
  return processed;
}

/**
 * Parse markdown content to HTML
 * @param content Markdown content from Airtable
 * @returns HTML string
 */
export function parseMarkdownToHtml(content: string): string {
  if (!content) return '';
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    console.warn('parseMarkdownToHtml received non-string content:', typeof content);
    return '';
  }
  
  try {
    // First, process [LINK: slug] patterns before converting markdown
    content = processLinkPatterns(content);
    
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
    
    // Add target="_blank" and rel="noopener noreferrer" to all links to open in new tab
    html = html.replace(/<a\s+([^>]*)>/gi, (match, attributes) => {
      // Check if target is already set
      if (attributes.includes('target=')) {
        // If target exists, ensure it's _blank
        let updated = match.replace(/target=["'][^"']*["']/gi, 'target="_blank"');
        // Add or update rel attribute
        if (!updated.includes('rel=')) {
          updated = updated.replace(/>/, ' rel="noopener noreferrer">');
        } else if (!updated.includes('noopener')) {
          updated = updated.replace(/rel=["']([^"']*)["']/gi, (relMatch, relValue) => {
            return `rel="${relValue} noopener noreferrer"`;
          });
        }
        return updated;
      } else {
        // Add target and rel attributes before the closing >
        return match.replace(/>/, ' target="_blank" rel="noopener noreferrer">');
      }
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