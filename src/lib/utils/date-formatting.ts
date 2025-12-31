/**
 * Date formatting utility
 * Formats dates according to site language
 */

/**
 * Map site language to locale codes for date formatting
 */
function getLocaleFromLanguage(language?: string | null): string {
  if (!language) return 'en-US';
  
  const lang = language.toLowerCase();
  
  // Dutch variations
  if (lang === 'dutch' || lang === 'nl' || lang === 'nederlands') {
    return 'nl-NL';
  }
  
  // English variations
  if (lang === 'english' || lang === 'en') {
    return 'en-US';
  }
  
  // Default to English
  return 'en-US';
}

/**
 * Format a date according to site language
 * @param date - Date object or date string
 * @param language - Site language (e.g., 'Dutch', 'English', 'nl', 'en')
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  language?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return ''; // Invalid date
  }
  
  const locale = getLocaleFromLanguage(language);
  
  // Default options if none provided
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const formatOptions = options || defaultOptions;
  
  return dateObj.toLocaleDateString(locale, formatOptions);
}

/**
 * Format a date for display in blog posts (short format: "Jan 15, 2024")
 */
export function formatBlogDate(
  date: Date | string,
  language?: string | null
): string {
  return formatDate(date, language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date for author pages (month and year only: "January 2024")
 */
export function formatAuthorDate(
  date: Date | string,
  language?: string | null
): string {
  return formatDate(date, language, {
    year: 'numeric',
    month: 'long'
  });
}

