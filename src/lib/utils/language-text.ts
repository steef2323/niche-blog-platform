/**
 * Language-specific text utility
 * Generates language-specific UI text based on site language
 */

export interface LanguageText {
  privateEventButton: string;
  contactUs: string;
  pages: string;
  blog: string;
  allArticles: string;
  home: string;
  sitemap: string;
  privateEventFormUrl: string; // URL path for the private event form
}

/**
 * Get language-specific text based on site language
 * @param language - The site language (e.g., 'Dutch', 'English', 'nl', 'en')
 * @returns LanguageText object with all UI strings
 */
export function getLanguageText(language?: string | null): LanguageText {
  const lang = (language || '').toLowerCase();
  const isDutch = lang === 'dutch' || lang === 'nl' || lang === 'nederlands';
  
  if (isDutch) {
    return {
      privateEventButton: 'Boek evenement',
      contactUs: 'Contact ons',
      pages: 'Pagina\'s',
      blog: 'Blog',
      allArticles: 'Alle artikelen',
      home: 'Home',
      sitemap: 'Sitemap',
      privateEventFormUrl: '/aanmeld-formulier'
    };
  }
  
  // Default to English
  return {
    privateEventButton: 'Book private event',
    contactUs: 'Contact us',
    pages: 'Pages',
    blog: 'Blog',
    allArticles: 'All Articles',
    home: 'Home',
    sitemap: 'Sitemap',
    privateEventFormUrl: '/private-event-form'
  };
}

