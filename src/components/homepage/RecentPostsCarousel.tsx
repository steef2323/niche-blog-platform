'use client';

import { useEffect, useState } from 'react';
import { useSite } from '@/contexts/site';
import { BlogPost, Page } from '@/types/airtable';
import BlogGrid from '@/components/blog/BlogGrid';

interface RecentPostsCarouselProps {
  homePage: Page | null;
}

export default function RecentPostsCarousel({ homePage }: RecentPostsCarouselProps) {
  const { site } = useSite();
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Get section title and subtitle from home page
  const sectionTitle = homePage?.['Home - Category 2'] || 'Recent Posts';
  const sectionSubtitle = homePage?.['Home - Subtitle 2'] || 'Latest articles';

  useEffect(() => {
    if (!site?.id) return;

    const fetchRecentPosts = async () => {
      try {
        const response = await fetch(`/api/blog-posts?siteId=${site.id}&limit=8`);
        if (response.ok) {
          const posts = await response.json();
          setRecentPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching recent posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, [site?.id]);

  if (loading) {
    return (
      <section 
        className="py-16"
        style={{ backgroundColor: site?.['Accent color'] || '#3B82F6' }}
      >
        <div className="site-container">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {sectionTitle}
            </h2>
            <p 
              className="text-lg text-white/80"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {sectionSubtitle}
            </p>
          </div>
          <div className="mobile-carousel">
            <div className="mobile-carousel-grid md:grid-cols-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mobile-carousel-item animate-pulse">
                  <div className="bg-white/20 aspect-[4/3] rounded-xl mb-4"></div>
                  <div className="bg-white/20 h-4 rounded mb-2"></div>
                  <div className="bg-white/20 h-3 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (recentPosts.length === 0) {
    return null;
  }

  // Convert posts to the format expected by BlogGrid
  const postsWithType = recentPosts.map(post => ({
    ...post,
    type: 'blog' as const
  }));

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: site?.['Accent color'] || '#3B82F6' }}
    >
      <div className="site-container">
        {/* Section Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {sectionTitle}
          </h2>
          <p 
            className="text-lg text-white/80"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {sectionSubtitle}
          </p>
        </div>

        {/* Use BlogGrid component for consistent styling */}
        <BlogGrid 
          initialPosts={postsWithType}
          siteId={site?.id || ''}
          postsPerPage={8}
        />
      </div>
    </section>
  );
} 