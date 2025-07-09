'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, ListingPost } from '@/types/airtable';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { getBlogTitle, getBlogExcerpt, getContentForReadingTime } from '@/lib/utils/structured-content';

type PostWithType = (BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' });

interface BlogGridProps {
  initialPosts: PostWithType[];
  siteId: string;
  postsPerPage: number;
  apiParams?: string; // Optional additional API parameters
}

export default function BlogGrid({ initialPosts, siteId, postsPerPage, apiParams }: BlogGridProps) {
  const [posts, setPosts] = useState<PostWithType[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === postsPerPage);
  const [offset, setOffset] = useState(postsPerPage);

  // Load more posts function
  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/blog/posts?siteId=${siteId}&limit=${postsPerPage}&offset=${offset}&${apiParams || ''}`);
      const newPosts: PostWithType[] = await response.json();

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setOffset(prev => prev + postsPerPage);
        setHasMore(newPosts.length === postsPerPage);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, siteId, postsPerPage, offset, apiParams]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, offset, loadMorePosts]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p 
          className="text-lg"
          style={{ 
            color: 'var(--text-color)',
            fontFamily: 'var(--font-body)',
            opacity: 0.7
          }}
        >
          No posts found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          const isListingPost = post.type === 'listing';
          const readingTime = !isListingPost ? (() => {
            const content = getContentForReadingTime(post as BlogPost);
            return content ? calculateReadingTime(content) : null;
          })() : null;
          const publishDate = post['Published date'] 
            ? new Date(post['Published date']).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : null;

          return (
            <article key={post.id || post.Slug} className="group">
              <Link href={`/blog/${post.Slug}`} className="block">
                {/* Featured Image */}
                <div className="aspect-[4/3] relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                  {post['Featured image']?.[0] ? (
                    <Image
                      src={post['Featured image'][0].url}
                      alt={post.type === 'blog' ? getBlogTitle(post as BlogPost) : (post as ListingPost).Title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span 
                        className="text-sm"
                        style={{ 
                          color: 'var(--muted-color)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        No image
                      </span>
                    </div>
                  )}
                  
                  {/* Post Type & Category Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {/* Post Type Badge */}
                    {isListingPost && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Business Guide
                      </span>
                    )}
                    
                    {/* Category Badge */}
                    {post.CategoryDetails && (
                      <Link
                        href={`/blog/category/${post.CategoryDetails.Slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white hover:opacity-90 transition-opacity"
                        style={{ 
                          backgroundColor: `var(--accent-color, ${post.CategoryDetails.Color || '#3B82F6'})`
                        }}
                      >
                        {post.CategoryDetails.Name}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  {/* Title */}
                  <h2 
                    className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors duration-200"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {post.type === 'blog' ? getBlogTitle(post as BlogPost) : (post as ListingPost).Title}
                  </h2>

                  {/* Excerpt/Introduction */}
                  {(() => {
                    const excerpt = post.type === 'blog' 
                      ? getBlogExcerpt(post as BlogPost) 
                      : ((post as ListingPost).Excerpt || '');
                    
                    return excerpt ? (
                      <p 
                        className="mb-4 line-clamp-3 leading-relaxed"
                        style={{ 
                          color: 'var(--text-color)',
                          fontFamily: 'var(--font-body)',
                          opacity: 0.8
                        }}
                      >
                        {excerpt}
                      </p>
                    ) : null;
                  })()}

                  {/* Meta Information */}
                  <div 
                    className="flex items-center gap-3 text-sm"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)',
                      opacity: 0.6
                    }}
                  >
                    {publishDate && <span>{publishDate}</span>}
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
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-8">
          <div 
            className="inline-flex items-center gap-2"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7
            }}
          >
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--primary-color)] rounded-full animate-spin"></div>
            <span>Loading more posts...</span>
          </div>
        </div>
      )}

      {/* End of Posts Message */}
      {!hasMore && posts.length > postsPerPage && (
        <div className="text-center py-8">
          <p 
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7
            }}
          >
            You&apos;ve reached the end of our posts.
          </p>
        </div>
      )}
    </div>
  );
} 