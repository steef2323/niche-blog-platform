import { BlogPost, ListingPost, Page, Business, Location } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';
import contentCache from './content-cache';

/**
 * Get blog posts for a specific site, optionally using an Airtable view
 * @param siteId The Airtable record ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of BlogPost objects
 */
export async function getBlogPostsBySiteId(siteId: string, limit?: number, viewName?: string): Promise<BlogPost[]> {
  try {
    // CACHE CHECK: Try bulk cache first to avoid API calls
    const bulkData = contentCache.get('bulk-content');
    if (bulkData) {
      const siteBlogPosts = bulkData.blogPosts
        .filter(post => {
          const siteField = post.Site;
          return Array.isArray(siteField) && siteField.includes(siteId as any);
        })
        .sort((a, b) => {
          const dateA = new Date(a['Published date'] || '').getTime();
          const dateB = new Date(b['Published date'] || '').getTime();
          return dateB - dateA; // Most recent first
        });
      
      const limitedPosts = limit && siteBlogPosts.length > limit
        ? siteBlogPosts.slice(0, limit)
        : siteBlogPosts;
      
      if (limitedPosts.length > 0) {
        console.log(`✅ Cache hit: Returning ${limitedPosts.length} blog posts for site ${siteId} from bulk cache`);
        return limitedPosts as BlogPost[];
      }
    }
    
    console.log(`📡 Cache miss: Fetching blog posts for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch blog posts');
      return [];
    }
    
    let postRecords: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use Airtable view (which is already filtered for the site)
      // IMPORTANT: View now contains both published and unpublished posts, so we must filter by Published
      console.log(`Using Airtable view "${viewName}" - fetching published blog posts from view`);
      
      try {
        postRecords = await base(TABLES.BLOG_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Published} = TRUE()`, // Filter for published posts only
            sort: [{ field: 'Published date', direction: 'desc' }],
          })
          .all();
        
        console.log(`✅ Found ${postRecords.length} published blog posts in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    if (!viewName || postRecords.length === 0) {
      if (!viewName) {
        console.log('Using fallback method with filterByFormula');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      postRecords = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: `AND(
            {Published} = TRUE(),
            Site = "${siteId}"
          )`,
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${postRecords.length} blog posts via fallback`);
    }
    
    // Map to BlogPost objects with IDs
    const blogPosts = postRecords.map(post => ({
      ...(post.fields as unknown as BlogPost),
      id: post.id
    }));
    
    // Apply limit if specified
    const limitedPosts = limit && blogPosts.length > limit 
      ? blogPosts.slice(0, limit)
      : blogPosts;
    
    console.log(`Returning ${limitedPosts.length} blog posts for site ID: ${siteId}`);
    
    return limitedPosts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw new AirtableError(
      'Failed to fetch blog posts for site',
      TABLES.BLOG_POSTS,
      'getBlogPostsBySiteId',
      error
    );
  }
}

/**
 * Get listing posts for a specific site, optionally using an Airtable view
 * @param siteId The Airtable record ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of ListingPost objects
 */
export async function getListingPostsBySiteId(siteId: string, limit?: number, viewName?: string): Promise<ListingPost[]> {
  try {
    // CACHE CHECK: Try bulk cache first to avoid API calls
    const bulkData = contentCache.get('bulk-content');
    if (bulkData) {
      const siteListingPosts = bulkData.listingPosts
        .filter(post => {
          const siteField = post.Site;
          return Array.isArray(siteField) && siteField.includes(siteId as any);
        })
        .sort((a, b) => {
          const dateA = new Date(a['Published date'] || '').getTime();
          const dateB = new Date(b['Published date'] || '').getTime();
          return dateB - dateA; // Most recent first
        });
      
      const limitedPosts = limit && siteListingPosts.length > limit
        ? siteListingPosts.slice(0, limit)
        : siteListingPosts;
      
      if (limitedPosts.length > 0) {
        console.log(`✅ Cache hit: Returning ${limitedPosts.length} listing posts for site ${siteId} from bulk cache`);
        return limitedPosts as ListingPost[];
      }
    }
    
    console.log(`📡 Cache miss: Fetching listing posts for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch listing posts');
      return [];
    }
    
    let postRecords: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use Airtable view (which is already filtered for the site)
      // IMPORTANT: View now contains both published and unpublished posts, so we must filter by Published
      console.log(`Using Airtable view "${viewName}" - fetching published listing posts from view`);
      
      try {
        postRecords = await base(TABLES.LISTING_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Published} = TRUE()`, // Filter for published posts only
            sort: [{ field: 'Published date', direction: 'desc' }],
          })
          .all();
        
        console.log(`✅ Found ${postRecords.length} published listing posts in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    if (!viewName || postRecords.length === 0) {
      if (!viewName) {
        console.log('Using fallback method with filterByFormula');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      postRecords = await base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: `AND(
            {Published} = TRUE(),
            Site = "${siteId}"
          )`,
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${postRecords.length} listing posts via fallback`);
    }
    
    // Map to ListingPost objects with IDs
    let listingPosts = postRecords.map(post => ({ ...post.fields, id: post.id } as unknown as ListingPost));
    
    // Apply limit if specified
    if (limit && listingPosts.length > limit) {
      listingPosts = listingPosts.slice(0, limit);
    }
    
    // For posts without Featured image, fetch first location image and use it as featured image
    await populateFeaturedImagesFromLocations(listingPosts);
    
    console.log(`Returning ${listingPosts.length} listing posts for site ID: ${siteId}`);
    
    return listingPosts;
  } catch (error) {
    console.error('Error fetching listing posts:', error);
    throw new AirtableError(
      'Failed to fetch listing posts for site',
      TABLES.LISTING_POSTS,
      'getListingPostsBySiteId',
      error
    );
  }
}

/**
 * Get homepage content from Pages table, optionally using an Airtable view
 * @param siteId The Airtable record ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Page object for homepage or null if not found
 */
