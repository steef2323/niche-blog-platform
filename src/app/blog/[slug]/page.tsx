import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Metadata } from 'next';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getBlogPostBySlug, getListingPostBySlug, getRelatedBlogPosts, getHomepageContent } from '@/lib/airtable/content';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { parseMarkdownToHtml } from '@/lib/utils/markdown';
import { 
  getBlogContent, 
  renderStructuredHTML, 
  getContentForReadingTime,
  getBlogTitle,
  getBlogExcerpt 
} from '@/lib/utils/structured-content';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import TableOfContents from '@/components/blog/TableOfContents';
import PrivateEventFormSection from '@/components/homepage/PrivateEventFormSection';
import PrivateEventForm from '@/components/ui/PrivateEventForm';
import BusinessCard from '@/components/blog/BusinessCard';
import Link from 'next/link';
import { BlogPost, ListingPost } from '@/types/airtable';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

type PostData = {
  post: BlogPost | ListingPost;
  type: 'blog' | 'listing';
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      return { title: 'Post Not Found' };
    }

    // Try to get either blog post or listing post
    const blogPost = await getBlogPostBySlug(params.slug, site.id);
    const listingPost = !blogPost ? await getListingPostBySlug(params.slug, site.id) : null;
    const post = blogPost || listingPost;
    
    if (!post) {
      return { title: 'Post Not Found' };
    }

    // Use enhanced utility functions for metadata
    const displayTitle = blogPost ? getBlogTitle(blogPost) : (post['Meta title'] || (post as any).Title || 'Untitled');
    const displayDescription = blogPost ? getBlogExcerpt(blogPost) : (post['Meta description'] || (post as any).Excerpt || '');

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
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: 'Post' };
  }
}

