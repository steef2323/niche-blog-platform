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
  const [allPosts, setAllPosts] = useState<PostWithType[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<PostWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const MAX_INITIAL_POSTS = 6;

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
          setAllPosts(posts);
          setDisplayedPosts(posts.slice(0, MAX_INITIAL_POSTS));
        }
      } catch (error) {
        console.error('Error fetching initial posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [site?.id]);

  const handleLoadMore = () => {
    setShowAll(true);
    setDisplayedPosts(allPosts);
  };

  if (loading) {
    return (
      <section className="pt-8 pb-16 bg-white">
        <div className="site-container">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {sectionTitle}
            </h2>
            <p className="text-lg text-gray-600">{sectionSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

  if (allPosts.length === 0 && !loading) {
    return null;
  }

  const hasMorePosts = allPosts.length > MAX_INITIAL_POSTS && !showAll;

  return (
    <section className="pt-8 pb-16 bg-white">
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

        {/* Display posts using BlogGrid - disable infinite scroll for homepage */}
        {displayedPosts.length > 0 && (
          <BlogGrid 
            key={displayedPosts.length} // Force re-render when posts change
            initialPosts={displayedPosts}
            siteId={site?.id || ''}
            postsPerPage={12}
            apiParams="prioritizePopular=true"
            disableInfiniteScroll={true}
          />
        )}

        {/* Load More and Blog Overview Buttons */}
        {hasMorePosts && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button 
              onClick={handleLoadMore}
              className="btn-primary"
            >
              Load more
            </button>
            <Link 
              href="/blog"
              className="btn-secondary"
            >
              Blog overview
            </Link>
          </div>
        )}

        {/* Show only Blog Overview button if all posts are displayed */}
        {!hasMorePosts && allPosts.length > 0 && (
          <div className="flex justify-center items-center mt-12">
            <Link 
              href="/blog"
              className="btn-secondary"
            >
              Blog overview
            </Link>
          </div>
        )}
      </div>
    </section>
  );
} 