export async function getHomepageContent(siteId: string, viewName?: string): Promise<Page | null> {
  try {
    // CACHE CHECK: Try bulk cache first to avoid API calls
    const bulkData = contentCache.get('bulk-content');
    if (bulkData) {
      const sitePages = bulkData.pages.filter(page => {
        const siteField = page.Site;
        return Array.isArray(siteField) && siteField.includes(siteId as any);
      });
      
      const homepage = sitePages.find(page => page.Page === 'Home');
      if (homepage) {
        console.log(`✅ Cache hit: Returning homepage for site ${siteId} from bulk cache`);
        return homepage as Page;
      }
    }
    
    console.log(`📡 Cache miss: Fetching homepage content for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch homepage content');
      return null;
    }
    
    // NEW SYSTEM: Use ONLY the Airtable view when provided
    // The view (e.g., "sipandpaints.nl") is already filtered for that site
    // We just need to find the record where Page = "Home"
    let homePage: Page | null = null;
    
    if (viewName) {
      // Use ONLY the Airtable view - no filterByFormula, no manual filtering
      // The view should already contain only pages for this site
      console.log(`Using Airtable view "${viewName}" - fetching all pages from view`);
      
      try {
        // Get all pages from the view (view is already filtered for the site)
        const allPages = await base(TABLES.PAGES)
          .select({
            view: viewName,
            // Don't use filterByFormula with view - get all records and filter in code
          })
          .all();
        
        console.log(`Found ${allPages.length} pages in view "${viewName}"`);
        
        // Filter for the "Home" page in JavaScript
        const homePages = allPages.filter(page => {
          const pageType = page.fields.Page;
          return pageType === 'Home';
        });
        
        if (homePages.length > 0) {
          console.log(`✅ Found ${homePages.length} Home page(s) in view "${viewName}"`);
          homePage = homePages[0].fields as unknown as Page;
          console.log(`✅ Homepage found: "${homePage.Title}" (ID: ${homePages[0].id})`);
        } else {
          console.log(`❌ No Home page found in view "${viewName}"`);
        }
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    if (!homePage) {
      console.log('Using fallback method with filterByFormula');
      const pages = await base(TABLES.PAGES)
        .select({
          filterByFormula: `AND(
            {Published} = TRUE(),
            Site = "${siteId}",
            {Page} = "Home"
          )`,
          maxRecords: 1,
        })
        .firstPage();
      
      if (pages.length > 0) {
        homePage = pages[0].fields as unknown as Page;
        console.log(`✅ Homepage found via fallback: "${homePage.Title}"`);
      } else {
        console.log(`❌ No homepage found for site ID: ${siteId}`);
      }
    }
    
    return homePage;
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    throw new AirtableError(
      'Failed to fetch homepage content for site',
      TABLES.PAGES,
      'getHomepageContent',
      error
    );
  }
}

/**
 * Get a single blog post by slug, optionally using an Airtable view
 * @param slug The slug of the blog post
 * @param siteId The ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Blog post with author and category information
 */
export async function getBlogPostBySlug(slug: string, siteId: string, viewName?: string): Promise<BlogPost | null> {
  try {
    console.log(`Fetching blog post with slug: ${slug} for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!slug || !siteId) {
      console.error('Slug and site ID are required to fetch blog post');
      return null;
    }
    
    let posts: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // IMPORTANT: Don't filter by Published here - we need to check redirect fields even for unpublished posts
      // We'll check Published status after checking for redirects
      console.log(`Using Airtable view "${viewName}" - fetching blog post with slug: ${slug} (including unpublished to check redirects)`);
      
      try {
        posts = await base(TABLES.BLOG_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Slug} = "${slug}"`, // No Published filter - we need to check redirects
            maxRecords: 1,
          })
          .firstPage();
        
        console.log(`✅ Found ${posts.length} blog post(s) in view "${viewName}" with slug: ${slug}`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    // IMPORTANT: Don't filter by Published here either - we need to check redirect fields
    if (posts.length === 0) {
      console.log('Using fallback method with filterByFormula (including unpublished to check redirects)...');
      
      posts = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: `AND({Slug} = "${slug}", Site = "${siteId}")`, // No Published filter
          maxRecords: 1,
        })
        .firstPage();

      // If direct filter fails, try manual filtering
      if (posts.length === 0) {
        console.log('Direct filter failed, trying manual filtering (including unpublished)...');
        
        const allPosts = await base(TABLES.BLOG_POSTS)
          .select({
            filterByFormula: `Site = "${siteId}"`, // Get all posts for this site, published or not
          })
          .all();
        
        console.log(`Found ${allPosts.length} total blog posts for this site`);
        
        // Filter manually for slug and site
        const filteredPosts = allPosts.filter(post => {
          const postSlug = post.fields.Slug;
          const siteField = post.fields.Site;
          
          const slugMatches = postSlug === slug;
          const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
          
          return slugMatches && siteMatches;
        });
        
        console.log(`Manually filtered to ${filteredPosts.length} posts for slug: ${slug} and site ID: ${siteId}`);
        
        // Debug: Log available slugs if no match found
        if (filteredPosts.length === 0 && allPosts.length > 0) {
          const availableSlugs = allPosts
            .map(post => post.fields.Slug)
            .filter(Boolean)
            .slice(0, 10); // Limit to first 10 for readability
          console.log(`📋 Available blog post slugs for this site (first 10):`, availableSlugs);
          console.log(`🔍 Looking for slug: "${slug}"`);
        }
        
        posts = filteredPosts;
      }
    }

    if (posts.length === 0) {
      console.log(`❌ No blog post found with slug: "${slug}" for site ID: ${siteId}`);
      return null;
    }
    
    // Now check if the post is published (after we've found it and can check redirects)
    const post = posts[0];
    const isPublished = post.fields.Published === true;
    
    // If not published and no redirect, return null (404)
    // Note: Redirect check happens in the page component, so we return the post even if unpublished
    // The page component will check redirect first, then check published status
    if (!isPublished) {
      console.log(`⚠️ Post found but is unpublished. Redirect will be checked in page component.`);
    }

    const blogPost = {
      ...(post.fields as unknown as BlogPost),
      id: post.id
    };
    
    // Debug: Log the author field data
    console.log('Author field data:', JSON.stringify(blogPost.Author, null, 2));
    
    // Fetch author information if available
    if (blogPost.Author && Array.isArray(blogPost.Author) && blogPost.Author.length > 0) {
      try {
        const authorId = typeof blogPost.Author[0] === 'string' ? blogPost.Author[0] : blogPost.Author[0].id;
        console.log('Fetching author with ID:', authorId);
        
        // Try direct fetch first
        try {
          const authorRecord = await base(TABLES.AUTHORS).find(authorId);
          blogPost.AuthorDetails = authorRecord.fields as any;
          console.log('Successfully fetched author details:', authorRecord.fields.Name);
        } catch (directError) {
          console.warn('Direct author fetch failed, trying manual filtering approach...');
          
          // Fallback: Get all authors and find the one we need
          const allAuthors = await base(TABLES.AUTHORS)
            .select({
            })
            .all();
          
          console.log(`Found ${allAuthors.length} total authors`);
          
          // Find the author by ID
          const authorRecord = allAuthors.find(author => author.id === authorId);
          
          if (authorRecord) {
            blogPost.AuthorDetails = authorRecord.fields as any;
            console.log('Successfully fetched author details via manual filtering:', authorRecord.fields.Name);
          } else {
            console.warn('Author not found in manual filtering');
            blogPost.AuthorDetails = { Name: 'Author', Slug: null };
          }
        }
      } catch (error) {
        console.error('Error fetching author details:', error);
        // Set a fallback author name if we have the ID but can't fetch details
        blogPost.AuthorDetails = { Name: 'Author', Slug: null };
      }
    }
    
    // Fetch category information if available
    if (blogPost.Categories && Array.isArray(blogPost.Categories) && blogPost.Categories.length > 0) {
      try {
        const categoryId = typeof blogPost.Categories[0] === 'string' ? blogPost.Categories[0] : blogPost.Categories[0].id;
        const categoryRecord = await base(TABLES.CATEGORIES).find(categoryId);
        blogPost.CategoryDetails = categoryRecord.fields as any;
        console.log('Successfully fetched category details');
      } catch (error) {
        console.warn('Could not fetch category details (may not have permission):', error);
        // Set a fallback category if we have the ID but can't fetch details
        blogPost.CategoryDetails = { Name: 'General', Slug: 'general' };
      }
    }
    
    console.log(`Successfully fetched blog post: ${blogPost.Title}`);
    return blogPost;

  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    throw new AirtableError(
      'Failed to fetch blog post by slug',
      TABLES.BLOG_POSTS,
      'getBlogPostBySlug',
      error
    );
  }
}

/**
 * Get all authors, optionally filtered by site using a view
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of Author objects
 */
export async function getAllAuthors(viewName?: string): Promise<any[]> {
  try {
    console.log(`Fetching authors${viewName ? ` using view: ${viewName}` : ''}`);
    
    const selectParams: any = {};
    if (viewName) {
      selectParams.view = viewName;
      console.log(`Using Airtable view "${viewName}" for authors`);
    }
    
    const authors = await base(TABLES.AUTHORS)
      .select(selectParams)
      .all();
    
    console.log(`Found ${authors.length} authors`);
    return authors.map(author => author.fields);
  } catch (error) {
    console.warn('Could not fetch authors (may not have permission):', error);
    return [];
  }
}

/**
 * Get authors for a specific site, optionally using an Airtable view
 * @param siteId The ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of Author objects
 */
export async function getAuthorsBySiteId(siteId: string, viewName?: string): Promise<any[]> {
  try {
    console.log(`Fetching authors for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    let authors: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // No filterByFormula, no manual filtering - the view is pre-filtered
      console.log(`Using Airtable view "${viewName}" - fetching all authors from view`);
      
      try {
        const authorRecords = await base(TABLES.AUTHORS)
          .select({
            view: viewName,
            // Don't use filterByFormula with view - view is already filtered
          })
          .all();
        
        authors = authorRecords.map(record => ({ ...record.fields, id: record.id }));
        console.log(`✅ Found ${authors.length} authors in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, get all authors and filter by site
    if (!viewName || authors.length === 0) {
      if (!viewName) {
        console.log('Using fallback method - fetching all authors and filtering manually');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      const allAuthors = await getAllAuthors();
      authors = allAuthors.filter(author => {
        const siteField = (author as any).Site;
        return Array.isArray(siteField) && siteField.includes(siteId);
      });
    }
    
    return [...authors];
  } catch (error) {
    console.warn('Could not fetch authors by site (may not have permission):', error);
    return [];
  }
}

/**
 * Get author by slug
 * @param slug The slug of the author
 * @returns Author object or null if not found
 */
export async function getAuthorBySlug(slug: string): Promise<any | null> {
  try {
    console.log(`Fetching author with slug: ${slug}`);
    
    const authors = await base(TABLES.AUTHORS)
      .select({
        filterByFormula: `{Slug} = "${slug}"`,
        maxRecords: 1,
      })
      .firstPage();
    
    if (authors.length === 0) {
      console.log(`No author found with slug: ${slug}`);
      return null;
    }
    
    console.log(`Found author: ${authors[0].fields.Name}`);
    return { ...authors[0].fields, id: authors[0].id };
  } catch (error) {
    console.warn('Could not fetch author (may not have permission):', error);
    return null;
  }
}

/**
 * Get blog posts by author slug
 * @param authorSlug The slug of the author
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of BlogPost objects
 */
export async function getBlogPostsByAuthorSlug(authorSlug: string, siteId: string, limit?: number): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts by author slug: ${authorSlug} for site ID: ${siteId}`);
    
    // First get the author to find their ID
    const author = await getAuthorBySlug(authorSlug);
    if (!author) {
      console.log(`Author not found with slug: ${authorSlug}`);
      return [];
    }
    
    console.log(`Found author:`, { id: author.id, name: author.Name, slug: author.Slug });
    
    // Get all published blog posts and filter manually
    const allPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published blog posts`);
    
    // Filter for posts by this author and site
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const authorField = post.fields.Author;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      
      // Debug author matching
      console.log(`Post ${post.fields.Title}:`, {
        postId: post.id,
        authorField: authorField,
        authorId: author.id,
        siteField: siteField,
        siteMatches: siteMatches
      });
      
      const authorMatches = Array.isArray(authorField) ? authorField.some(a => {
        const postAuthorId = typeof a === 'string' ? a : a.id;
        console.log(`Comparing author ID: ${postAuthorId} with target: ${author.id}`);
        return postAuthorId === author.id;
      }) : false;
      
      console.log(`Post ${post.fields.Title} matches:`, { siteMatches, authorMatches });
      
      return siteMatches && authorMatches;
    });
    
    console.log(`Manually filtered to ${filteredPosts.length} posts for author: ${authorSlug} and site ID: ${siteId}`);
    
    // Apply limit if specified
    let posts = filteredPosts;
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    return posts.map(post => post.fields as unknown as BlogPost);
  } catch (error) {
    console.error('Error fetching blog posts by author:', error);
    throw new AirtableError(
      'Failed to fetch blog posts by author',
      TABLES.BLOG_POSTS,
      'getBlogPostsByAuthorSlug',
      error
    );
  }
}

/**
 * Get blog page content from Pages table, optionally using an Airtable view
 * @param siteId The Airtable record ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Page object for blog page or null if not found
 */
export async function getBlogPageContent(siteId: string, viewName?: string): Promise<Page | null> {
  try {
    console.log(`Fetching blog page content for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch blog page content');
      return null;
    }
    
    // If view name is provided, use the view and filter for Blog overview page
    // Otherwise, use filterByFormula
    let pages;
    
    if (viewName) {
      // Use Airtable view - view should already be filtered for this site
      // Then filter for Blog overview page in the results
      console.log(`Using Airtable view "${viewName}" for pages`);
      pages = await base(TABLES.PAGES)
        .select({
          view: viewName,
          filterByFormula: '{Page} = "Blog overview"',
          maxRecords: 1,
        })
        .firstPage();
    } else {
      // Use filter formula
      pages = await base(TABLES.PAGES)
        .select({
          filterByFormula: `AND(
            {Published} = TRUE(),
            Site = "${siteId}",
            {Page} = "Blog overview"
          )`,
          maxRecords: 1,
        })
        .firstPage();
    }
    
    // If no pages found and NOT using a view, try manual filtering approach
    // (If using a view, the view is already filtered - don't try fallback)
    if (pages.length === 0 && !viewName) {
      console.log('Direct filter failed, trying manual filtering...');
      
      const allPages = await base(TABLES.PAGES)
        .select({
          filterByFormula: 'AND({Published} = TRUE(), {Page} = "Blog overview")',
        })
        .all();
      
      console.log(`Found ${allPages.length} total published blog pages`);
      
      // Filter manually for the site
      const filteredPages = allPages.filter(page => {
        const siteField = page.fields.Site;
        if (Array.isArray(siteField)) {
          return siteField.includes(siteId);
        }
        return false;
      });
      
      console.log(`Manually filtered to ${filteredPages.length} blog pages for site ID: ${siteId}`);
      
      if (filteredPages.length > 0) {
        pages = [filteredPages[0]]; // Take the first one
      }
    }
    
    if (pages.length === 0) {
      console.log(`No blog page found for site ID: ${siteId}`);
      return null;
    }
    
    console.log(`Found blog page for site ID: ${siteId}:`, pages[0].fields.Title);
    return pages[0].fields as unknown as Page;
  } catch (error) {
    console.error('Error fetching blog page content:', error);
    throw new AirtableError(
      'Failed to fetch blog page content for site',
      TABLES.PAGES,
      'getBlogPageContent',
      error
    );
  }
}

/**
 * Get category by slug
 * @param slug The slug of the category
 * @returns Category object or null if not found
 */
export async function getCategoryBySlug(slug: string): Promise<any | null> {
  try {
    console.log(`Fetching category with slug: ${slug}`);
    
    // Try direct fetch first
    try {
      const categories = await base(TABLES.CATEGORIES)
        .select({
          filterByFormula: `{Slug} = "${slug}"`,
          maxRecords: 1,
        })
        .firstPage();
      
      if (categories.length > 0) {
        console.log(`Found category: ${categories[0].fields.Name}`);
        return { ...categories[0].fields, id: categories[0].id };
      }
    } catch (directError) {
      console.warn('Direct category fetch failed, trying manual filtering approach...');
    }
    
    // Fallback: Get all categories and find the one we need
    const allCategories = await base(TABLES.CATEGORIES)
      .select({
      })
      .all();
    
    console.log(`Found ${allCategories.length} total categories`);
    
    // Find the category by slug
    const categoryRecord = allCategories.find(category => category.fields.Slug === slug);
    
    if (categoryRecord) {
      console.log(`Found category via manual filtering: ${categoryRecord.fields.Name}`);
      return { ...categoryRecord.fields, id: categoryRecord.id };
    }
    
    console.log(`No category found with slug: ${slug}`);
    return null;
  } catch (error) {
    console.warn('Could not fetch category (may not have permission):', error);
    return null;
  }
}

/**
 * Get blog posts by category slug
 * @param categorySlug The slug of the category
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of BlogPost objects
 */
export async function getBlogPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number, viewName?: string): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts by category slug: ${categorySlug} for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    // First get the category to find its ID
    const category = await getCategoryBySlug(categorySlug);
    if (!category) {
      console.log(`Category not found with slug: ${categorySlug}`);
      return [];
    }
    
    console.log(`Found category:`, { id: category.id, name: category.Name, slug: category.Slug });
    
    let allPosts: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use Airtable view (already filtered for site)
      // IMPORTANT: View now contains both published and unpublished posts, so we must filter by Published
      console.log(`Using Airtable view "${viewName}" - fetching published blog posts from view`);
      
      try {
        allPosts = await base(TABLES.BLOG_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Published} = TRUE()`, // Filter for published posts only
            sort: [{ field: 'Published date', direction: 'desc' }],
          })
          .all();
        
        console.log(`✅ Found ${allPosts.length} published blog posts in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, get all published posts
    if (!viewName || allPosts.length === 0) {
      if (!viewName) {
        console.log('Using fallback method - fetching all published blog posts');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      allPosts = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${allPosts.length} total published blog posts`);
    }
    
    // Filter for posts in this category (site is already filtered by view, Published is already filtered)
    const filteredPosts = allPosts.filter(post => {
      const categoriesField = post.fields.Categories;
      
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const categoryId = typeof c === 'string' ? c : c.id;
        return categoryId === category.id;
      }) : false;
      
      return categoryMatches;
    });
    
    console.log(`Filtered to ${filteredPosts.length} posts for category: ${categorySlug}`);
    
    // Apply limit if specified
    let posts = filteredPosts;
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    return posts.map(post => post.fields as unknown as BlogPost);
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    throw new AirtableError(
      'Failed to fetch blog posts by category',
      TABLES.BLOG_POSTS,
      'getBlogPostsByCategorySlug',
      error
    );
  }
}

/**
 * Get a single business by ID
 * @param businessId The Airtable record ID of the business
 * @returns Business object with ID included
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  try {
    console.log(`Fetching business with ID: ${businessId}`);
    
    const businessRecord = await base(TABLES.BUSINESSES).find(businessId);
    const business = { ...businessRecord.fields, id: businessRecord.id } as Business;
    
    // Log business data for debugging
    console.log(`Business ${businessId} fields:`, Object.keys(businessRecord.fields));
    console.log(`Business ${businessId} Competitor field:`, business.Competitor);
    
    // Don't filter out businesses - they might not have Competitor but still have other useful data
    // The Competitor field might be optional or named differently
    if (business.Competitor) {
      console.log(`Successfully fetched business: ${business.Competitor}`);
    } else {
      console.log(`Business ${businessId} fetched (no Competitor field, but may have other data)`);
    }
    
    return business;
  } catch (error) {
    console.warn(`Could not fetch business with ID ${businessId}:`, error);
    return null;
  }
}

/**
 * Get multiple businesses by their IDs
 * @param businessIds Array of Airtable record IDs
 * @returns Array of Business objects
 */
export async function getBusinessesByIds(businessIds: string[]): Promise<Business[]> {
  try {
    console.log(`Fetching ${businessIds.length} businesses`);
    
    const businesses = await Promise.all(
      businessIds.map(id => getBusinessById(id))
    );
    
    // Filter out only null results - don't filter by Competitor field as it might be optional
    const validBusinesses = businesses.filter((business): business is Business => 
      business !== null
    );
    
    if (validBusinesses.length < businesses.length) {
      console.warn(`Filtered out ${businesses.length - validBusinesses.length} null businesses`);
    }
    
    console.log(`Successfully fetched ${validBusinesses.length} out of ${businessIds.length} businesses`);
    return validBusinesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
}

/**
 * Get a single location by ID
 * @param locationId The Airtable record ID of the location
 * @returns Location object with ID included
 */
export async function getLocationById(locationId: string): Promise<Location | null> {
  try {
    console.log(`Fetching location with ID: ${locationId}`);
    
    const locationRecord = await base(TABLES.LOCATIONS).find(locationId);
    const location: Location = { ...locationRecord.fields, id: locationRecord.id } as Location;
    
    console.log(`Successfully fetched location: ${location.id}`);
    return location;
  } catch (error) {
    console.warn(`Could not fetch location with ID ${locationId}:`, error);
    return null;
  }
}

/**
 * Get locations by their IDs
 * @param locationIds Array of Airtable record IDs
 * @returns Array of Location objects
 */
export async function getLocationsByIds(locationIds: string[]): Promise<Location[]> {
  try {
    console.log(`Fetching ${locationIds.length} locations`);
    
    const locations = await Promise.all(
      locationIds.map(id => getLocationById(id))
    );
    
    // Filter out null results
    const validLocations = locations.filter((location): location is Location => 
      location !== null
    );
    
    console.log(`Successfully fetched ${validLocations.length} out of ${locationIds.length} locations`);
    return validLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Get a single listing post by slug with business details, optionally using an Airtable view
 * @param slug The slug of the listing post
 * @param siteId The ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Listing post with business information
 */
export async function getListingPostBySlug(slug: string, siteId: string, viewName?: string): Promise<ListingPost | null> {
  try {
    console.log(`Fetching listing post with slug: ${slug} for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!slug || !siteId) {
      console.error('Slug and site ID are required to fetch listing post');
      return null;
    }
    
    let posts: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // IMPORTANT: Don't filter by Published here - we need to check redirect fields even for unpublished posts
      console.log(`Using Airtable view "${viewName}" - fetching listing post with slug: ${slug} (including unpublished to check redirects)`);
      
      try {
        posts = await base(TABLES.LISTING_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Slug} = "${slug}"`, // No Published filter - we need to check redirects
            maxRecords: 1,
          })
          .firstPage();
        
        console.log(`✅ Found ${posts.length} listing post(s) in view "${viewName}" with slug: ${slug}`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    // IMPORTANT: Don't filter by Published here either - we need to check redirect fields
    if (posts.length === 0) {
      console.log('Using fallback method with filterByFormula (including unpublished to check redirects)...');
      
      // Get all listing posts for this site (published or not) and filter manually
      const allPosts = await base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: `Site = "${siteId}"`, // Get all posts for this site, published or not
        })
        .all();
      
      console.log(`Found ${allPosts.length} total listing posts for this site`);
      
      // Filter for slug and site
      const filteredPosts = allPosts.filter(post => {
        const postSlug = post.fields.Slug;
        const siteField = post.fields.Site;
        
        const slugMatches = postSlug === slug;
        const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
        
        return slugMatches && siteMatches;
      });
      
      console.log(`Manually filtered to ${filteredPosts.length} posts for slug: ${slug} and site ID: ${siteId}`);
      posts = filteredPosts;
    }
    
    if (posts.length === 0) {
      console.log(`❌ No listing post found with slug: "${slug}" for site ID: ${siteId}`);
      return null;
    }
    
    // Check if the post is published (after we've found it and can check redirects)
    const post = posts[0];
    const isPublished = post.fields.Published === true;
    
    if (!isPublished) {
      console.log(`⚠️ Listing post found but is unpublished. Redirect will be checked in page component.`);
    }

    // Post already retrieved above
    const listingPost = { ...post.fields, id: post.id } as ListingPost;
    
    // Fetch location details directly from Locations table
    // IMPORTANT: The "Businesses" field in ListingPost is actually a linked record field to Locations table, not Businesses table!
    if (listingPost.Businesses && Array.isArray(listingPost.Businesses) && listingPost.Businesses.length > 0) {
      console.log(`Fetching ${listingPost.Businesses.length} locations directly from Locations table`);
      const locationIds = listingPost.Businesses.map(b => typeof b === 'string' ? b : b.id);
      
      // Fetch locations directly by their IDs (they are Location record IDs, not Business IDs)
      const locationPromises = locationIds.map(async (locationId, index) => {
        try {
          const location = await getLocationById(locationId);
          if (location) {
            console.log(`  ✅ Fetched Location ${index + 1}: ${location.id}`);
            return location;
          } else {
            console.log(`  ⚠️ Location ${index + 1} not found: ${locationId}`);
            return null;
          }
        } catch (error) {
          console.warn(`  Error fetching Location ${index + 1} (${locationId}):`, error);
          return null;
        }
      });
      
      const locations = await Promise.all(locationPromises);
      const validLocations = locations.filter((l): l is Location => l !== null);
      console.log(`✅ Fetched ${validLocations.length} locations out of ${locationIds.length} location IDs`);
      (listingPost as any).LocationDetails = locations;
    } else {
      (listingPost as any).LocationDetails = [];
    }
    
    // Fetch author information if available
    if (listingPost.Author && Array.isArray(listingPost.Author) && listingPost.Author.length > 0) {
      try {
        const authorId = typeof listingPost.Author[0] === 'string' ? listingPost.Author[0] : listingPost.Author[0].id;
        const authorRecord = await base(TABLES.AUTHORS).find(authorId);
        listingPost.AuthorDetails = { ...authorRecord.fields, id: authorRecord.id };
        console.log('Successfully fetched author details for listing post');
      } catch (error) {
        console.warn('Could not fetch author details for listing post:', error);
        listingPost.AuthorDetails = { Name: 'Unknown Author', Slug: 'unknown' };
      }
    }
    
    // Fetch category information if available - fetch ALL categories, not just the first one
    if (listingPost.Categories && Array.isArray(listingPost.Categories) && listingPost.Categories.length > 0) {
      try {
        // Fetch all categories in parallel
        const categoryPromises = listingPost.Categories.map(async (categoryLink) => {
          const categoryId = typeof categoryLink === 'string' ? categoryLink : categoryLink.id;
          const categoryRecord = await base(TABLES.CATEGORIES).find(categoryId);
          return { ...categoryRecord.fields, id: categoryRecord.id };
        });
        
        const categories = await Promise.all(categoryPromises);
        listingPost.CategoryDetails = categories[0]; // Keep first for backward compatibility
        listingPost.AllCategoryDetails = categories; // Store all categories
        console.log(`Successfully fetched ${categories.length} category details for listing post`);
      } catch (error) {
        console.warn('Could not fetch category details for listing post:', error);
        listingPost.CategoryDetails = { Name: 'General', Slug: 'general' };
        listingPost.AllCategoryDetails = [];
      }
    }
    
    console.log(`Successfully fetched listing post: ${listingPost.Title}`);
    return listingPost;

  } catch (error) {
    console.error('Error fetching listing post by slug:', error);
    throw new AirtableError(
      'Failed to fetch listing post by slug',
      TABLES.LISTING_POSTS,
      'getListingPostBySlug',
      error
    );
  }
}

/**
 * Helper function to populate featured images from first location image for listing posts
 * @param listingPosts Array of listing posts to process
 */
async function populateFeaturedImagesFromLocations(listingPosts: ListingPost[]): Promise<void> {
  const postsNeedingLocationImage = listingPosts.filter(post => !post['Featured image']?.[0] && post.Businesses?.[0]);
  if (postsNeedingLocationImage.length > 0) {
    console.log(`Fetching first location images for ${postsNeedingLocationImage.length} listing posts without featured images`);
    const locationPromises = postsNeedingLocationImage.map(async (post) => {
      try {
        const locationId = typeof post.Businesses[0] === 'string' ? post.Businesses[0] : post.Businesses[0].id;
        const location = await getLocationById(locationId);
        if (location?.Image?.[0]) {
          // Set the first location image as the featured image
          (post as any)['Featured image'] = location.Image;
          (post as any)['Featured image alt text'] = location.Name || location.Address || post.Title;
        }
      } catch (error) {
        console.warn(`Error fetching location image for post ${post.Slug}:`, error);
      }
    });
    await Promise.all(locationPromises);
  }
}

/**
 * Get listing posts by author slug
 * @param authorSlug The slug of the author
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of ListingPost objects
 */
export async function getListingPostsByAuthorSlug(authorSlug: string, siteId: string, limit?: number): Promise<ListingPost[]> {
  try {
    console.log(`Fetching listing posts by author slug: ${authorSlug} for site ID: ${siteId}`);
    
    // First get the author to find their ID
    const author = await getAuthorBySlug(authorSlug);
    if (!author) {
      console.log(`Author not found with slug: ${authorSlug}`);
      return [];
    }
    
    console.log(`Found author:`, { id: author.id, name: author.Name, slug: author.Slug });
    
    // Get all published listing posts and filter manually
    const allPosts = await base(TABLES.LISTING_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published listing posts`);
    
    // Filter for posts by this author and site
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const authorField = post.fields.Author;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      
      const authorMatches = Array.isArray(authorField) ? authorField.some(a => {
        const authorId = typeof a === 'string' ? a : a.id;
        return authorId === author.id;
      }) : false;
      
      return siteMatches && authorMatches;
    });
    
    console.log(`Manually filtered to ${filteredPosts.length} listing posts for author: ${authorSlug} and site ID: ${siteId}`);
    
    // Apply limit if specified
    let posts = filteredPosts;
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    const listingPosts = posts.map(post => ({ ...post.fields, id: post.id } as unknown as ListingPost));
    
    // For posts without Featured image, fetch first location image and use it as featured image
    await populateFeaturedImagesFromLocations(listingPosts);
    
    return listingPosts;
  } catch (error) {
    console.error('Error fetching listing posts by author:', error);
    throw new AirtableError(
      'Failed to fetch listing posts by author',
      TABLES.LISTING_POSTS,
      'getListingPostsByAuthorSlug',
      error
    );
  }
}

