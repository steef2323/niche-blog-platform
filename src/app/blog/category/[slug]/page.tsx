import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getCategoryBySlug, getCombinedPostsByCategorySlug } from '@/lib/airtable/content';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { generateCategoryPageSchemas } from '@/lib/utils/schema';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Enable ISR with 12-hour revalidation (content changes ~2x/week)
export const revalidate = 12 * 60 * 60; // 12 hours in seconds

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      return { title: 'Category Not Found' };
    }

    const category = await getCategoryBySlug(params.slug);
    if (!category) {
      return { title: 'Category Not Found' };
    }

    // Use Meta title/description with fallbacks
    const categoryName = category['Page title'] || category.Name;
    const metaTitle = category['Meta title'] || `${categoryName} - Category`;
    const metaDescription = category['Meta description'] || 
      category.Description || 
      `Browse articles in ${categoryName}`;

    // Build canonical URL
    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const canonicalUrl = `${siteUrl}/blog/category/${category.Slug}`;

    // Get Open Graph image from site logo
    const ogImage = site['Site logo']?.[0]?.url;

    // Get posts for schema (limited to first 20)
    let schemaPosts: Array<{id?: string, Slug: string, Title?: string, H1?: string}> = [];
    try {
      const allPosts = await getCombinedPostsByCategorySlug(params.slug, site.id);
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
      { label: categoryName }
    ];

    // Generate schema markup
    const schemas = generateCategoryPageSchemas(category, site, schemaPosts, breadcrumbItems);

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'website',
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
    return { title: 'Category' };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
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

    // Get category data
    const category = await getCategoryBySlug(params.slug);
    if (!category) {
      notFound();
    }

    // Get category posts (both blog and listing posts)
    const allPosts = await getCombinedPostsByCategorySlug(params.slug, site.id);

    // Build breadcrumbs
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: category['Page title'] || category.Name }
    ];

    return (
      <div className="site-container py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {/* Category Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {category['Page title'] || category.Name}
          </h1>
          
          {category.Description && (
            <p 
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {category.Description}
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
          </div>
        </div>

        {/* Articles Grid */}
        {allPosts.length === 0 ? (
          <div className="text-center py-12">
            <p 
              className="text-lg mb-6"
              style={{ 
                color: 'var(--muted-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              No articles found in this category.
            </p>
            <Link 
              href="/blog"
              className="inline-block px-6 py-3 rounded-lg transition-colors duration-200 hover:opacity-90"
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
                          {post.AuthorDetails?.Name && (
                            <>
                              <span>By {post.AuthorDetails.Name}</span>
                              <span>•</span>
                            </>
                          )}
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
                        style={{ color: 'var(--text-color)' }}
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
    );

  } catch (error) {
    console.error('Error loading category page:', error);
    redirect('/');
  }
} 