'use client';

import { useEffect, useState } from 'react';
import { useSite } from '@/contexts/site';
import { BlogPost } from '@/types/airtable';
import Link from 'next/link';
import BlogGrid from '@/components/blog/BlogGrid';

interface CategoryPostsGridProps {
  categoryId: string | null;
  sectionTitle: string;
  sectionSubtitle: string;
  backgroundColor?: string;
  sectionNumber: number; // 3 or 4
}

export default function CategoryPostsGrid({ 
  categoryId, 
  sectionTitle, 
  sectionSubtitle, 
  backgroundColor = 'white',
  sectionNumber 
}: CategoryPostsGridProps) {
  const { site } = useSite();
  const [categoryPosts, setCategoryPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<any>(null);

  const isAccentSection = sectionNumber === 4;
  const bgColor = isAccentSection ? (site?.['Accent color'] || '#3B82F6') : 'white';
  const textColor = isAccentSection ? 'text-white' : 'text-gray-900';
  const subtitleColor = isAccentSection ? 'text-white/80' : 'text-gray-600';

  useEffect(() => {
    if (!site?.id || !categoryId) {
      setLoading(false);
      return;
    }

    const fetchCategoryPosts = async () => {
      try {
        const response = await fetch(`/api/blog-posts/by-category?categoryId=${categoryId}&siteId=${site.id}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setCategoryPosts(data.posts || []);
          setCategoryInfo(data.category || null);
        }
      } catch (error) {
        console.error('Error fetching category posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [site?.id, categoryId]);

  if (loading) {
    return (
      <section 
        className="py-16"
        style={{ backgroundColor: bgColor }}
      >
        <div className="site-container">
          <div className="text-left mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textColor}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {sectionTitle}
            </h2>
            <p 
              className={`text-lg ${subtitleColor}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {sectionSubtitle}
            </p>
          </div>
          <div className="mobile-carousel">
            <div className="mobile-carousel-grid md:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mobile-carousel-item animate-pulse">
                  <div className={`${isAccentSection ? 'bg-white/20' : 'bg-gray-300'} aspect-[4/3] rounded-xl mb-4`}></div>
                  <div className={`${isAccentSection ? 'bg-white/20' : 'bg-gray-300'} h-4 rounded mb-2`}></div>
                  <div className={`${isAccentSection ? 'bg-white/20' : 'bg-gray-300'} h-3 rounded w-3/4`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!categoryId || categoryPosts.length === 0) {
    return null;
  }

  // Convert posts to the format expected by BlogGrid
  const postsWithType = categoryPosts.map(post => ({
    ...post,
    type: 'blog' as const
  }));

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: bgColor }}
    >
      <div className="site-container">
        {/* Section Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 
            className={`text-3xl md:text-4xl font-bold mb-4 ${textColor}`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {sectionTitle}
          </h2>
          {categoryInfo ? (
            <Link 
              href={`/blog/category/${categoryInfo.Slug}`}
              className={`text-lg hover:underline transition-all duration-200 ${subtitleColor}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {sectionSubtitle}
            </Link>
          ) : (
            <p 
              className={`text-lg ${subtitleColor}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {sectionSubtitle}
            </p>
          )}
        </div>

        {/* Use BlogGrid component for consistent styling */}
        <div className="mb-12">
          <BlogGrid 
            initialPosts={postsWithType}
            siteId={site?.id || ''}
            postsPerPage={5}
          />
        </div>

        {/* More Button - Using global button styles */}
        {categoryInfo && (
          <div className="text-center">
            <Link 
              href={`/blog/category/${categoryInfo.Slug}`}
              className={isAccentSection ? 'btn-secondary' : 'btn-primary'}
            >
              More {categoryInfo.Name || 'Articles'}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
} 