import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-detection';
import { getBlogPostBySlug, getListingPostBySlug, getRelatedBlogPosts, getHomepageContent, getBlogPostsBySiteId } from '@/lib/airtable/content';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { parseMarkdownToHtml } from '@/lib/utils/markdown';
import { 
  getBlogContent, 
  renderStructuredHTML, 
  getContentForReadingTime,
  getBlogTitle,
  getBlogExcerpt 
} from '@/lib/utils/structured-content';
import { generateBlogPostSchemas, generateListingPostSchemas } from '@/lib/utils/schema';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { 
  CurrencyEuroIcon, 
  LinkIcon, 
  UserIcon, 
  GlobeAltIcon, 
  CalendarDaysIcon, 
  UserGroupIcon,
  MapPinIcon,
  MapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import TableOfContents from '@/components/blog/TableOfContents';
import PrivateEventForm from '@/components/ui/PrivateEventForm';
import LazyRelatedBlogs from '@/components/blog/LazyRelatedBlogs';
import Link from 'next/link';
import { BlogPost, ListingPost } from '@/types/airtable';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Enable ISR with 12-hour revalidation (content changes ~2x/week)
// This dramatically reduces API calls by caching pages at the Next.js level
export const revalidate = 12 * 60 * 60; // 12 hours in seconds

type PostData = {
  post: BlogPost | ListingPost;
  type: 'blog' | 'listing';
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    if (!site?.id) {
      return { title: 'Post Not Found' };
    }

    // Try to get either blog post or listing post using views if available
    const blogPost = await getBlogPostBySlug(params.slug, site.id, siteConfig?.airtableViews?.blogPosts);
    const listingPost = !blogPost ? await getListingPostBySlug(params.slug, site.id, siteConfig?.airtableViews?.listingPosts) : null;
    const post = blogPost || listingPost;
    
    if (!post) {
      return { title: 'Post Not Found' };
    }

    // Use enhanced utility functions for metadata
    const displayTitle = blogPost ? getBlogTitle(blogPost) : (post['Meta title'] || (post as any).Title || 'Untitled');
    const displayDescription = blogPost ? getBlogExcerpt(blogPost) : (post['Meta description'] || (post as any).Excerpt || '');

    // Generate schema markup based on post type
    let schemas = [];
    try {
      if (blogPost) {
        const breadcrumbItems = [
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          ...(post.CategoryDetails ? [{ 
            label: post.CategoryDetails.Name, 
            href: `/blog/category/${post.CategoryDetails.Slug}` 
          }] : []),
          { label: displayTitle }
        ];
        schemas = generateBlogPostSchemas(blogPost, site, post.AuthorDetails, breadcrumbItems) || [];
      } else if (listingPost) {
        // Helper function to truncate title for breadcrumb (mobile-friendly)
        const truncateBreadcrumbTitle = (title: string, maxLength: number = 25): string => {
          if (title.length <= maxLength) return title;
          // Find the last space before maxLength to avoid cutting words
          const truncated = title.substring(0, maxLength);
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > 0) {
            return title.substring(0, lastSpace) + '...';
          }
          return truncated + '...';
        };
        
        const breadcrumbItems = [
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { 
            label: truncateBreadcrumbTitle(displayTitle), // Truncated for mobile
            fullLabel: displayTitle // Full title for desktop and SEO
          }
        ];
        schemas = generateListingPostSchemas(listingPost, site, breadcrumbItems) || [];
      }
    } catch (error) {
      console.error('Error generating schemas:', error);
      schemas = [];
    }

    return {
      title: displayTitle,
      description: displayDescription,
      openGraph: {
        title: displayTitle,
        description: displayDescription,
        images: post['Featured image']?.[0]?.url ? [post['Featured image'][0].url] : [],
        type: 'article',
        publishedTime: post['Published date'],
        authors: post.AuthorDetails?.Name ? [post.AuthorDetails.Name] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: displayTitle,
        description: displayDescription,
        images: post['Featured image']?.[0]?.url ? [post['Featured image'][0].url] : [],
      },
      other: {
        // Add JSON-LD schema markup
        ...schemas.reduce((acc, schema, index) => {
          acc[`json-ld-${index}`] = JSON.stringify(schema);
          return acc;
        }, {} as Record<string, string>)
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: 'Post' };
  }
}

async function getPostData(slug: string, siteId: string, blogPostsViewName?: string, listingPostsViewName?: string): Promise<PostData | null> {
  // Try blog post first
  const blogPost = await getBlogPostBySlug(slug, siteId, blogPostsViewName);
  if (blogPost) {
    return { post: blogPost, type: 'blog' };
  }
  
  // If not found, try listing post
  const listingPost = await getListingPostBySlug(slug, siteId, listingPostsViewName);
  if (listingPost) {
    return { post: listingPost, type: 'listing' };
  }
  
  return null;
}

