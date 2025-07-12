import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, ListingPost } from '@/types/airtable';

interface PostWithType extends Omit<BlogPost | ListingPost, 'type'> {
  type: 'blog' | 'listing';
}

interface MostPopularSectionProps {
  posts: PostWithType[];
  siteId: string;
}

export default function MostPopularSection({ posts, siteId }: MostPopularSectionProps) {
  if (!posts || posts.length === 0) {
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
    <section className="py-16 bg-white">
      <div className="site-container">
        {/* Section Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ 
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-color)'
            }}
          >
            Popular
          </h2>
          <p 
            className="text-lg"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7
            }}
          >
            Discover our most loved articles and guides
          </p>
        </div>

        {/* Popular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => {
            const featuredImage = post['Featured image']?.[0]?.url;
            const isListingPost = post.type === 'listing';
            
            return (
              <article 
                key={`${post.type}-${post.Slug}-${index}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200"
              >
                {/* Featured Image */}
                {featuredImage && (
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <Image
                      src={featuredImage}
                      alt={post.Title || 'Featured post image'}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      quality={75}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      // Next.js automatically serves WebP/AVIF if supported
                    />
                    {/* Post Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{ 
                          backgroundColor: isListingPost ? 'var(--accent-color)' : 'var(--primary-color)' 
                        }}
                      >
                        {isListingPost ? 'Guide' : 'Article'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:underline">
                    <Link 
                      href={`/blog/${post.Slug}`}
                      style={{ color: 'var(--text-color)' }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {post.Title}
                    </Link>
                  </h3>

                  {/* Excerpt */}
                  {post.Excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.Excerpt}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(post['Published date'])}</span>
                    {post.CategoryDetails?.Name && (
                      <span 
                        className="px-2 py-1 rounded-full border"
                        style={{ 
                          borderColor: 'var(--accent-color)',
                          color: 'var(--accent-color)' 
                        }}
                      >
                        {post.CategoryDetails.Name}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* More Link */}
        <div className="text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 rounded-md font-medium transition-colors hover:opacity-80"
            style={{ 
              backgroundColor: 'var(--primary-color)',
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