async function getPostData(slug: string, siteId: string): Promise<PostData | null> {
  // Try blog post first
  const blogPost = await getBlogPostBySlug(slug, siteId);
  if (blogPost) {
    return { post: blogPost, type: 'blog' };
  }
  
  // If not found, try listing post
  const listingPost = await getListingPostBySlug(slug, siteId);
  if (listingPost) {
    return { post: listingPost, type: 'listing' };
  }
  
  return null;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // Get site data
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      redirect('/');
    }

    // Check if Blog feature is enabled
    const features = await getFeaturesBySiteId(site.id);
    const blogFeature = features.find(f => f.Name === 'Blog');
    if (!blogFeature) {
      redirect('/');
    }

    // Get post data (either blog or listing)
    const postData = await getPostData(params.slug, site.id);
    if (!postData) {
      notFound();
    }

    const { post, type } = postData;

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
      const htmlContent = renderStructuredHTML(blogPost);
      
      // Check if we have structured content to insert form after Text2.2
      const sections = blogPost['H2.1'] && blogPost['Text2.1'] ? true : false;

      // Fetch related blog posts if they exist
      let relatedBlogs: BlogPost[] = [];
      if (blogPost['Related blogs'] && blogPost['Related blogs'].length > 0) {
        try {
          const relatedBlogIds = blogPost['Related blogs'].map(link => 
            typeof link === 'string' ? link : link.id
          );
          relatedBlogs = await getRelatedBlogPosts(relatedBlogIds, site.id, undefined, 4);
        } catch (error) {
          console.error('Error fetching related blogs:', error);
        }
      }

      // Fetch homepage content for private event form props
      let homePage = null;
      try {
        homePage = await getHomepageContent(site.id);
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      }

      return (
        <article className="site-container py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />

          {/* Mobile Table of Contents - Above article on mobile only */}
          <div className="lg:hidden mb-8">
            <TableOfContents content={htmlContent} />
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Hero Section */}
              <header className="mb-8">
                {/* Category Badge */}
                {blogPost.CategoryDetails && (
                  <div className="mb-4">
                    <span 
                      className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: `var(--accent-color, ${blogPost.CategoryDetails.Color || '#3B82F6'})`,
                        color: 'var(--primary-color)'
                      }}
                    >
                      {blogPost.CategoryDetails.Name}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {displayTitle}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {(blogPost.AuthorDetails?.Name || blogPost.Author) && (
                    <div className="flex items-center">
                      <span>By </span>
                      {blogPost.AuthorDetails?.Slug ? (
                        <Link 
                          href={`/blog/author/${blogPost.AuthorDetails.Slug}`}
                          className="text-[var(--primary-color)] hover:underline font-medium ml-1"
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
                  <div className="mb-8">
                    <Image
                      src={blogPost['Featured image'][0].url}
                      alt={displayTitle}
                      width={blogPost['Featured image'][0].width}
                      height={blogPost['Featured image'][0].height}
                      className="w-full h-auto rounded-lg shadow-lg"
                      priority
                    />
                  </div>
                )}

                {/* Excerpt */}
                {displayExcerpt && (
                  <div className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-[var(--primary-color)] pl-6">
                    {displayExcerpt}
                  </div>
                )}
              </header>

              {/* Blog Content with Inline Form */}
              {sections && blogPost['Text2.2'] && showPrivateEventForm ? (
                <>
                  {/* Content before Text2.2 */}
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--primary-color)] prose-a:no-underline hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let content = '';
                        // Add introduction if available
                        if (blogPost.Introduction) {
                          content += parseMarkdownToHtml(blogPost.Introduction) + '\n\n';
                        }
                        // Add first two sections (up to Text2.2)
                        for (let i = 1; i <= 2; i++) {
                          const headingKey = `H2.${i}` as keyof BlogPost;
                          const textKey = `Text2.${i}` as keyof BlogPost;
                          const heading = blogPost[headingKey] as string;
                          const content_text = blogPost[textKey] as string;
                          
                          if (heading && content_text) {
                            content += `<h2>${heading}</h2>\n${parseMarkdownToHtml(content_text)}\n\n`;
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
                    className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--primary-color)] prose-a:no-underline hover:prose-a:underline"
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
                            content += `<h2>${heading}</h2>\n${parseMarkdownToHtml(content_text)}\n\n`;
                          }
                        }
                        // Add conclusion if available
                        if (blogPost.Conclusion) {
                          content += `<h2>Conclusion</h2>\n${parseMarkdownToHtml(blogPost.Conclusion)}\n\n`;
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
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--primary-color)] prose-a:no-underline hover:prose-a:underline"
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

              {/* Bottom Private Event Form - Hidden on mobile */}
              {showPrivateEventForm && (
                <div className="hidden lg:block mt-16">
                  <PrivateEventForm 
                    title={homePage?.['Private event form - Title']}
                    subtitle={homePage?.['Private event form - Subtitle']}
                    successMessage={homePage?.['Private event form - Success message']}
                    language={site?.Language?.toLowerCase() || 'en'}
                  />
                </div>
              )}

              {/* Related Blogs Section */}
              {relatedBlogs.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Other blogs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {relatedBlogs.map((relatedPost) => {
                      const relatedTitle = getBlogTitle(relatedPost);
                      const relatedExcerpt = getBlogExcerpt(relatedPost);
                      const relatedReadingTime = (() => {
                        const content = getContentForReadingTime(relatedPost);
                        return content ? calculateReadingTime(content) : null;
                      })();
                      const relatedPublishDate = relatedPost['Published date'] 
                        ? new Date(relatedPost['Published date']).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : null;

                      return (
                        <article key={relatedPost.id || relatedPost.Slug} className="group">
                          <Link href={`/blog/${relatedPost.Slug}`} className="block">
                            {/* Featured Image */}
                            <div className="aspect-[4/3] relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                              {relatedPost['Featured image']?.[0] ? (
                                <Image
                                  src={relatedPost['Featured image'][0].url}
                                  alt={relatedTitle}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">No image</span>
                                </div>
                              )}
                              
                              {/* Category Badge */}
                              {relatedPost.CategoryDetails && (
                                <div className="absolute top-4 left-4">
                                  <Link
                                    href={`/blog/category/${relatedPost.CategoryDetails.Slug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-block px-3 py-1 text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                                    style={{ 
                                      backgroundColor: `var(--accent-color, ${relatedPost.CategoryDetails.Color || '#3B82F6'})`,
                                      color: 'var(--primary-color)'
                                    }}
                                  >
                                    {relatedPost.CategoryDetails.Name}
                                  </Link>
                                </div>
                              )}
                            </div>

                            {/* Post Content */}
                            <div>
                              {/* Title */}
                              <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors duration-200">
                                {relatedTitle}
                              </h3>

                              {/* Excerpt */}
                              {relatedExcerpt && (
                                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                  {relatedExcerpt}
                                </p>
                              )}

                              {/* Meta Information */}
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                {relatedPublishDate && <span>{relatedPublishDate}</span>}
                                {relatedReadingTime && (
                                  <>
                                    <span>•</span>
                                    <span>{formatReadingTime(relatedReadingTime)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Link>
                        </article>
                      );
                    })}
                </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 mt-12 lg:mt-0">
              <div className="sticky top-8 space-y-6">
                {/* Table of Contents */}
                <TableOfContents content={htmlContent} />

                {/* Private Event Form in Sidebar */}
                {showPrivateEventForm && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Book a Private Event</h3>
                    <PrivateEventFormSection simplified />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </article>
      );
    } else {
      // Listing post layout
      const listingPost = post as ListingPost;

      // Build breadcrumbs for listing posts using Title field
      const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        ...(post.CategoryDetails ? [{ 
          label: post.CategoryDetails.Name, 
          href: `/blog/category/${post.CategoryDetails.Slug}` 
        }] : []),
        { label: listingPost.Title }
      ];

      return (
        <article className="site-container py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Hero Section */}
              <header className="mb-8">
                {/* Category Badge */}
                {listingPost.CategoryDetails && (
                  <div className="mb-4">
                    <span 
                      className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: `var(--accent-color, ${listingPost.CategoryDetails.Color || '#3B82F6'})`,
                        color: 'var(--primary-color)'
                      }}
                    >
                      {listingPost.CategoryDetails.Name}
                    </span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="mb-4">
                  <span 
                    className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    Business Guide
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {listingPost.Title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {(listingPost.AuthorDetails?.Name || listingPost.Author) && (
                    <div className="flex items-center">
                      <span>By </span>
                      {listingPost.AuthorDetails?.Slug ? (
                        <Link 
                          href={`/blog/author/${listingPost.AuthorDetails.Slug}`}
                          className="text-[var(--primary-color)] hover:underline font-medium ml-1"
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
                  <div>{listingPost.BusinessDetails?.length || 0} Business{listingPost.BusinessDetails?.length !== 1 ? 'es' : ''}</div>
                </div>

                {/* Featured Image */}
                {listingPost['Featured image']?.[0] && (
                  <div className="mb-8">
                    <Image
                      src={listingPost['Featured image'][0].url}
                      alt={listingPost.Title}
                      width={listingPost['Featured image'][0].width}
                      height={listingPost['Featured image'][0].height}
                      className="w-full h-auto rounded-lg shadow-lg"
                      priority
                    />
                  </div>
                )}

                {/* Excerpt */}
                {listingPost.Excerpt && (
                  <div className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-[var(--primary-color)] pl-6">
                    {listingPost.Excerpt}
                  </div>
                )}
              </header>

              {/* Business Listings */}
              {listingPost.BusinessDetails && listingPost.BusinessDetails.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Businesses</h2>
                  <div className="space-y-8">
                    {listingPost.BusinessDetails.map((business, index) => (
                      <div key={business.id}>
                        <BusinessCard business={business} rank={index + 1} />
                        
                        {/* Private Event Form between businesses */}
                        {showPrivateEventForm && index === Math.floor(listingPost.BusinessDetails!.length / 2) - 1 && (
                          <div className="my-12 p-6 bg-gray-50 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4">Interested in a Private Event?</h3>
                            <PrivateEventFormSection simplified />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Conclusion */}
              {listingPost.Conclusion && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Conclusion</h2>
                  <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {listingPost.Conclusion}
                    </p>
                  </div>
                </section>
              )}

              {/* Bottom Private Event Form */}
              {showPrivateEventForm && (
                <div className="mt-16 p-8 bg-[var(--primary-color)] text-white rounded-lg">
                  <h3 className="text-2xl font-bold mb-4">Ready to Book Your Private Event?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Contact us to discuss your special occasion and create an unforgettable experience.
                  </p>
                  <PrivateEventFormSection simplified darkMode />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 mt-12 lg:mt-0">
              <div className="sticky top-8 space-y-6">
                {/* Private Event Form in Sidebar */}
                {showPrivateEventForm && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Book a Private Event</h3>
                    <PrivateEventFormSection simplified />
                  </div>
                )}

                {/* Business Quick Links */}
                {listingPost.BusinessDetails && listingPost.BusinessDetails.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Featured Businesses</h3>
                    <div className="space-y-3">
                      {listingPost.BusinessDetails.map((business, index) => (
                        <div key={business.id} className="flex items-center gap-3">
                          <span 
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary-color)] text-white text-xs font-bold flex items-center justify-center"
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{business.Competitor}</p>
                            {business.Price && (
                              <p className="text-xs text-gray-600">From €{business.Price}</p>
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
        </article>
      );
    }

  } catch (error) {
    console.error('Error loading post:', error);
    redirect('/');
  }
} 