/**
 * Get listing posts by category slug
 * @param categorySlug The slug of the category
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of ListingPost objects
 */
export async function getListingPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number, viewName?: string): Promise<ListingPost[]> {
  try {
    console.log(`Fetching listing posts by category slug: ${categorySlug} for site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    // First get the category to find its ID
    const category = await getCategoryBySlug(categorySlug);
    if (!category) {
      console.log(`Category not found with slug: ${categorySlug}`);
      return [];
    }
    
    console.log(`Found category:`, { id: category.id, name: category.Name, slug: category.Slug });
    
    let allPosts: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use Airtable view (already filtered for site)
      // IMPORTANT: View now contains both published and unpublished posts, so we must filter by Published
      console.log(`Using Airtable view "${viewName}" - fetching published listing posts from view`);
      
      try {
        allPosts = await base(TABLES.LISTING_POSTS)
          .select({
            view: viewName,
            filterByFormula: `{Published} = TRUE()`, // Filter for published posts only
            sort: [{ field: 'Published date', direction: 'desc' }],
          })
          .all();
        
        console.log(`✅ Found ${allPosts.length} published listing posts in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, get all published posts
    if (!viewName || allPosts.length === 0) {
      if (!viewName) {
        console.log('Using fallback method - fetching all published listing posts');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      allPosts = await base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${allPosts.length} total published listing posts`);
    }
    
    // Filter for posts in this category (site is already filtered by view, Published is already filtered)
    const filteredPosts = allPosts.filter(post => {
      const categoriesField = post.fields.Categories;
      
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const categoryId = typeof c === 'string' ? c : c.id;
        return categoryId === category.id;
      }) : false;
      
      return categoryMatches;
    });
    
    console.log(`Filtered to ${filteredPosts.length} listing posts for category: ${categorySlug}`);
    
    // Apply limit if specified
    let posts = filteredPosts;
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    const listingPosts = posts.map(post => ({ ...post.fields, id: post.id } as unknown as ListingPost));
    
    // For posts without Featured image, fetch first location image and use it as featured image
    await populateFeaturedImagesFromLocations(listingPosts);
    
    return listingPosts;
  } catch (error) {
    console.error('Error fetching listing posts by category:', error);
    throw new AirtableError(
      'Failed to fetch listing posts by category',
      TABLES.LISTING_POSTS,
      'getListingPostsByCategorySlug',
      error
    );
  }
}

/**
 * Get combined blog and listing posts by author slug
 * @param authorSlug The slug of the author
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of combined BlogPost and ListingPost objects with type
 */
export async function getCombinedPostsByAuthorSlug(authorSlug: string, siteId: string, limit?: number) {
  const [blogPosts, listingPosts] = await Promise.all([
    getBlogPostsByAuthorSlug(authorSlug, siteId),
    getListingPostsByAuthorSlug(authorSlug, siteId)
  ]);

  // Combine and sort by published date (most recent first)
  const allPosts = [
    ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
    ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a['Published date'] || '').getTime();
    const dateB = new Date(b['Published date'] || '').getTime();
    return dateB - dateA;
  });

  // Apply limit if specified
  if (limit && allPosts.length > limit) {
    return allPosts.slice(0, limit);
  }

  return [...allPosts];
}

/**
 * Get combined blog and listing posts by category slug
 * @param categorySlug The slug of the category
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of combined BlogPost and ListingPost objects with type
 */
export async function getCombinedPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number, blogPostsViewName?: string, listingPostsViewName?: string) {
  const [blogPosts, listingPosts] = await Promise.all([
    getBlogPostsByCategorySlug(categorySlug, siteId, undefined, blogPostsViewName),
    getListingPostsByCategorySlug(categorySlug, siteId, undefined, listingPostsViewName)
  ]);

  // Combine and sort by published date (most recent first)
  const allPosts = [
    ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
    ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a['Published date'] || '').getTime();
    const dateB = new Date(b['Published date'] || '').getTime();
    return dateB - dateA;
  });

  // Apply limit if specified
  if (limit && allPosts.length > limit) {
    return allPosts.slice(0, limit);
  }

  return [...allPosts];
}

/**
 * Get all categories assigned to a specific site, optionally using an Airtable view
 * @param siteId The ID of the site
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of Category objects assigned to the site
 */
export async function getCategoriesBySiteId(siteId: string, viewName?: string): Promise<any[]> {
  try {
    console.log(`Fetching categories assigned to site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    let categories: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // No filterByFormula, no manual filtering - the view is pre-filtered
      console.log(`Using Airtable view "${viewName}" - fetching all categories from view`);
      
      try {
        const categoryRecords = await base(TABLES.CATEGORIES)
          .select({
            view: viewName,
            // Don't use filterByFormula with view - view is already filtered
          })
          .all();
        
        categories = categoryRecords.map(record => ({ ...record.fields, id: record.id }));
        console.log(`✅ Found ${categories.length} categories in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, get all categories and filter manually
    if (!viewName || categories.length === 0) {
      if (!viewName) {
        console.log('Using fallback method - fetching all categories and filtering manually');
      } else {
        console.log('View returned no results, trying fallback method');
      }
      
      const allCategories = await base(TABLES.CATEGORIES)
        .select({})
        .all();
      
      console.log(`Found ${allCategories.length} total categories in Airtable`);
      
      // Filter categories to only those assigned to this site
      categories = allCategories
        .filter(category => {
          const siteField = category.fields.Site;
          const isAssigned = Array.isArray(siteField) && siteField.includes(siteId);
          console.log(`Category "${category.fields.Name}" (${category.id}): ${isAssigned ? 'ASSIGNED' : 'NOT ASSIGNED'} to site`);
          return isAssigned;
        })
        .map(category => ({ ...category.fields, id: category.id }));
    }
    
    // Sort by Priority field (1 on top, 2 below, etc.)
    const siteCategories = [...categories].sort((a, b) => {
      const priorityA = (a as any).Priority || 999; // Default to 999 if no priority set
      const priorityB = (b as any).Priority || 999;
      return priorityA - priorityB;
    });
    
    console.log(`Returning ${siteCategories.length} categories assigned to site ID: ${siteId}`);
    console.log('Site categories:', siteCategories.map(cat => ({
      id: cat.id,
      name: (cat as any).Name,
      slug: (cat as any).Slug
    })));
    
    return siteCategories;
  } catch (error) {
    console.warn('Could not fetch categories (may not have permission):', error);
    return [];
  }
}

/**
 * Get popular blog posts for a specific site
 * @param siteId The Airtable record ID of the site
 * @param limit Maximum number of popular posts to fetch (default: 3)
 * @returns Array of BlogPost objects marked as Popular
 */
export async function getPopularBlogPosts(siteId: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    console.log(`Fetching popular posts for site ID: ${siteId}, limit: ${limit}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch popular posts');
      return [];
    }
    
    // Get all published blog posts and listing posts
    const [blogPosts, listingPosts] = await Promise.all([
      base(TABLES.BLOG_POSTS).select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }]
      }).all(),
      base(TABLES.LISTING_POSTS).select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }]
      }).all()
    ]);
    
    console.log(`Found ${blogPosts.length} blog posts and ${listingPosts.length} listing posts`);
    
    // Filter for popular blog posts for this site
    const popularBlogPosts = blogPosts.filter(post => {
      const siteField = post.fields.Site;
      const popularField = post.fields.Popular;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      const isPopular = popularField === true;
      
      return siteMatches && isPopular;
    });
    
    // Note: Listing posts don't have Popular field, so we only check blog posts
    console.log(`Found ${popularBlogPosts.length} popular posts for site ID: ${siteId}`);
    
    // Convert to proper format and sort by published date
    const allPopularPosts = popularBlogPosts.map(post => post.fields as unknown as BlogPost).sort((a, b) => {
      const dateA = new Date(a['Published date'] || '').getTime();
      const dateB = new Date(b['Published date'] || '').getTime();
      return dateB - dateA;
    });
    
    // Apply limit
    const limitedPosts = allPopularPosts.slice(0, limit);
    
    console.log(`Returning ${limitedPosts.length} popular posts`);
    
    return limitedPosts;
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    throw new AirtableError(
      'Failed to fetch popular posts for site',
      TABLES.BLOG_POSTS,
      'getPopularBlogPosts',
      error
    );
  }
}

