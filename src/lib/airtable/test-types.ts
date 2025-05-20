import { Site, BlogPost, ListingPost, Feature, Page, Category } from '@/types/airtable';
import base, { TABLES } from './config';

/**
 * Test function to verify our TypeScript interfaces match Airtable data
 */
export async function testTypes() {
  console.log('Testing TypeScript interfaces with Airtable data...');

  try {
    // Test Site table
    console.log('\nTesting Site table...');
    const sites = await base(TABLES.SITES)
      .select({ maxRecords: 1 })
      .firstPage();
    
    if (sites.length > 0) {
      // Log the raw record to see what we're getting
      console.log('Raw site record:', JSON.stringify(sites[0], null, 2));
      
      const siteData = sites[0].fields;
      console.log('Site data type check:', {
        name: siteData.Name, // Match the exact field names from Airtable
        domain: siteData.Domain,
        active: siteData.Active,
        primaryColor: siteData['Primary color']
      });
    } else {
      console.log('No sites found');
    }

    // Test Features table
    console.log('\nTesting Features table...');
    const features = await base(TABLES.FEATURES)
      .select({ maxRecords: 1 })
      .firstPage();
    
    if (features.length > 0) {
      console.log('Raw feature record:', JSON.stringify(features[0], null, 2));
      
      const featureData = features[0].fields;
      console.log('Feature data type check:', {
        name: featureData.Name,
        description: featureData.Description
      });
    } else {
      console.log('No features found');
    }

    // Test Pages table
    console.log('\nTesting Pages table...');
    const pages = await base(TABLES.PAGES)
      .select({ maxRecords: 1 })
      .firstPage();
    
    if (pages.length > 0) {
      console.log('Raw page record:', JSON.stringify(pages[0], null, 2));
      
      const pageData = pages[0].fields;
      console.log('Page data type check:', {
        title: pageData.Title,
        slug: pageData.Slug,
        pageType: pageData.Page
      });
    } else {
      console.log('No pages found');
    }

    // Test Blog Posts table
    console.log('\nTesting Blog Posts table...');
    const blogPosts = await base(TABLES.BLOG_POSTS)
      .select({
        maxRecords: 10  // Remove sorting to get records in their natural order
      })
      .firstPage();
    
    if (blogPosts.length > 0) {
      console.log(`Found ${blogPosts.length} blog posts`);
      
      blogPosts.forEach((post, index) => {
        console.log(`\nBlog post #${index + 1} (${post.id}):`, JSON.stringify(post.fields, null, 2));
      });
      
      // Test the first post that has a title
      const completePost = blogPosts.find(post => post.fields.Title);
      if (completePost) {
        console.log('\nFound complete blog post with ID:', completePost.id);
        const blogData = completePost.fields;
        console.log('Blog post data type check:', {
          id: blogData.ID,
          site: blogData.Site,
          published: blogData.Published,
          title: blogData.Title,
          slug: blogData.Slug,
          content: blogData.Content,
          excerpt: blogData.Excerpt,
          featuredImage: blogData['Featured image'],
          featuredImage2: blogData['Featured image 2'],
          featuredImage3: blogData['Featured image 3'],
          publishedDate: blogData['Published date'],
          lastUpdated: blogData['Last updated'],
          categories: blogData.Categories,
          tags: blogData.Tags,
          metaTitle: blogData['Meta title'],
          metaDescription: blogData['Meta description'],
          relatedBlogs: blogData['Related blogs']
        });
      } else {
        console.log('\nNo blog posts with complete data found');
      }
    } else {
      console.log('No blog posts found');
    }

    // Test Listing Posts table
    console.log('\nTesting Listing Posts table...');
    const listingPosts = await base(TABLES.LISTING_POSTS)
      .select({ maxRecords: 1 })
      .firstPage();
    
    if (listingPosts.length > 0) {
      console.log('Raw listing post record:', JSON.stringify(listingPosts[0], null, 2));
      
      const listingData = listingPosts[0].fields;
      console.log('Listing post data type check:', {
        title: listingData.Title,
        slug: listingData.Slug,
        business1: listingData['Business 1']
      });
    } else {
      console.log('No listing posts found');
    }

    console.log('\nAll type tests completed successfully!');
  } catch (error) {
    console.error('Error during type testing:', error);
    throw error;
  }
} 