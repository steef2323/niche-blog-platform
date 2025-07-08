import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getCategoryBySlug, getCombinedPostsByCategorySlug } from '@/lib/airtable/content';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

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

    return {
      title: `${category['Page title'] || category.Name} - Category`,
      description: category.Description || `Browse articles in ${category.Name}`,
      openGraph: {
        title: `${category['Page title'] || category.Name} - Category`,
        description: category.Description || `Browse articles in ${category.Name}`,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${category['Page title'] || category.Name} - Category`,
        description: category.Description || `Browse articles in ${category.Name}`,
      },
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {category['Page title'] || category.Name}
          </h1>
          
          {category.Description && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {category.Description}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{allPosts.length} article{allPosts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Articles Grid */}
        {allPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-6">
              No articles found in this category.
            </p>
            <Link 
              href="/blog"
              className="inline-block px-6 py-3 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--secondary-color)] transition-colors duration-200"
            >
              Browse All Articles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => {
              const isListingPost = post.type === 'listing';
              const readingTime = !isListingPost && 'Content' in post ? calculateReadingTime(post.Content) : null;
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
                <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
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
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Business Guide
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link 
                        href={`/blog/${post.Slug}`}
                        className="hover:text-[var(--primary-color)] transition-colors duration-200"
                      >
                        {displayTitle}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    {displayExcerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {displayExcerpt}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
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
                        className="text-[var(--primary-color)] hover:underline font-medium"
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