/**
 * Get blog posts by category ID, excluding popular posts
 * @param categoryId The Airtable record ID of the category
 * @param siteId The ID of the site
 * @param limit Maximum number of posts to fetch (default: 5)
 * @returns Array of BlogPost objects excluding popular posts
 */
export async function getBlogPostsByCategoryExcludingPopular(categoryId: string, siteId: string, limit: number = 5): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts by category ID: ${categoryId} for site ID: ${siteId}, limit: ${limit}, excluding popular`);
    
    if (!categoryId || !siteId) {
      console.error('Category ID and site ID are required to fetch blog posts by category');
      return [];
    }
    
    // Get all published blog posts and filter manually
    const allPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }]
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published blog posts`);
    
    // Filter for posts in this category and site, excluding popular posts
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const categoriesField = post.fields.Categories;
      const popularField = post.fields.Popular;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const catId = typeof c === 'string' ? c : c.id;
        return catId === categoryId;
      }) : false;
      const isNotPopular = popularField !== true; // Exclude popular posts
      
      return siteMatches && categoryMatches && isNotPopular;
    });
    
    console.log(`Found ${filteredPosts.length} non-popular posts for category ID: ${categoryId} and site ID: ${siteId}`);
    
    // Apply limit
    const limitedPosts = filteredPosts.slice(0, limit);
    
    console.log(`Returning ${limitedPosts.length} posts for category`);
    
    return limitedPosts.map(post => post.fields as unknown as BlogPost);
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    throw new AirtableError(
      'Failed to fetch blog posts by category',
      TABLES.BLOG_POSTS,
      'getBlogPostsByCategoryExcludingPopular',
      error
    );
  }
}

