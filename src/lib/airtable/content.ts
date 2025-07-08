import { BlogPost, ListingPost, Page, Business } from '@/types/airtable';
import base, { TABLES, AirtableError } from './config';

/**
 * Get blog posts for a specific site
 * @param siteId The Airtable record ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of BlogPost objects
 */
export async function getBlogPostsBySiteId(siteId: string, limit?: number): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch blog posts');
      return [];
    }
    
    // First try the direct filter approach
    let posts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: `AND(
          {Published} = TRUE(),
          Site = "${siteId}"
        )`,
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    // If no posts found, try manual filtering approach
    if (posts.length === 0) {
      console.log('Direct filter failed, trying manual filtering...');
      
      const allPosts = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${allPosts.length} total published blog posts`);
      
      // Filter manually for the site
      posts = allPosts.filter(post => {
        const siteField = post.fields.Site;
        if (Array.isArray(siteField)) {
          return siteField.includes(siteId);
        }
        return false;
      });
      
      console.log(`Manually filtered to ${posts.length} blog posts for site ID: ${siteId}`);
    }
    
    // Apply limit if specified
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    console.log(`Returning ${posts.length} blog posts for site ID: ${siteId}`);
    
    return posts.map(post => post.fields as unknown as BlogPost);
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
 * Get listing posts for a specific site
 * @param siteId The Airtable record ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of ListingPost objects
 */
export async function getListingPostsBySiteId(siteId: string, limit?: number): Promise<ListingPost[]> {
  try {
    console.log(`Fetching listing posts for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch listing posts');
      return [];
    }
    
    // First try the direct filter approach
    let posts = await base(TABLES.LISTING_POSTS)
      .select({
        filterByFormula: `AND(
          {Published} = TRUE(),
          Site = "${siteId}"
        )`,
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    // If no posts found, try manual filtering approach
    if (posts.length === 0) {
      console.log('Direct filter failed, trying manual filtering...');
      
      const allPosts = await base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
          sort: [{ field: 'Published date', direction: 'desc' }],
        })
        .all();
      
      console.log(`Found ${allPosts.length} total published listing posts`);
      
      // Filter manually for the site
      posts = allPosts.filter(post => {
        const siteField = post.fields.Site;
        if (Array.isArray(siteField)) {
          return siteField.includes(siteId);
        }
        return false;
      });
      
      console.log(`Manually filtered to ${posts.length} listing posts for site ID: ${siteId}`);
    }
    
    // Apply limit if specified
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    console.log(`Returning ${posts.length} listing posts for site ID: ${siteId}`);
    
    return posts.map(post => post.fields as unknown as ListingPost);
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
 * Get homepage content from Pages table
 * @param siteId The Airtable record ID of the site
 * @returns Page object for homepage or null if not found
 */