/**
 * Check if a post has a redirect and return the redirect URL
 * @param post BlogPost or ListingPost
 * @returns Redirect URL or null if no redirect
 */
function getRedirectUrl(post: BlogPost | ListingPost): string | null {
  // Check if redirect status is set to "Redirect"
  if (post['Redirect status'] && post['Redirect status'].toLowerCase().includes('redirect')) {
    const redirectTo = post['Redirect to'];
    if (redirectTo && redirectTo.trim().length > 0) {
      return redirectTo.trim();
    }
  }
  return null;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // SINGLE site detection call - uses cache if already called in layout
    const siteConfig = await getSiteConfig(host);
    if (!siteConfig?.site?.id) {
      redirect('/');
    }

    const { site, siteId, features, airtableViews } = siteConfig;

    // Check if Blog feature is enabled
    const blogFeature = features.find(f => f.Name === 'Blog');
    if (!blogFeature) {
      redirect('/');
    }

    // Get post data (either blog or listing) using views if available
    const postData = await getPostData(params.slug, siteId, airtableViews?.blogPosts, airtableViews?.listingPosts);
    if (!postData) {
      console.log(`❌ No post found with slug: ${params.slug} for site ID: ${siteId}`);
      notFound();
    }

    const { post, type } = postData;

    // Debug: Log redirect fields and published status
    console.log(`📋 Post found: ${post.Slug || 'unknown'}`);
    console.log(`   Published: ${post.Published || false}`);
    console.log(`   Redirect status: ${post['Redirect status'] || 'not set'}`);
    console.log(`   Redirect to: ${post['Redirect to'] || 'not set'}`);

    // Check for redirect FIRST (even if unpublished)
    const redirectUrl = getRedirectUrl(post);
    if (redirectUrl) {
      console.log(`🔄 Redirecting from /blog/${params.slug} to: ${redirectUrl}`);
      
      // Check if it's an absolute URL (starts with http:// or https://)
      if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
        // External redirect - use Next.js redirect
        redirect(redirectUrl);
      } else {
        // Internal redirect - could be a slug or a path
        // If it's just a slug (no slashes), assume it's a blog post slug
        if (!redirectUrl.startsWith('/')) {
          redirect(`/blog/${redirectUrl}`);
        } else {
          // It's already a path (e.g., /blog/some-slug or /some-page)
          redirect(redirectUrl);
        }
      }
    }
    
    // If no redirect, check if post is published
    // If unpublished and no redirect, show 404
    if (!post.Published) {
      console.log(`❌ Post is unpublished and has no redirect configured. Showing 404.`);
      notFound();
    }
    
    console.log(`✅ Post is published and has no redirect. Rendering post.`);

    // Check if Private event form feature is enabled
    const privateEventFeature = features.find(f => f.Name === 'Private event form');
    const showPrivateEventForm = !!privateEventFeature;

    // Format publish date
    const publishDate = post['Published date'] 
      ? new Date(post['Published date']).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    if (type === 'blog') {
      const blogPost = post as BlogPost;
      
      // Use enhanced utility functions for structured content
      const displayTitle = getBlogTitle(blogPost);
      const displayExcerpt = getBlogExcerpt(blogPost);

      // Build breadcrumbs for blog posts using display title
      const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        ...(post.CategoryDetails ? [{ 
          label: post.CategoryDetails.Name, 
          href: `/blog/category/${post.CategoryDetails.Slug}` 
        }] : []),
        { label: displayTitle }
      ];
      
      // Calculate reading time using enhanced content extraction
      const contentForReadingTime = getContentForReadingTime(blogPost);
      const readingTime = calculateReadingTime(contentForReadingTime);
      
      // Render structured HTML content with backward compatibility
      let htmlContent = '';
      try {
        htmlContent = renderStructuredHTML(blogPost);
      } catch (error) {
        console.error('Error rendering structured HTML:', error);
        htmlContent = '<p>Error loading content. Please try again later.</p>';
      }
      
      // Check if we have structured content to insert form after Text2.2
      const sections = blogPost['H2.1'] && blogPost['Text2.1'] ? true : false;

      // Fetch related blog posts if they exist, otherwise get random blogs
      let relatedBlogs: BlogPost[] = [];
      
      console.log(`Checking for related blogs. Blog post ID: ${blogPost.id}`);
      console.log(`Related blogs field:`, blogPost['Related blogs']);
      
      if (blogPost['Related blogs'] && Array.isArray(blogPost['Related blogs']) && blogPost['Related blogs'].length > 0) {
        try {
          const relatedBlogIds = blogPost['Related blogs'].map(link => 
            typeof link === 'string' ? link : link.id
          );
          console.log(`Fetching ${relatedBlogIds.length} related blogs with IDs:`, relatedBlogIds);
          relatedBlogs = await getRelatedBlogPosts(relatedBlogIds, siteId, blogPost.id, 4, airtableViews?.blogPosts);
          console.log(`✅ Fetched ${relatedBlogs.length} related blog posts from "Related blogs" field`);
        } catch (error) {
          console.error('Error fetching related blogs:', error);
        }
      } else {
        console.log('No "Related blogs" field found or it is empty');
      }
      
      // If no related blogs found, get 3 random blog posts (excluding current post)
      if (relatedBlogs.length === 0) {
        try {
          console.log(`No related blogs found, fetching random blogs. Current post ID: ${blogPost.id}`);
          const allBlogPosts = await getBlogPostsBySiteId(siteId, 20, airtableViews?.blogPosts);
          console.log(`Fetched ${allBlogPosts.length} total blog posts`);
          
          if (allBlogPosts.length === 0) {
            console.warn('No blog posts found at all for this site');
          } else {
            // Filter out current post and shuffle
            const otherPosts = allBlogPosts
              .filter(p => {
                const matches = p.id !== blogPost.id;
                if (!matches) {
                  console.log(`Filtering out current post: ${p.id} === ${blogPost.id}`);
                }
                return matches;
              });
            
            console.log(`After filtering current post: ${otherPosts.length} posts remaining`);
            
            // Shuffle and take 3
            const shuffled = otherPosts.sort(() => Math.random() - 0.5);
            relatedBlogs = shuffled.slice(0, 3);
            
            console.log(`✅ Found ${relatedBlogs.length} random blog posts to display`);
          }
        } catch (error) {
          console.error('Error fetching random blogs:', error);
        }
      }
      
      console.log(`Final relatedBlogs count: ${relatedBlogs.length}`);

      // Fetch homepage content for private event form props using views if available
      let homePage = null;
      try {
        homePage = await getHomepageContent(siteId, airtableViews?.pages);
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      }

      return (
        <article className="site-container py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Hero Section */}
              <header className="mb-8">
                {/* Title */}
                <h1 
                  className="text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {displayTitle}
                </h1>

                {/* Meta Information */}
                <div 
                  className="flex flex-wrap items-center gap-4 text-sm mb-6"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)',
                    opacity: 0.7
                  }}
                >
                  {(blogPost.AuthorDetails?.Name || blogPost.Author) && (
                    <div className="flex items-center">
                      <span>By </span>
                      {blogPost.AuthorDetails?.Slug ? (
                        <Link 
                          href={`/blog/author/${blogPost.AuthorDetails.Slug}`}
                          className="text-[var(--text-color)] hover:underline font-medium ml-1"
                        >
                          {blogPost.AuthorDetails.Name}
                        </Link>
                      ) : (
                        <span className="ml-1">{blogPost.AuthorDetails?.Name || 'Author'}</span>
                      )}
                    </div>
                  )}
                  {publishDate && (
                    <div>{publishDate}</div>
                  )}
                  <div>{formatReadingTime(readingTime)}</div>
                </div>

                {/* Featured Image */}
                {blogPost['Featured image']?.[0] && (
                  <div className="mb-8 relative">
                    <Image
                      src={blogPost['Featured image'][0].url}
                      alt={blogPost['Featured image alt text'] || displayTitle}
                      width={blogPost['Featured image'][0].width}
                      height={blogPost['Featured image'][0].height}
                      className="w-full h-auto rounded-lg shadow-lg"
                      priority
                    />
                    {/* Category Badge on Image */}
                    {blogPost.CategoryDetails && (
                      <div className="absolute top-4 left-4">
                        <span 
                          className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                          style={{ 
                            backgroundColor: 'var(--accent-color)',
                            color: 'var(--text-color)'
                          }}
                        >
                          {blogPost.CategoryDetails.Name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Table of Contents - Collapsible under image */}
                <div className="lg:hidden mb-8">
                  <TableOfContents content={htmlContent} collapsible />
                </div>

                {/* Excerpt */}
                {displayExcerpt && (
                                  <div 
                  className="text-xl leading-relaxed mb-8 border-l-4 pl-6"
                  style={{ 
                    color: 'var(--text-color)',
                    borderColor: 'var(--text-color)',
                    fontFamily: 'var(--font-body)',
                    opacity: 0.8
                  }}
                >
                  {displayExcerpt}
                </div>
                )}
              </header>

              {/* Blog Content with Inline Form */}
              {sections && blogPost['Text2.2'] && showPrivateEventForm ? (
                <>
                  {/* Content before Text2.2 */}
                  <div 
                    data-blog-content
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[var(--border-color)] prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let content = '';
                        // Add introduction if available
                        if (blogPost.Introduction) {
                          try {
                            const introContent = typeof blogPost.Introduction === 'string' ? parseMarkdownToHtml(blogPost.Introduction) : '';
                            content += introContent + '\n\n';
                          } catch (error) {
                            console.error('Error parsing introduction:', error);
                          }
                        }
                        // Add first two sections (up to Text2.2)
                        for (let i = 1; i <= 2; i++) {
                          const headingKey = `H2.${i}` as keyof BlogPost;
                          const textKey = `Text2.${i}` as keyof BlogPost;
                          const heading = blogPost[headingKey] as string;
                          const content_text = blogPost[textKey] as string;
                          
                          if (heading && content_text) {
                            try {
                              // Create slug-based ID for heading
                              const headingId = heading
                                .toLowerCase()
                                .trim()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')
                                .replace(/^-|-$/g, '') || `section-${i}`;
                              const parsedContent = typeof content_text === 'string' ? parseMarkdownToHtml(content_text) : '';
                              content += `<h2 id="${headingId}">${heading}</h2>\n${parsedContent}\n\n`;
                            } catch (error) {
                              console.error(`Error parsing content for section ${i}:`, error);
                            }
                          }
                        }
                        return content;
                      })()
                    }}
                  />

                  {/* Private Event Form after Text2.2 */}
                  <div className="my-12">
                    <PrivateEventForm 
                      title={homePage?.['Private event form - Title']}
                      subtitle={homePage?.['Private event form - Subtitle']}
                      successMessage={homePage?.['Private event form - Success message']}
                      language={site?.Language?.toLowerCase() || 'en'}
                    />
                  </div>

                  {/* Remaining content after Text2.2 */}
                  <div 
                    data-blog-content
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[var(--border-color)] prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let content = '';
                        // Add sections 3 and 4 if they exist
                        for (let i = 3; i <= 4; i++) {
                          const headingKey = `H2.${i}` as keyof BlogPost;
                          const textKey = `Text2.${i}` as keyof BlogPost;
                          const heading = blogPost[headingKey] as string;
                          const content_text = blogPost[textKey] as string;
                          
                          if (heading && content_text) {
                            try {
                              // Create slug-based ID for heading
                              const headingId = heading
                                .toLowerCase()
                                .trim()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')
                                .replace(/^-|-$/g, '') || `section-${i}`;
                              const parsedContent = typeof content_text === 'string' ? parseMarkdownToHtml(content_text) : '';
                              content += `<h2 id="${headingId}">${heading}</h2>\n${parsedContent}\n\n`;
                            } catch (error) {
                              console.error(`Error parsing content for section ${i}:`, error);
                            }
                          }
                        }
                        // Add conclusion if available
                        if (blogPost.Conclusion) {
                          try {
                            const conclusionContent = typeof blogPost.Conclusion === 'string' ? parseMarkdownToHtml(blogPost.Conclusion) : '';
                            content += `<h2 id="conclusion">Conclusion</h2>\n${conclusionContent}\n\n`;
                          } catch (error) {
                            console.error('Error parsing conclusion:', error);
                          }
                        }
                        return content;
                      })()
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Standard content rendering */}
              <div 
                data-blog-content
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[var(--border-color)] prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

                  {/* Private Event Form in Content - Halfway through article (fallback) */}
                  {showPrivateEventForm && (
                    <div className="my-12">
                      <PrivateEventForm 
                        title={homePage?.['Private event form - Title']}
                        subtitle={homePage?.['Private event form - Subtitle']}
                        successMessage={homePage?.['Private event form - Success message']}
                        language={site?.Language?.toLowerCase() || 'en'}
                      />
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:col-span-4 mt-12 lg:mt-0">
              <div className="lg:sticky lg:top-8 space-y-6">
                {/* Table of Contents */}
                <TableOfContents content={htmlContent} />

                {/* Private Event Form Button in Sidebar */}
                {showPrivateEventForm && (
                  <div className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--border-color)' }}>
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {homePage?.['Private event form - Title'] || 'Book a Private Event'}
                    </h3>
                    <p 
                      className="mb-4"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-body)',
                        opacity: 0.8
                      }}
                    >
                      {homePage?.['Private event form - Subtitle'] || 'Ready to plan your special occasion? Get in touch with us to discuss your private event needs.'}
                    </p>
                    <Link 
                      href="/private-event-form"
                      className="btn-secondary w-full justify-center"
                    >
                      Book private event
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Bottom Private Event Form - Full Width */}
          {showPrivateEventForm && (
            <div className="mt-16">
              <PrivateEventForm 
                title={homePage?.['Private event form - Title']}
                subtitle={homePage?.['Private event form - Subtitle']}
                successMessage={homePage?.['Private event form - Success message']}
                language={site?.Language?.toLowerCase() || 'en'}
              />
            </div>
          )}

          {/* Related Blogs Section - Lazy Loaded */}
          {relatedBlogs && relatedBlogs.length > 0 ? (
            <LazyRelatedBlogs relatedBlogs={relatedBlogs} />
          ) : (
            <div className="mt-16">
              <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>
                No related blogs available. (Debug: relatedBlogs length = {relatedBlogs?.length || 0})
              </p>
            </div>
          )}
        </article>
      );
    } else {
      // Listing post layout
      const listingPost = post as ListingPost;
      
      // Helper function to extract value from GeneratedContent fields
      const getContentValue = (content: string | { state?: string; value?: string; isStale?: boolean } | undefined): string => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        return content.value || '';
      };
      
      // Fetch homepage content for private event form props using views if available
      let homePage = null;
      try {
        homePage = await getHomepageContent(siteId, airtableViews?.pages);
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      }

      // Helper function to truncate title for breadcrumb (mobile-friendly)
      const truncateBreadcrumbTitle = (title: string, maxLength: number = 25): string => {
        if (title.length <= maxLength) return title;
        // Find the last space before maxLength to avoid cutting words
        const truncated = title.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
          return title.substring(0, lastSpace) + '...';
        }
        return truncated + '...';
      };

      // Build breadcrumbs for listing posts using Title field
      // Use fullLabel for desktop/SEO, label for mobile display
      const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        ...(post.CategoryDetails ? [{ 
          label: post.CategoryDetails.Name, 
          href: `/blog/category/${post.CategoryDetails.Slug}` 
        }] : []),
        { 
          label: truncateBreadcrumbTitle(listingPost.Title), // Truncated for mobile
          fullLabel: listingPost.Title // Full title for desktop and SEO
        }
      ];
      
      // Get featured image or fallback to first business image
      const featuredImage = listingPost['Featured image']?.[0] 
        || listingPost['Image (from Business) (from Businesses)']?.[0];

      return (
        <article className="site-container py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Hero Section */}
              <header className="mb-8">
                {/* Category Tags - Show all categories */}
                {listingPost.AllCategoryDetails && listingPost.AllCategoryDetails.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {listingPost.AllCategoryDetails.map((category: any, index: number) => (
                    <Link
                        key={category.id || index}
                        href={`/blog/category/${category.Slug}`}
                      className="inline-block px-3 py-1 text-sm font-medium rounded-full transition-opacity hover:opacity-80"
                      style={{ 
                        backgroundColor: 'var(--accent-color)',
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                        {category.Name}
                    </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 
                  className="text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {listingPost.Title}
                </h1>

                {/* Meta Information */}
                <div 
                  className="flex flex-wrap items-center gap-4 text-sm mb-6"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {(listingPost.AuthorDetails?.Name || listingPost.Author) && (
                    <div className="flex items-center">
                      <span>By </span>
                      {listingPost.AuthorDetails?.Slug ? (
                        <Link 
                          href={`/blog/author/${listingPost.AuthorDetails.Slug}`}
                          className="text-[var(--text-color)] hover:underline font-medium ml-1"
                          style={{ 
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          {listingPost.AuthorDetails.Name}
                        </Link>
                      ) : (
                        <span className="ml-1">{listingPost.AuthorDetails?.Name || 'Author'}</span>
                      )}
                    </div>
                  )}
                  {publishDate && (
                    <div>{publishDate}</div>
                  )}
                </div>

                {/* Featured Image - use Featured image or fallback to first business image */}
                {featuredImage && (
                  <div className="mb-8 relative">
                    <Image
                      src={featuredImage.url}
                      alt={listingPost['Featured image alt text'] || listingPost.Title}
                      width={featuredImage.width}
                      height={featuredImage.height}
                      className="w-full h-auto rounded-lg shadow-lg"
                      priority
                    />
                    {/* Category Badge on Image */}
                    {listingPost.CategoryDetails && (
                      <div className="absolute top-4 left-4">
                        <span 
                          className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                          style={{ 
                            backgroundColor: 'var(--accent-color)',
                            color: 'var(--text-color)'
                          }}
                        >
                          {listingPost.CategoryDetails.Name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Excerpt */}
                {listingPost.Excerpt && (
                  <div 
                    className="text-xl leading-relaxed mb-8 border-l-4 pl-6"
                    style={{ 
                      color: 'var(--text-color)',
                      borderColor: 'var(--text-color)',
                      fontFamily: 'var(--font-body)',
                      opacity: 0.8
                    }}
                  >
                    {listingPost.Excerpt}
                  </div>
                )}

                {/* Mobile Table of Contents - Collapsible */}
                {(() => {
                  // Build TOC items from Header 1-5
                  const tocItems: Array<{ id: string; text: string }> = [];
                  for (let i = 1; i <= 5; i++) {
                    const header = listingPost[`Header ${i}` as keyof ListingPost] as string | undefined;
                    if (header) {
                      const id = `listicle-item-${i}`;
                      tocItems.push({ id, text: header });
                    }
                  }
                  
                  if (tocItems.length === 0) return null;
                  
                  // Create HTML content string for TableOfContents component
                  // Wrap in data-blog-content div so TOC can find the headings
                  const tocContent = `<div data-blog-content>${tocItems.map(({ id, text }) => `<h2 id="${id}">${text}</h2>`).join('')}</div>`;
                  
                  return (
                    <div className="lg:hidden mb-8">
                      <TableOfContents content={tocContent} collapsible />
                    </div>
                  );
                })()}
              </header>

              {/* Listicle Items - Using Header 1-5 and Listicle paragraph 1-5 */}
                <section className="mb-12">
                {[1, 2, 3, 4, 5].map((index) => {
                  const header = listingPost[`Header ${index}` as keyof ListingPost] as string | undefined;
                  const paragraph = listingPost[`Listicle paragraph ${index}` as keyof ListingPost] as string | { state?: string; value?: string; isStale?: boolean } | undefined;
                  const businessImage = listingPost['Image (from Business) (from Businesses)']?.[index - 1]; // 0-indexed array
                  const business = listingPost.BusinessDetails?.[index - 1]; // Get corresponding business for additional info
                  const location = listingPost.LocationDetails?.[index - 1]; // Get corresponding location for additional info
                  
                  // Skip if both header and paragraph are empty
                  const paragraphText = getContentValue(paragraph);
                  if (!header && !paragraphText) return null;
                  
                  // Get location data from lookup fields (if available)
                  const addresses = listingPost['Address (from Location) (from Businesses)'] || [];
                  const googleMapsLinks = listingPost['Google maps link (from Location) (from Businesses)'] || [];
                  const cityWebsitePages = listingPost['City website page (from Location) (from Businesses)'] || [];
                  const address = addresses[index - 1];
                  const googleMapsLink = googleMapsLinks[index - 1];
                  const cityWebsitePage = cityWebsitePages[index - 1];
                  
                  // Get business lookup fields
                  const groupSizes = listingPost['Group size (maximum) (from Business)'] || [];
                  const artInstructors = listingPost['Art instructor (from Business)'] || [];
                  const languages = listingPost['Language  (from Business)'] || [];
                  const privateEvents = listingPost['Private event possible? (from Business)'] || [];
                  const groupSize = groupSizes[index - 1];
                  const artInstructor = artInstructors[index - 1];
                  const language = languages[index - 1];
                  const privateEvent = privateEvents[index - 1];
                  
                  return (
                    <div key={`listicle-item-${index}`} id={`listicle-item-${index}`} className="mb-12 scroll-mt-24">
                      {/* Title - wrapped in data-blog-content for TOC tracking */}
                      <div data-blog-content>
                        {header && (
                          <h2 
                            id={`listicle-item-${index}`}
                            className="text-3xl font-bold mb-6 scroll-mt-24"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                            {index}. {header}
                  </h2>
                        )}
                      </div>
                      
                      {/* Business Image */}
                      {businessImage && (
                        <div className="mb-6">
                          <Image
                            src={businessImage.url}
                            alt={header || `Business ${index}`}
                            width={businessImage.width || 800}
                            height={businessImage.height || 600}
                            className="w-full h-auto rounded-lg shadow-md"
                            loading="lazy"
                            quality={85}
                          />
                        </div>
                      )}
                      
                      {/* Paragraph Content */}
                      {paragraphText && (
                        <div 
                          className="prose prose-lg max-w-none mb-6"
                          style={{ 
                            color: 'var(--text-color)',
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          <p className="text-lg leading-relaxed whitespace-pre-line">
                            {paragraphText}
                          </p>
                        </div>
                      )}
                      
                      {/* Business Information Overview with Icons - Using Location data or Business lookup fields */}
                      {(location || groupSize || artInstructor || language || privateEvent) && (
                        <div 
                          className="mt-6 p-6 rounded-lg"
                          style={{ 
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--card-text)'
                          }}
                        >
                          <div className="space-y-3">
                            {/* Price - from Location */}
                            {location?.Price && (
                              <div className="flex items-center gap-3">
                                <CurrencyEuroIcon 
                                  className="h-5 w-5 flex-shrink-0" 
                                  style={{ color: 'var(--primary-color)' }}
                                />
                                <span 
                                  className="text-base"
                                  style={{ color: 'var(--text-color)' }}
                                >
                                  <span className="font-semibold">€{location.Price}</span>
                                </span>
                              </div>
                            )}
                            
                            {/* Website - from Location */}
                            {location?.Website && (
                              <div className="flex items-center gap-3">
                                <LinkIcon 
                                  className="h-5 w-5 flex-shrink-0" 
                                  style={{ color: 'var(--primary-color)' }}
                                />
                                <Link
                                  href={location.Website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-medium hover:underline"
                                  style={{ color: 'var(--primary-color)' }}
                                >
                                  {location.Website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </Link>
                              </div>
                            )}
                            
                            {/* Art Instructor - from Location lookup field (from Business) */}
                            {(() => {
                              const artInstructorValue = location?.['Art instructor'] || location?.['Art instructor (from Business)']?.[0] || artInstructor;
                              if (!artInstructorValue) return null;
                              return (
                                <div className="flex items-center gap-3">
                                  <UserIcon 
                                    className="h-5 w-5 flex-shrink-0" 
                                    style={{ color: 'var(--primary-color)' }}
                                  />
                                  <span 
                                    className="text-base"
                                    style={{ color: 'var(--text-color)' }}
                                  >
                                    Art instructor: {artInstructorValue}
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Language - from Location lookup field (from Business) */}
                            {(() => {
                              const langValue = location?.['Language '] || location?.['Language  (from Business)']?.[0] || language;
                              if (!langValue || (Array.isArray(langValue) && langValue.length === 0)) return null;
                              return (
                                <div className="flex items-center gap-3">
                                  <GlobeAltIcon 
                                    className="h-5 w-5 flex-shrink-0" 
                                    style={{ color: 'var(--primary-color)' }}
                                  />
                                  <span 
                                    className="text-base"
                                    style={{ color: 'var(--text-color)' }}
                                  >
                                    {Array.isArray(langValue) ? langValue.join(', ') : langValue}
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Private Event Possible - from Location lookup field (from Business) */}
                            {(() => {
                              const privateEventValue = location?.['Private event possible?'] || location?.['Private event possible? (from Business)']?.[0] || privateEvent;
                              if (!privateEventValue) return null;
                              return (
                                <div className="flex items-center gap-3">
                                  <CalendarDaysIcon 
                                    className="h-5 w-5 flex-shrink-0" 
                                    style={{ color: 'var(--primary-color)' }}
                                  />
                                  <span 
                                    className="text-base"
                                    style={{ color: 'var(--text-color)' }}
                                  >
                                    Private event: {privateEventValue}
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Max Group Size - from Location lookup field (from Business) */}
                            {(() => {
                              const groupSizeValue = location?.['Group size (maximum)'] || location?.['Group size (maximum) (from Business)']?.[0] || groupSize;
                              if (!groupSizeValue) return null;
                              return (
                                <div className="flex items-center gap-3">
                                  <UserGroupIcon 
                                    className="h-5 w-5 flex-shrink-0" 
                                    style={{ color: 'var(--primary-color)' }}
                                  />
                                  <span 
                                    className="text-base"
                                    style={{ color: 'var(--text-color)' }}
                                  >
                                    Max {groupSizeValue} people
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Address - from Location */}
                            {location?.Address && (
                              <div className="flex items-center gap-3">
                                <MapPinIcon 
                                  className="h-5 w-5 flex-shrink-0" 
                                  style={{ color: 'var(--primary-color)' }}
                                />
                                <span 
                                  className="text-base"
                                  style={{ color: 'var(--text-color)' }}
                                >
                                  {location.Address}
                                </span>
                              </div>
                            )}
                            
                            {/* Google Maps Link - from Location */}
                            {location?.['Google maps link'] && (
                              <div className="flex items-center gap-3">
                                <MapIcon 
                                  className="h-5 w-5 flex-shrink-0" 
                                  style={{ color: 'var(--primary-color)' }}
                                />
                                <Link
                                  href={location['Google maps link']}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-medium hover:underline"
                                  style={{ color: 'var(--primary-color)' }}
                                >
                                  View on Google Maps
                                </Link>
                              </div>
                            )}
                            
                            {/* City Website Page - from Location */}
                            {location?.['City website page'] && (
                              <div className="flex items-center gap-3">
                                <BuildingOfficeIcon 
                                  className="h-5 w-5 flex-shrink-0" 
                                  style={{ color: 'var(--primary-color)' }}
                                />
                                <Link
                                  href={location['City website page']}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-medium hover:underline"
                                  style={{ color: 'var(--primary-color)' }}
                                >
                                  City Website
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Private Event Form between listicle items */}
                      {showPrivateEventForm && index === 3 && (
                          <div className="my-12 p-6 rounded-lg" style={{ backgroundColor: 'var(--accent-color)' }}>
                            <h3 
                              className="text-xl font-semibold mb-4"
                              style={{ 
                                color: 'var(--text-color)',
                                fontFamily: 'var(--font-heading)'
                              }}
                            >
                              {homePage?.['Private event form - Title'] || 'Interested in a Private Event?'}
                            </h3>
                            <p 
                              className="mb-4"
                              style={{ 
                                color: 'var(--text-color)',
                                fontFamily: 'var(--font-body)',
                                opacity: 0.8
                              }}
                            >
                              {homePage?.['Private event form - Subtitle'] || 'Ready to plan your special occasion? Get in touch with us to discuss your private event needs.'}
                            </p>
                            <Link 
                              href="/private-event-form"
                              className="btn-secondary"
                            >
                              Book private event
                            </Link>
                          </div>
                        )}
                      </div>
                  );
                })}
                </section>

              {/* Conclusion */}
              {getContentValue(listingPost.Conclusion) && (
                <section className="mb-12">
                  <h2 
                    className="text-2xl font-bold mb-6"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    Conclusion
                  </h2>
                  <div 
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-p:leading-relaxed"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {getContentValue(listingPost.Conclusion)}
                    </p>
                  </div>
                </section>
              )}

            </div>

            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:col-span-4 mt-12 lg:mt-0">
              <div className="lg:sticky lg:top-8 space-y-6">
                {/* Table of Contents for Listicle - Desktop Sidebar */}
                {(() => {
                  // Build TOC items from Header 1-5
                  const tocItems: Array<{ id: string; text: string }> = [];
                  for (let i = 1; i <= 5; i++) {
                    const header = listingPost[`Header ${i}` as keyof ListingPost] as string | undefined;
                    if (header) {
                      const id = `listicle-item-${i}`;
                      tocItems.push({ id, text: header });
                    }
                  }
                  
                  if (tocItems.length === 0) return null;
                  
                  // Create HTML content string for TableOfContents component
                  // Wrap in data-blog-content div so TOC can find the headings
                  const tocContent = `<div data-blog-content>${tocItems.map(({ id, text }) => `<h2 id="${id}">${text}</h2>`).join('')}</div>`;
                  
                  return <TableOfContents content={tocContent} />;
                })()}

                {/* Private Event Form Button in Sidebar */}
                {showPrivateEventForm && (
                  <div className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--border-color)' }}>
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {homePage?.['Private event form - Title'] || 'Book a Private Event'}
                    </h3>
                    <p 
                      className="mb-4"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-body)',
                        opacity: 0.8
                      }}
                    >
                      {homePage?.['Private event form - Subtitle'] || 'Ready to plan your special occasion? Get in touch with us to discuss your private event needs.'}
                    </p>
                    <Link 
                      href="/private-event-form"
                      className="btn-secondary w-full justify-center"
                    >
                      Book private event
                    </Link>
                  </div>
                )}

                {/* Business Quick Links */}
                {listingPost.BusinessDetails && listingPost.BusinessDetails.length > 0 && (
                  <div className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--border-color)' }}>
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      Featured Businesses
                    </h3>
                    <div className="space-y-3">
                      {listingPost.BusinessDetails
                        .filter(business => business && business.Competitor) // Filter out invalid businesses
                        .map((business, index) => (
                        <div key={business.id || `business-${index}`} className="flex items-center gap-3">
                          <span 
                            className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                            style={{
                              backgroundColor: 'var(--accent-color)',
                              color: 'var(--text-color)'
                            }}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p 
                              className="font-medium text-sm"
                              style={{ 
                                color: 'var(--text-color)',
                                fontFamily: 'var(--font-body)'
                              }}
                            >
                              {business.Competitor}
                            </p>
                            {business.Price && (
                              <p 
                                className="text-xs"
                                style={{ 
                                  color: 'var(--muted-color)',
                                  fontFamily: 'var(--font-body)'
                                }}
                              >
                                From €{business.Price}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Bottom Private Event Form - Full Width */}
          {showPrivateEventForm && (
            <div className="mt-16 p-8 rounded-lg" style={{ backgroundColor: 'var(--accent-color)' }}>
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Ready to Book Your Private Event?
              </h3>
              <p 
                className="text-lg mb-6 opacity-90"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Contact us to discuss your special occasion and create an unforgettable experience.
              </p>
              <Link 
                href="/private-event-form"
                className="btn-secondary"
              >
                Book private event
              </Link>
            </div>
          )}
        </article>
      );
    }

  } catch (error) {
    // Next.js redirect() throws a special error that we should let propagate
    // Check if it's a redirect error
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // This is a Next.js redirect - rethrow it so Next.js can handle it
        throw error;
      }
    }
    
    console.error('❌ Error loading post:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    // Don't redirect on error - let Next.js handle it with notFound()
    notFound();
  }
} 