/**
 * Get blog posts by category ID
 * @param categoryId The Airtable record ID of the category
 * @param siteId The ID of the site
 * @param limit Maximum number of posts to fetch (default: 6)
 * @returns Array of BlogPost objects
 */
export async function getBlogPostsByCategory(categoryId: string, siteId: string, limit: number = 6): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts by category ID: ${categoryId} for site ID: ${siteId}, limit: ${limit}`);
    
    if (!categoryId || !siteId) {
      console.error('Category ID and site ID are required to fetch blog posts by category');
      return [];
    }
    
    // Get all published blog posts and filter manually
    const allPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }]
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published blog posts`);
    
    // Filter for posts in this category and site
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const categoriesField = post.fields.Categories;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const catId = typeof c === 'string' ? c : c.id;
        return catId === categoryId;
      }) : false;
      
      return siteMatches && categoryMatches;
    });
    
    console.log(`Found ${filteredPosts.length} posts for category ID: ${categoryId} and site ID: ${siteId}`);
    
    // Apply limit
    const limitedPosts = filteredPosts.slice(0, limit);
    
    console.log(`Returning ${limitedPosts.length} posts for category`);
    
    return limitedPosts.map(post => post.fields as unknown as BlogPost);
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    throw new AirtableError(
      'Failed to fetch blog posts by category',
      TABLES.BLOG_POSTS,
      'getBlogPostsByCategory',
      error
    );
  }
}

