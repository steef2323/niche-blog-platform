import { BlogPost, ListingPost, Site, Author, Category, Business, Page } from '@/types/airtable';

/**
 * Generate Organization schema for the site
 * @param site - Site data from Airtable
 * @returns JSON-LD Organization schema
 */
export function generateOrganizationSchema(site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": site.Name,
    "url": site['Site URL'] || `https://${site.Domain}`,
    "logo": site['Site logo']?.[0]?.url ? {
      "@type": "ImageObject",
      "url": site['Site logo'][0].url,
      "width": site['Site logo'][0].width,
      "height": site['Site logo'][0].height
    } : undefined,
    "description": site['Default meta description'] || `Welcome to ${site.Name}`,
    "sameAs": [], // Add social media URLs if available
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service"
    }
  };
}

/**
 * Generate WebSite schema for the site
 * @param site - Site data from Airtable
 * @returns JSON-LD WebSite schema
 */
export function generateWebSiteSchema(site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": site.Name,
    "url": site['Site URL'] || `https://${site.Domain}`,
    "description": site['Default meta description'] || `Welcome to ${site.Name}`,
    "publisher": {
      "@type": "Organization",
      "name": site.Name
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${site['Site URL'] || `https://${site.Domain}`}/blog?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Generate Article schema for blog posts
 * @param post - Blog post data from Airtable
 * @param site - Site data from Airtable
 * @param author - Author data (optional)
 * @returns JSON-LD Article schema
 */
export function generateArticleSchema(post: BlogPost, site: Site, author?: Author) {
  const articleSchema: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.H1 || post.Title || "Untitled Article",
    "description": post['Meta description'] || post.Excerpt || "",
    "image": post['Featured image']?.[0]?.url ? {
      "@type": "ImageObject",
      "url": post['Featured image'][0].url,
      "width": post['Featured image'][0].width,
      "height": post['Featured image'][0].height
    } : undefined,
    "datePublished": post['Published date'] || new Date().toISOString(),
    "dateModified": post['Last updated'] || post['Published date'] || new Date().toISOString(),
    "author": author ? {
      "@type": "Person",
      "name": author.Name,
      "url": `${site['Site URL'] || `https://${site.Domain}`}/blog/author/${author.id || author.ID?.toString() || author.Name?.toLowerCase().replace(/\s+/g, '-')}`
    } : {
      "@type": "Organization",
      "name": site.Name
    },
    "publisher": {
      "@type": "Organization",
      "name": site.Name,
      "logo": site['Site logo']?.[0]?.url ? {
        "@type": "ImageObject",
        "url": site['Site logo'][0].url
      } : undefined
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${site['Site URL'] || `https://${site.Domain}`}/blog/${post.Slug}`
    },
    "articleSection": post.CategoryDetails?.Name || "Blog",
    "keywords": post['Main keyword']?.map(k => typeof k === 'string' ? k : (k as any).Name).join(', ') || "",
    "wordCount": post['Full article']?.split(' ').length || 0
  };

  // Add article body if available
  if (post['Full article']) {
    articleSchema.articleBody = post['Full article'];
  }

  return articleSchema;
}

/**
 * Generate LocalBusiness schema for business listings
 * @param post - Listing post data from Airtable
 * @param site - Site data from Airtable
 * @returns JSON-LD LocalBusiness schema
 */
export function generateLocalBusinessSchema(post: ListingPost, site: Site) {
  // Get the first business from the BusinessDetails array
  const business = post.BusinessDetails?.[0] as Business;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business?.Competitor || post.Title || "Business Listing",
    "description": post['Meta description'] || post.Excerpt || business?.Information || "",
    "image": post['Featured image']?.[0]?.url ? {
      "@type": "ImageObject",
      "url": post['Featured image'][0].url,
      "width": post['Featured image'][0].width,
      "height": post['Featured image'][0].height
    } : undefined,
    "url": `${site['Site URL'] || `https://${site.Domain}`}/blog/${post.Slug}`,
    "telephone": "", // Not available in current structure
    "email": "", // Not available in current structure
    "address": business?.Cities?.[0] ? {
      "@type": "PostalAddress",
      "addressLocality": business.Cities[0],
      "addressCountry": "Netherlands" // Default for Dutch businesses
    } : undefined,
    "geo": undefined, // Not available in current structure
    "openingHours": "", // Not available in current structure
    "priceRange": business?.Price ? `€${business.Price}` : "",
    "currenciesAccepted": "EUR",
    "paymentAccepted": "", // Not available in current structure
    "areaServed": business?.Cities?.join(', ') || "",
    "hasMap": "", // Not available in current structure
    "sameAs": business?.Website ? [business.Website] : []
  };
}

/**
 * Generate BreadcrumbList schema
 * @param breadcrumbs - Array of breadcrumb items
 * @param site - Site data from Airtable
 * @returns JSON-LD BreadcrumbList schema
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{label: string, href?: string}>, site: Site) {
  const siteUrl = site['Site URL'] || `https://${site.Domain}`;
  
  const breadcrumbItems = breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.label,
    "item": crumb.href ? `${siteUrl}${crumb.href}` : undefined
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  };
}

/**
 * Generate Person schema for authors
 * @param author - Author data from Airtable
 * @param site - Site data from Airtable
 * @returns JSON-LD Person schema
 */
export function generatePersonSchema(author: Author, site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.Name,
    "email": author.Email || "",
    "description": author.Bio || "",
    "image": author['Profile picture']?.[0]?.url ? {
      "@type": "ImageObject",
      "url": author['Profile picture'][0].url,
      "width": author['Profile picture'][0].width,
      "height": author['Profile picture'][0].height
    } : undefined,
    "url": `${site['Site URL'] || `https://${site.Domain}`}/blog/author/${author.Slug || author.id || author.ID?.toString() || author.Name?.toLowerCase().replace(/\s+/g, '-')}`,
    "worksFor": {
      "@type": "Organization",
      "name": site.Name
    }
  };
}

/**
 * Generate FAQ schema for FAQ content
 * @param questions - Array of FAQ items
 * @returns JSON-LD FAQPage schema
 */
export function generateFAQSchema(questions: Array<{question: string, answer: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };
}

/**
 * Generate Review schema for reviews
 * Supports two formats:
 * 1. Object format: {rating: number, text: string, author: string}
 * 2. Individual parameters: reviewText, reviewerName (rating defaults to 5)
 * @param reviewOrText - Review object or review text string
 * @param siteOrName - Site object or reviewer name string
 * @param site - Site object (required when using individual parameters)
 * @returns JSON-LD Review schema
 */
export function generateReviewSchema(
  reviewOrText: {rating: number, text: string, author: string} | string,
  siteOrName: Site | string,
  site?: Site
) {
  // Determine which format is being used
  const isObjectFormat = typeof reviewOrText === 'object';
  
  let reviewText: string;
  let reviewerName: string;
  let rating: number;
  let siteData: Site;
  
  if (isObjectFormat) {
    // Object format: {rating, text, author}, site
    const review = reviewOrText as {rating: number, text: string, author: string};
    reviewText = review.text;
    reviewerName = review.author;
    rating = review.rating;
    siteData = siteOrName as Site;
  } else {
    // Individual parameters: reviewText, reviewerName, site
    reviewText = reviewOrText as string;
    reviewerName = siteOrName as string;
    rating = 5; // Default rating for homepage reviews
    siteData = site!;
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Organization",
      "name": siteData.Name,
      "url": siteData['Site URL'] || `https://${siteData.Domain}`
    },
    "reviewBody": reviewText,
    "author": {
      "@type": "Person",
      "name": reviewerName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating.toString(),
      "bestRating": "5"
    }
  };
}

