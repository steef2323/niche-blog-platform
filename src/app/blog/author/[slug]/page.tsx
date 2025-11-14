import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getAuthorBySlug, getCombinedPostsByAuthorSlug } from '@/lib/airtable/content';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { generateAuthorPageSchemas } from '@/lib/utils/schema';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface AuthorPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      return { title: 'Author Not Found' };
    }

    const author = await getAuthorBySlug(params.slug);
    if (!author) {
      return { title: 'Author Not Found' };
    }

    // Use Meta title/description with fallbacks
    const metaTitle = author['Meta title'] || `${author.Name} - Author`;
    const metaDescription = author['Meta description'] || 
      author.Bio || 
      `Read articles by ${author.Name}`;

    // Build canonical URL
    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const authorSlug = author.Slug || params.slug;
    const canonicalUrl = `${siteUrl}/blog/author/${authorSlug}`;

    // Get Open Graph image from author profile picture or site logo
    const ogImage = author['Profile picture']?.[0]?.url || site['Site logo']?.[0]?.url;

    // Get posts for schema (limited to first 20)
    let schemaPosts: Array<{id?: string, Slug: string, Title?: string, H1?: string}> = [];
    try {
      const allPosts = await getCombinedPostsByAuthorSlug(params.slug, site.id);
      schemaPosts = allPosts.slice(0, 20).map(post => ({
        id: post.id,
        Slug: post.Slug,
        Title: post.Title,
        H1: post.type === 'blog' ? (post as any).H1 : undefined
      }));
    } catch (error) {
      console.error('Error fetching posts for schema:', error);
    }

    // Build breadcrumbs for schema
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: `Author: ${author.Name}` }
    ];

    // Generate schema markup
    const schemas = generateAuthorPageSchemas(author, site, schemaPosts, breadcrumbItems);

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'profile',
        url: canonicalUrl,
        ...(ogImage && { images: [{ url: ogImage }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        ...(ogImage && { images: [ogImage] }),
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
    return { title: 'Author' };
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
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

    // Get author data
    const author = await getAuthorBySlug(params.slug);
    if (!author) {
      notFound();
    }

    // Get author's combined posts (both blog and listing posts)
    const allPosts = await getCombinedPostsByAuthorSlug(params.slug, site.id);

    // Build breadcrumbs
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: `Author: ${author.Name}` }
    ];

    return (
      <div className="site-container py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {/* Author Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            {author['Profile picture']?.[0]?.url ? (
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden">
                <Image
                  src={author['Profile picture'][0].url}
                  alt={author.Name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--border-color)' }}
              >
                <span 
                  className="text-2xl"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {author.Name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {author.Name}
          </h1>
          
          {author.Bio && (
            <p 
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {author.Bio}
            </p>
          )}

          <div 
            className="mt-6 flex items-center justify-center gap-4 text-sm"
            style={{ 
              color: 'var(--muted-color)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <span>{allPosts.length} article{allPosts.length !== 1 ? 's' : ''}</span>
            {author['Published date'] && (
              <>
                <span>•</span>
                <span>Joined {new Date(author['Published date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
              </>
            )}
          </div>
        </div>

        {/* Author's Articles */}
        <div>
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Articles by {author.Name}
          </h2>

          {allPosts.length === 0 ? (
            <div className="text-center py-12">
              <p 
                className="text-lg"
                style={{ 
                  color: 'var(--muted-color)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                No articles found by this author.
              </p>
              <Link 
                href="/blog"
                className="inline-block mt-4 px-6 py-3 rounded-lg hover:opacity-90 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--background-color)',
                }}
              >
                Browse All Articles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPosts.map((post) => {
                const isListingPost = post.type === 'listing';
                const readingTime = !isListingPost && 'Content' in post && post.Content ? calculateReadingTime(post.Content) : null;
                const publishDate = post['Published date'] 
                  ? new Date(post['Published date']).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : null;

                // Helper functions for blog posts to use H1 and Meta description
                const getDisplayTitle = (post: any) => {
                  if (post.type === 'blog' && post.H1) {
                    return post.H1;
                  }
                  return post.Title;
                };

                const getDisplayExcerpt = (post: any) => {
                  if (post.type === 'blog' && post['Meta description']) {
                    return post['Meta description'];
                  }
                  return post.Excerpt;
                };

                const displayTitle = getDisplayTitle(post);
                const displayExcerpt = getDisplayExcerpt(post);

                return (
                  <article 
                    key={post.id} 
                    className="rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {/* Featured Image */}
                    {post['Featured image']?.[0] && (
                      <div className="aspect-video relative">
                        <Image
                          src={post['Featured image'][0].url}
                          alt={displayTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Post Type Badge */}
                      {isListingPost && (
                        <div className="mb-3">
                          <span 
                            className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              background: `linear-gradient(to right, var(--primary-color), var(--accent-color))`,
                              color: 'var(--text-color)',
                            }}
                          >
                            Business Guide
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 
                        className="text-xl font-semibold mb-2 line-clamp-2"
                        style={{ 
                          color: 'var(--text-color)',
                          fontFamily: 'var(--font-heading)'
                        }}
                      >
                        <Link 
                          href={`/blog/${post.Slug}`}
                          className="hover:text-[var(--primary-color)] transition-colors duration-200"
                          style={{ 
                            color: 'var(--text-color)',
                            fontFamily: 'var(--font-heading)'
                          }}
                        >
                          {displayTitle}
                        </Link>
                      </h3>

                      {/* Excerpt */}
                      {displayExcerpt && (
                        <p 
                          className="text-sm line-clamp-3 mb-4"
                          style={{ 
                            color: 'var(--text-color)',
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          {displayExcerpt}
                        </p>
                      )}

                      {/* Meta Information */}
                      <div 
                        className="flex items-center justify-between text-xs"
                        style={{ 
                          color: 'var(--muted-color)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {publishDate && (
                            <span>{publishDate}</span>
                          )}
                          {readingTime && (
                            <>
                              <span>•</span>
                              <span>{formatReadingTime(readingTime)}</span>
                            </>
                          )}
                          {isListingPost && 'BusinessDetails' in post && (
                            <>
                              <span>•</span>
                              <span>{post.BusinessDetails?.length || 0} business{post.BusinessDetails?.length !== 1 ? 'es' : ''}</span>
                            </>
                          )}
                        </div>
                        
                        <Link 
                          href={`/blog/${post.Slug}`}
                          className="hover:underline font-medium"
                          style={{ 
                            color: 'var(--text-color)',
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          Read more →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error loading author page:', error);
    redirect('/');
  }
} 