/**
 * Get related blog posts by their record IDs, optionally using an Airtable view
 * @param relatedBlogIds Array of Airtable record IDs from the 'Related blogs' field
 * @param siteId The ID of the site (to ensure related blogs are from same site)
 * @param currentPostId The ID of the current post (to exclude it from results)
 * @param limit Maximum number of related posts to fetch (default: 4)
 * @param viewName Optional Airtable view name (pre-filtered view)
 * @returns Array of BlogPost objects that are related
 */
export async function getRelatedBlogPosts(relatedBlogIds: string[], siteId: string, currentPostId?: string, limit: number = 4, viewName?: string): Promise<BlogPost[]> {
  try {
    console.log(`Fetching related blog posts for IDs: ${relatedBlogIds.join(', ')}, site ID: ${siteId}${viewName ? ` using view: ${viewName}` : ''}`);
    
    if (!relatedBlogIds || relatedBlogIds.length === 0) {
      console.log('No related blog IDs provided');
      return [];
    }
    
    if (!siteId) {
      console.error('Site ID is required to fetch related blog posts');
      return [];
    }
    
    let relatedPosts: readonly any[] = [];
    
    if (viewName) {
      // NEW SYSTEM: Use ONLY the Airtable view (which is already filtered for the site)
      // Build filter formula to get specific records within the view
      const idFilters = relatedBlogIds.map(id => `RECORD_ID() = "${id}"`).join(', ');
      const filterFormula = `AND(
        {Published} = TRUE(),
        OR(${idFilters})
      )`;
      
      console.log(`Using Airtable view "${viewName}" with filter formula: ${filterFormula}`);
      
      try {
        relatedPosts = await base(TABLES.BLOG_POSTS)
          .select({
            view: viewName,
            filterByFormula: filterFormula,
            sort: [{ field: 'Published date', direction: 'desc' }]
          })
          .all();
        
        console.log(`✅ Found ${relatedPosts.length} related posts in view "${viewName}"`);
      } catch (viewError) {
        console.error(`Error fetching from view "${viewName}":`, viewError);
        // Fall through to fallback method
      }
    }
    
    // Fallback: If no view or view failed, use filterByFormula
    if (relatedPosts.length === 0) {
      console.log('Using fallback method with filterByFormula...');
      
      // Build filter formula to get specific records
      const idFilters = relatedBlogIds.map(id => `RECORD_ID() = "${id}"`).join(', ');
      const filterFormula = `AND(
        {Published} = TRUE(),
        OR(${idFilters})
      )`;
      
      console.log('Filter formula:', filterFormula);
      
      relatedPosts = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: filterFormula,
          sort: [{ field: 'Published date', direction: 'desc' }]
        })
        .all();
      
      console.log(`Found ${relatedPosts.length} related posts from Airtable`);
    }
    
    // Filter for posts from the same site and exclude current post
    // NOTE: If using a view, the view is already site-specific, so we only need to exclude current post
    const filteredPosts = relatedPosts.filter(post => {
      const recordId = post.id;
      
      // Exclude current post
      const isNotCurrentPost = currentPostId ? recordId !== currentPostId : true;
      
      if (viewName) {
        // When using a view, it's already filtered for the site, so just exclude current post
        return isNotCurrentPost;
      } else {
        // When not using a view, also filter by site
        const siteField = post.fields.Site;
        const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
        return siteMatches && isNotCurrentPost;
      }
    });
    
    console.log(`Found ${filteredPosts.length} related posts${viewName ? ' (view already site-filtered)' : ` for site ID: ${siteId}`}`);
    
    // Apply limit
    const limitedPosts = filteredPosts.slice(0, limit);
    
    console.log(`Returning ${limitedPosts.length} related posts`);
    
    // Map to BlogPost objects with IDs
    return limitedPosts.map(post => ({
      ...(post.fields as unknown as BlogPost),
      id: post.id
    }));
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    throw new AirtableError(
      'Failed to fetch related blog posts',
      TABLES.BLOG_POSTS,
      'getRelatedBlogPosts',
      error
    );
  }
} 