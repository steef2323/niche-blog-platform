import Link from 'next/link';
import Image from 'next/image';
import { ListingPost } from '@/types/airtable';

interface AllListiclesSectionProps {
  listingPosts: ListingPost[];
  siteId: string;
}

export default function AllListiclesSection({ listingPosts, siteId }: AllListiclesSectionProps) {
  if (!listingPosts || listingPosts.length === 0) {
    return null;
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: 'var(--accent-color)' }}
    >
      <div className="site-container">
        {/* Section Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Hotspots
          </h2>
          <p 
            className="text-lg text-white/80"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Curated guides to the best local businesses and experiences
          </p>
        </div>

        {/* Listing Posts Grid - Mobile carousel, Desktop grid */}
        <div className="mobile-carousel">
          <div className="mobile-carousel-grid md:grid-cols-4 gap-8 mb-12">
            {listingPosts.map((post, index) => {
              const featuredImage = post['Featured image']?.[0]?.url;
              
              return (
                <article 
                  key={`listing-${post.Slug}-${index}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200"
                >
                  {/* Featured Image */}
                  {featuredImage && (
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={featuredImage}
                        alt={post.Title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      {/* Guide Badge */}
                      <div className="absolute top-3 left-3">
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: 'var(--accent-color)' }}
                        >
                          Guide
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Category */}
                    {post.CategoryDetails?.Name && (
                      <div className="mb-2">
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-full border"
                          style={{ 
                            borderColor: 'var(--accent-color)',
                            color: 'var(--accent-color)' 
                          }}
                        >
                          {post.CategoryDetails.Name}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">
                      <Link 
                        href={`/blog/${post.Slug}`}
                        style={{ color: 'var(--text-color)' }}
                        className="hover:underline hover:opacity-80 transition-opacity"
                      >
                        {post.Title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    {post.Excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.Excerpt}
                      </p>
                    )}

                    {/* Business Count */}
                    {post.BusinessDetails && post.BusinessDetails.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500">
                          {post.BusinessDetails.length} {post.BusinessDetails.length === 1 ? 'business' : 'businesses'} featured
                        </span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-xs text-gray-500">
                      {formatDate(post['Published date'])}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* More Link */}
        <div className="text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 rounded-md font-medium transition-colors hover:opacity-80"
            style={{ 
              backgroundColor: 'var(--accent-color)',
              color: 'white'
            }}
          >
            More
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
} 