/**
 * Combine multiple schemas into a single JSON-LD script
 * @param schemas - Array of schema objects
 * @returns Combined JSON-LD script
 */
export function combineSchemas(schemas: any[]): any[] {
  return schemas.filter(schema => schema !== null && schema !== undefined);
}

/**
 * Generate schema markup for a blog post page
 * @param post - Blog post data
 * @param site - Site data
 * @param author - Author data (optional)
 * @param breadcrumbs - Breadcrumb items (optional)
 * @returns Array of schema objects
 */
export function generateBlogPostSchemas(post: BlogPost, site: Site, author?: Author, breadcrumbs?: Array<{label: string, href?: string}>) {
  const schemas: any[] = [
    generateWebSiteSchema(site),
    generateArticleSchema(post, site, author)
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs, site));
  }

  return combineSchemas(schemas);
}

/**
 * Generate schema markup for a listing post page
 * @param post - Listing post data
 * @param site - Site data
 * @param breadcrumbs - Breadcrumb items (optional)
 * @returns Array of schema objects
 */
export function generateListingPostSchemas(post: ListingPost, site: Site, breadcrumbs?: Array<{label: string, href?: string}>) {
  const schemas: any[] = [
    generateWebSiteSchema(site),
    generateLocalBusinessSchema(post, site)
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs, site));
  }

  return combineSchemas(schemas);
}


/**
 * Generate CollectionPage schema for blog overview page
 * @param site - Site data
 * @param posts - Array of blog posts and listing posts
 * @returns JSON-LD CollectionPage schema
 */
export function generateCollectionPageSchema(site: Site, posts: Array<{id?: string, Slug: string, Title?: string, H1?: string}>) {
  const siteUrl = site['Site URL'] || `https://${site.Domain}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Blog",
    "url": `${siteUrl}/blog`,
    "description": site['Default meta description'] || `Read our latest articles and insights from ${site.Name}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts.length,
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "@id": `${siteUrl}/blog/${post.Slug}`,
          "name": post.H1 || post.Title || "Untitled"
        }
      }))
    }
  };
}

/**
 * Generate schema markup for homepage
 * @param site - Site data
 * @param homePage - Homepage page data (optional, for review schema)
 * @returns Array of schema objects
 */