export async function getHomepageContent(siteId: string): Promise<Page | null> {
  try {
    console.log(`Fetching homepage content for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch homepage content');
      return null;
    }
    
    // First try the direct filter approach
    let pages = await base(TABLES.PAGES)
      .select({
        filterByFormula: `AND(
          {Published} = TRUE(),
          Site = "${siteId}",
          {Page} = "Home"
        )`,
        maxRecords: 1,
      })
      .firstPage();
    
    // If no pages found, try manual filtering approach
    if (pages.length === 0) {
      console.log('Direct filter failed, trying manual filtering...');
      
      const allPages = await base(TABLES.PAGES)
        .select({
          filterByFormula: 'AND({Published} = TRUE(), {Page} = "Home")',
        })
        .all();
      
      console.log(`Found ${allPages.length} total published home pages`);
      
      // Filter manually for the site
      const filteredPages = allPages.filter(page => {
        const siteField = page.fields.Site;
        if (Array.isArray(siteField)) {
          return siteField.includes(siteId);
        }
        return false;
      });
      
      console.log(`Manually filtered to ${filteredPages.length} home pages for site ID: ${siteId}`);
      
      if (filteredPages.length > 0) {
        pages = [filteredPages[0]]; // Take the first one
      }
    }
    
    if (pages.length === 0) {
      console.log(`No homepage found for site ID: ${siteId}`);
      return null;
    }
    
    console.log(`Found homepage for site ID: ${siteId}:`, pages[0].fields.Title);
    return pages[0].fields as unknown as Page;
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
 * Get a single blog post by slug
 * @param slug The slug of the blog post
 * @param siteId The ID of the site
 * @returns Blog post with author and category information
 */
export async function getBlogPostBySlug(slug: string, siteId: string): Promise<BlogPost | null> {
  try {
    console.log(`Fetching blog post with slug: ${slug} for site ID: ${siteId}`);
    
    if (!slug || !siteId) {
      console.error('Slug and site ID are required to fetch blog post');
      return null;
    }
    
    // First try direct filter
    let posts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: `AND({Slug} = "${slug}", {Published} = TRUE())`,
        maxRecords: 1,
      })
      .firstPage();

    // If direct filter fails, try manual filtering
    if (posts.length === 0) {
      console.log('Direct filter failed, trying manual filtering...');
      
      const allPosts = await base(TABLES.BLOG_POSTS)
        .select({
          filterByFormula: '{Published} = TRUE()',
        })
        .all();
      
      console.log(`Found ${allPosts.length} total published blog posts`);
      
      // Filter manually for slug and site
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
      console.log(`No blog post found with slug: ${slug} for site ID: ${siteId}`);
      return null;
    }

    const post = posts[0];
    const blogPost = post.fields as unknown as BlogPost;
    
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
 * Get all authors
 * @returns Array of Author objects
 */
export async function getAllAuthors(): Promise<any[]> {
  try {
    console.log('Fetching all authors');
    
    const authors = await base(TABLES.AUTHORS)
      .select({
      })
      .all();
    
    console.log(`Found ${authors.length} authors`);
    return authors.map(author => author.fields);
  } catch (error) {
    console.warn('Could not fetch authors (may not have permission):', error);
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
 * Get blog page content from Pages table
 * @param siteId The Airtable record ID of the site
 * @returns Page object for blog page or null if not found
 */
export async function getBlogPageContent(siteId: string): Promise<Page | null> {
  try {
    console.log(`Fetching blog page content for site ID: ${siteId}`);
    
    if (!siteId) {
      console.error('Site ID is required to fetch blog page content');
      return null;
    }
    
    // First try the direct filter approach
    let pages = await base(TABLES.PAGES)
      .select({
        filterByFormula: `AND(
          {Published} = TRUE(),
          Site = "${siteId}",
          {Page} = "Blog overview"
        )`,
        maxRecords: 1,
      })
      .firstPage();
    
    // If no pages found, try manual filtering approach
    if (pages.length === 0) {
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
export async function getBlogPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts by category slug: ${categorySlug} for site ID: ${siteId}`);
    
    // First get the category to find its ID
    const category = await getCategoryBySlug(categorySlug);
    if (!category) {
      console.log(`Category not found with slug: ${categorySlug}`);
      return [];
    }
    
    console.log(`Found category:`, { id: category.id, name: category.Name, slug: category.Slug });
    
    // Get all published blog posts and filter manually
    const allPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published blog posts`);
    
    // Filter for posts in this category and site
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const categoriesField = post.fields.Categories;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      
      // Debug category matching
      console.log(`Post ${post.fields.Title}:`, {
        postId: post.id,
        categoriesField: categoriesField,
        categoryId: category.id,
        siteField: siteField,
        siteMatches: siteMatches
      });
      
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const categoryId = typeof c === 'string' ? c : c.id;
        console.log(`Comparing category ID: ${categoryId} with target: ${category.id}`);
        return categoryId === category.id;
      }) : false;
      
      console.log(`Post ${post.fields.Title} matches:`, { siteMatches, categoryMatches });
      
      return siteMatches && categoryMatches;
    });
    
    console.log(`Manually filtered to ${filteredPosts.length} posts for category: ${categorySlug} and site ID: ${siteId}`);
    
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
    
    console.log(`Successfully fetched business: ${business.Competitor}`);
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
    
    // Filter out null results
    const validBusinesses = businesses.filter((business): business is Business => business !== null);
    
    console.log(`Successfully fetched ${validBusinesses.length} out of ${businessIds.length} businesses`);
    return validBusinesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
}

/**
 * Get a single listing post by slug with business details
 * @param slug The slug of the listing post
 * @param siteId The ID of the site
 * @returns Listing post with business information
 */
export async function getListingPostBySlug(slug: string, siteId: string): Promise<ListingPost | null> {
  try {
    console.log(`Fetching listing post with slug: ${slug} for site ID: ${siteId}`);
    
    if (!slug || !siteId) {
      console.error('Slug and site ID are required to fetch listing post');
      return null;
    }
    
    // Get all published listing posts and filter manually
    const allPosts = await base(TABLES.LISTING_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published listing posts`);
    
    // Filter for slug and site
    const filteredPosts = allPosts.filter(post => {
      const postSlug = post.fields.Slug;
      const siteField = post.fields.Site;
      
      const slugMatches = postSlug === slug;
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      
      return slugMatches && siteMatches;
    });
    
    console.log(`Manually filtered to ${filteredPosts.length} posts for slug: ${slug} and site ID: ${siteId}`);
    
    if (filteredPosts.length === 0) {
      console.log(`No listing post found with slug: ${slug} for site ID: ${siteId}`);
      return null;
    }

    const post = filteredPosts[0];
    const listingPost = { ...post.fields, id: post.id } as ListingPost;
    
    // Fetch business details if available
    if (listingPost.Businesses && Array.isArray(listingPost.Businesses) && listingPost.Businesses.length > 0) {
      console.log(`Fetching business details for ${listingPost.Businesses.length} businesses`);
      const businessIds = listingPost.Businesses.map(b => typeof b === 'string' ? b : b.id);
      listingPost.BusinessDetails = await getBusinessesByIds(businessIds);
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
    
    // Fetch category information if available
    if (listingPost.Categories && Array.isArray(listingPost.Categories) && listingPost.Categories.length > 0) {
      try {
        const categoryId = typeof listingPost.Categories[0] === 'string' ? listingPost.Categories[0] : listingPost.Categories[0].id;
        const categoryRecord = await base(TABLES.CATEGORIES).find(categoryId);
        listingPost.CategoryDetails = { ...categoryRecord.fields, id: categoryRecord.id };
        console.log('Successfully fetched category details for listing post');
      } catch (error) {
        console.warn('Could not fetch category details for listing post:', error);
        listingPost.CategoryDetails = { Name: 'General', Slug: 'general' };
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
    
    return posts.map(post => post.fields as unknown as ListingPost);
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
export async function getListingPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number): Promise<ListingPost[]> {
  try {
    console.log(`Fetching listing posts by category slug: ${categorySlug} for site ID: ${siteId}`);
    
    // First get the category to find its ID
    const category = await getCategoryBySlug(categorySlug);
    if (!category) {
      console.log(`Category not found with slug: ${categorySlug}`);
      return [];
    }
    
    console.log(`Found category:`, { id: category.id, name: category.Name, slug: category.Slug });
    
    // Get all published listing posts and filter manually
    const allPosts = await base(TABLES.LISTING_POSTS)
      .select({
        filterByFormula: '{Published} = TRUE()',
        sort: [{ field: 'Published date', direction: 'desc' }],
      })
      .all();
    
    console.log(`Found ${allPosts.length} total published listing posts`);
    
    // Filter for posts in this category and site
    const filteredPosts = allPosts.filter(post => {
      const siteField = post.fields.Site;
      const categoriesField = post.fields.Categories;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      
      const categoryMatches = Array.isArray(categoriesField) ? categoriesField.some(c => {
        const categoryId = typeof c === 'string' ? c : c.id;
        return categoryId === category.id;
      }) : false;
      
      return siteMatches && categoryMatches;
    });
    
    console.log(`Manually filtered to ${filteredPosts.length} listing posts for category: ${categorySlug} and site ID: ${siteId}`);
    
    // Apply limit if specified
    let posts = filteredPosts;
    if (limit && posts.length > limit) {
      posts = posts.slice(0, limit);
    }
    
    return posts.map(post => post.fields as unknown as ListingPost);
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

  return allPosts;
}

/**
 * Get combined blog and listing posts by category slug
 * @param categorySlug The slug of the category
 * @param siteId The ID of the site
 * @param limit Optional limit for number of posts to fetch
 * @returns Array of combined BlogPost and ListingPost objects with type
 */
export async function getCombinedPostsByCategorySlug(categorySlug: string, siteId: string, limit?: number) {
  const [blogPosts, listingPosts] = await Promise.all([
    getBlogPostsByCategorySlug(categorySlug, siteId),
    getListingPostsByCategorySlug(categorySlug, siteId)
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

  return allPosts;
}

/**
 * Get all categories assigned to a specific site
 * @param siteId The ID of the site
 * @returns Array of Category objects assigned to the site
 */
export async function getCategoriesBySiteId(siteId: string): Promise<any[]> {
  try {
    console.log(`Fetching categories assigned to site ID: ${siteId}`);
    
    // Get all categories
    const allCategories = await base(TABLES.CATEGORIES)
      .select({
      })
      .all();
    
    console.log(`Found ${allCategories.length} total categories in Airtable`);
    
    // Filter categories to only those assigned to this site
    const siteCategories = allCategories
      .filter(category => {
        const siteField = category.fields.Site;
        const isAssigned = Array.isArray(siteField) && siteField.includes(siteId);
        console.log(`Category "${category.fields.Name}" (${category.id}): ${isAssigned ? 'ASSIGNED' : 'NOT ASSIGNED'} to site`);
        return isAssigned;
      })
      .map(category => ({ ...category.fields, id: category.id }))
      .sort((a, b) => {
        // Sort by Priority field (1 on top, 2 below, etc.)
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
 * Get related blog posts by their record IDs
 * @param relatedBlogIds Array of Airtable record IDs from the 'Related blogs' field
 * @param siteId The ID of the site (to ensure related blogs are from same site)
 * @param currentPostId The ID of the current post (to exclude it from results)
 * @param limit Maximum number of related posts to fetch (default: 4)
 * @returns Array of BlogPost objects that are related
 */
export async function getRelatedBlogPosts(relatedBlogIds: string[], siteId: string, currentPostId?: string, limit: number = 4): Promise<BlogPost[]> {
  try {
    console.log(`Fetching related blog posts for IDs: ${relatedBlogIds.join(', ')}, site ID: ${siteId}`);
    
    if (!relatedBlogIds || relatedBlogIds.length === 0) {
      console.log('No related blog IDs provided');
      return [];
    }
    
    if (!siteId) {
      console.error('Site ID is required to fetch related blog posts');
      return [];
    }
    
    // Build filter formula to get specific records
    const idFilters = relatedBlogIds.map(id => `RECORD_ID() = "${id}"`).join(', ');
    const filterFormula = `AND(
      {Published} = TRUE(),
      OR(${idFilters})
    )`;
    
    console.log('Filter formula:', filterFormula);
    
    const relatedPosts = await base(TABLES.BLOG_POSTS)
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Published date', direction: 'desc' }]
      })
      .all();
    
    console.log(`Found ${relatedPosts.length} related posts from Airtable`);
    
    // Filter for posts from the same site and exclude current post
    const filteredPosts = relatedPosts.filter(post => {
      const siteField = post.fields.Site;
      const recordId = post.id;
      
      const siteMatches = Array.isArray(siteField) ? siteField.includes(siteId) : false;
      const isNotCurrentPost = currentPostId ? recordId !== currentPostId : true;
      
      return siteMatches && isNotCurrentPost;
    });
    
    console.log(`Found ${filteredPosts.length} related posts for site ID: ${siteId}`);
    
    // Apply limit
    const limitedPosts = filteredPosts.slice(0, limit);
    
    console.log(`Returning ${limitedPosts.length} related posts`);
    
    return limitedPosts.map(post => post.fields as unknown as BlogPost);
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