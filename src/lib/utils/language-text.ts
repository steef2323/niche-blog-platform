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
  
  // Blog and content related
  otherBlogs: string;
  noImage: string;
  minRead: string;
  article: string;
  articles: string;
  listicle: string;
  noArticlesFound: string;
  browseAllArticles: string;
  articlesBy: string; // Template: "Articles by {author}" or "Artikelen van {author}"
  
  // UI elements
  languages: string;
  language: string;
  viewExamples: string;
  viewAllIn: string; // Template: "View All in {category}" or "Bekijk alles in {category}"
  loadingMorePosts: string;
  joined: string;
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
      privateEventFormUrl: '/aanmeld-formulier',
      
      // Blog and content related
      otherBlogs: 'Andere blogs',
      noImage: 'Geen afbeelding',
      minRead: 'min lezen',
      article: 'artikel',
      articles: 'artikelen',
      listicle: 'Lijst',
      noArticlesFound: 'Geen artikelen gevonden',
      browseAllArticles: 'Bekijk alle artikelen',
      articlesBy: 'Artikelen van', // Will be used as "Artikelen van {author}"
      
      // UI elements
      languages: 'Talen:',
      language: 'Taal',
      viewExamples: 'Bekijk voorbeelden',
      viewAllIn: 'Bekijk alles in', // Will be used as "Bekijk alles in {category}"
      loadingMorePosts: 'Meer berichten laden...',
      joined: 'Lid sinds'
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
    privateEventFormUrl: '/private-event-form',
    
    // Blog and content related
    otherBlogs: 'Other blogs',
    noImage: 'No image',
    minRead: 'min read',
    article: 'article',
    articles: 'articles',
    listicle: 'Listicle',
    noArticlesFound: 'No articles found',
    browseAllArticles: 'Browse All Articles',
    articlesBy: 'Articles by', // Will be used as "Articles by {author}"
    
    // UI elements
    languages: 'Languages:',
    language: 'Language',
    viewExamples: 'View Examples',
    viewAllIn: 'View All in', // Will be used as "View All in {category}"
    loadingMorePosts: 'Loading more posts...',
    joined: 'Joined'
  };
}

