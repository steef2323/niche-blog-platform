import { BlogPost, ListingPost } from '@/types/airtable';
import Link from 'next/link';

interface RecentPostsSectionProps {
  blogPosts: BlogPost[];
  listingPosts: ListingPost[];
}

export default function RecentPostsSection({ blogPosts, listingPosts }: RecentPostsSectionProps) {
  // Combine and sort posts by published date (most recent first)
  const allPosts = [
    ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
    ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a['Published date'] || '').getTime();
    const dateB = new Date(b['Published date'] || '').getTime();
    return dateB - dateA;
  });

  // Take the top 6 most recent posts
  const recentPosts = allPosts.slice(0, 6);

  if (recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-color)' }}>
          Recent Posts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPosts.map((post) => {
            const featuredImage = post['Featured image']?.[0]?.url;
            const slug = post.Slug;
            const href = `/blog/${slug}`;
            
            return (
              <Link 
                key={`${post.type}-${post.ID}`}
                href={href}
                className="group block"
              >
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={featuredImage} 
                        alt={post.Title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span 
                        className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: 'var(--accent-color)', 
                          color: 'white' 
                        }}
                      >
                        {post.type === 'blog' ? 'Article' : 'Listing'}
                      </span>
                      {post['Published date'] && (
                        <span className="text-xs text-gray-500">
                          {new Date(post['Published date']).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors">
                      {post.Title}
                    </h3>
                    
                    {post.Excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-4 flex-grow">
                        {post.Excerpt}
                      </p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span 
                        className="text-sm font-medium group-hover:underline"
                        style={{ color: 'var(--primary-color)' }}
                      >
                        Read more →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-12">
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--primary-color)', 
              color: 'white' 
            }}
          >
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  );
} 