export function generateHomepageSchemas(site: Site, homePage?: Page) {
  const schemas = [
    generateWebSiteSchema(site),
    generateOrganizationSchema(site)
  ];
  
  // Add Review schema if review exists
  if (homePage?.['Review 1'] && homePage?.['Review reviewer 1']) {
    schemas.push(generateReviewSchema(
      homePage['Review 1'],
      homePage['Review reviewer 1'],
      site
    ));
  }
  
  return combineSchemas(schemas);
}

/**
 * Generate schema markup for blog overview page
 * @param site - Site data
 * @param blogPage - Blog page data (optional)
 * @param posts - Array of blog posts and listing posts (optional)
 * @param breadcrumbs - Breadcrumb items (optional)
 * @returns Array of schema objects
 */
export function generateBlogOverviewSchemas(
  site: Site, 
  blogPage?: Page, 
  posts?: Array<{id?: string, Slug: string, Title?: string, H1?: string}>,
  breadcrumbs?: Array<{label: string, href?: string}>
) {
  const schemas = [
    generateWebSiteSchema(site),
    generateOrganizationSchema(site)
  ];
  
  // Add CollectionPage schema if posts are provided
  if (posts && posts.length > 0) {
    schemas.push(generateCollectionPageSchema(site, posts));
  }
  
  // Add Breadcrumb schema if breadcrumbs are provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs, site));
  }
  
  return combineSchemas(schemas);
}

/**
 * Generate CollectionPage schema for category page
 * @param category - Category data
 * @param site - Site data
 * @param posts - Array of blog posts and listing posts in this category
 * @returns JSON-LD CollectionPage schema
 */
export function generateCategoryPageSchema(
  category: Category, 
  site: Site, 
  posts?: Array<{id?: string, Slug: string, Title?: string, H1?: string}>
) {
  const siteUrl = site['Site URL'] || `https://${site.Domain}`;
  const categoryName = category['Page title'] || category.Name;
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryName,
    "url": `${siteUrl}/blog/category/${category.Slug}`,
    "description": category['Meta description'] || category.Description || `Browse articles in ${categoryName}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts?.length || 0,
      "itemListElement": posts?.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "@id": `${siteUrl}/blog/${post.Slug}`,
          "name": post.H1 || post.Title || "Untitled"
        }
      })) || []
    },
    "about": {
      "@type": "Thing",
      "name": categoryName,
      "description": category.Description || ""
    }
  };
}

/**
 * Generate schema markup for category page
 * @param category - Category data
 * @param site - Site data
 * @param posts - Array of blog posts and listing posts in this category (optional)
 * @param breadcrumbs - Breadcrumb items (optional)
 * @returns Array of schema objects
 */
export function generateCategoryPageSchemas(
  category: Category,
  site: Site,
  posts?: Array<{id?: string, Slug: string, Title?: string, H1?: string}>,
  breadcrumbs?: Array<{label: string, href?: string}>
) {
  const schemas = [
    generateWebSiteSchema(site),
    generateOrganizationSchema(site),
    generateCategoryPageSchema(category, site, posts)
  ];
  
  // Add Breadcrumb schema if breadcrumbs are provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs, site));
  }
  
  return combineSchemas(schemas);
}

/**
 * Generate CollectionPage schema for author page
 * @param author - Author data
 * @param site - Site data
 * @param posts - Array of blog posts and listing posts by this author
 * @returns JSON-LD CollectionPage schema
 */
export function generateAuthorPageSchema(
  author: Author,
  site: Site,
  posts?: Array<{id?: string, Slug: string, Title?: string, H1?: string}>
) {
  const siteUrl = site['Site URL'] || `https://${site.Domain}`;
  const authorSlug = author.Slug || author.id || author.ID?.toString() || author.Name?.toLowerCase().replace(/\s+/g, '-');
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${author.Name} - Author`,
    "url": `${siteUrl}/blog/author/${authorSlug}`,
    "description": author['Meta description'] || author.Bio || `Read articles by ${author.Name}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts?.length || 0,
      "itemListElement": posts?.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "@id": `${siteUrl}/blog/${post.Slug}`,
          "name": post.H1 || post.Title || "Untitled"
        }
      })) || []
    },
    "author": {
      "@type": "Person",
      "name": author.Name,
      "url": `${siteUrl}/blog/author/${authorSlug}`
    }
  };
}

/**
 * Generate schema markup for author page
 * @param author - Author data
 * @param site - Site data
 * @param posts - Array of blog posts and listing posts by this author (optional)
 * @param breadcrumbs - Breadcrumb items (optional)
 * @returns Array of schema objects
 */
export function generateAuthorPageSchemas(
  author: Author,
  site: Site,
  posts?: Array<{id?: string, Slug: string, Title?: string, H1?: string}>,
  breadcrumbs?: Array<{label: string, href?: string}>
) {
  const schemas = [
    generateWebSiteSchema(site),
    generateOrganizationSchema(site),
    generatePersonSchema(author, site),
    generateAuthorPageSchema(author, site, posts)
  ];
  
  // Add Breadcrumb schema if breadcrumbs are provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs, site));
  }
  
  return combineSchemas(schemas);
} 