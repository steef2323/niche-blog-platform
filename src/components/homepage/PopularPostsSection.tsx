'use client';

import { useEffect, useState } from 'react';
import { useSite } from '@/contexts/site';
import { BlogPost, ListingPost, Page } from '@/types/airtable';
import BlogGrid from '@/components/blog/BlogGrid';
import Link from 'next/link';

type PostWithType = (BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' });

interface PopularPostsSectionProps {
  homePage: Page | null;
}

export default function PopularPostsSection({ homePage }: PopularPostsSectionProps) {
  const { site } = useSite();
  const [initialPosts, setInitialPosts] = useState<PostWithType[]>([]);
  const [loading, setLoading] = useState(true);

  // Get section title and subtitle from home page
  const sectionTitle = homePage?.['Home - Category 1'] || 'Popular Posts';
  const sectionSubtitle = homePage?.['Home - Subtitle 1'] || 'Most loved articles';

  useEffect(() => {
    if (!site?.id) return;

    const fetchInitialPosts = async () => {
      try {
        // Fetch initial posts with popular posts prioritized
        const response = await fetch(`/api/blog/posts?siteId=${site.id}&limit=12&prioritizePopular=true`);
        if (response.ok) {
          const posts: PostWithType[] = await response.json();
          setInitialPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching initial posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [site?.id]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="site-container">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {sectionTitle}
            </h2>
            <p className="text-lg text-gray-600">{sectionSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 aspect-[4/3] rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (initialPosts.length === 0) {
    return null;
  }

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
            {sectionTitle}
          </h2>
          <Link 
            href="/blog"
            className="text-lg hover:underline transition-all duration-200"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7
            }}
          >
            {sectionSubtitle}
          </Link>
        </div>

        {/* Use BlogGrid component for lazy loading with prioritized posts */}
        <BlogGrid 
          initialPosts={initialPosts}
          siteId={site?.id || ''}
          postsPerPage={12}
          apiParams="prioritizePopular=true"
        />
      </div>
    </section>
  );
} 