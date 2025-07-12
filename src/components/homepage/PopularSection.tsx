import { BlogPost, ListingPost } from '@/types/airtable';
import Link from 'next/link';
import Image from 'next/image';

interface PopularSectionProps {
  blogPosts: BlogPost[];
  listingPosts: ListingPost[];
}

export default function PopularSection({ blogPosts, listingPosts }: PopularSectionProps) {
  // Combine and sort posts by published date (most recent first)
  const allPosts = [
    ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
    ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a['Published date'] || '').getTime();
    const dateB = new Date(b['Published date'] || '').getTime();
    return dateB - dateA;
  });

  // Take the top 4 most popular/recent posts
  const popularPosts = allPosts.slice(0, 4);

  if (popularPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-color)' }}>
          Popular
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularPosts.map((post, index) => {
            const featuredImage = post['Featured image']?.[0]?.url;
            const slug = post.Slug;
            const href = `/blog/${slug}`;
            
            return (
              <Link 
                key={`${post.type}-${post.ID}`}
                href={href}
                className="group block"
              >
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <Image 
                        src={featuredImage} 
                        alt={post.Title || 'Post image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        quality={75}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        // Next.js automatically serves WebP/AVIF if supported
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors">
                      {post.Title}
                    </h3>
                    
                    {post.Excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {post.Excerpt}
                      </p>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {post.type === 'blog' ? 'Article' : 'Listing'}
                      </span>
                      {post['Published date'] && (
                        <span className="text-xs text-gray-500">
                          {new Date(post['Published date']).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
} 