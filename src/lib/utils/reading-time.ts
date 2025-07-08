import { extractPlainTextFromMarkdown } from './markdown';

/**
 * Calculate reading time for text content
 * @param content The text content to analyze (can be markdown or HTML)
 * @param wordsPerMinute Average reading speed (default: 200 words per minute)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 0;
  
  // Extract plain text from markdown/HTML
  const plainText = extractPlainTextFromMarkdown(content);
  
  // Count words (split by whitespace and filter out empty strings)
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Calculate reading time in minutes
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime); // Minimum 1 minute
}

/**
 * Format reading time for display
 * @param minutes Reading time in minutes
 * @returns Formatted string like "5 min read"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 min read';
  }
  return `${minutes} min read`;
} 