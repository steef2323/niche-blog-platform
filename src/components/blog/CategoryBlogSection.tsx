'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, ListingPost } from '@/types/airtable';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';
import { getBlogTitle, getBlogExcerpt, getContentForReadingTime } from '@/lib/utils/structured-content';

interface Category {
  id: string;
  Name: string;
  Slug: string;
  Description?: string;
  Color?: string;
}

type PostWithType = (BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' });

interface CategoryBlogSectionProps {
  category: Category;
  siteId: string;
  isFirst?: boolean;
}

export default function CategoryBlogSection({ category, siteId, isFirst = false }: CategoryBlogSectionProps) {
  const [posts, setPosts] = useState<PostWithType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        setLoading(true);
        
        // Fetch combined posts for this category via API endpoint
        const response = await fetch(`/api/blog/posts/by-category?categorySlug=${category.Slug}&siteId=${siteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch category posts');
        }
        
        const categoryPosts = await response.json();
        setPosts(categoryPosts);
      } catch (error) {
        console.error('Error fetching category posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [category.Slug, siteId]);

  // Show first 6 posts only
  const displayedPosts = posts.slice(0, 6);

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show empty categories
  }

  return (
    <section className={`${!isFirst ? 'border-t border-gray-200 pt-16' : ''}`}>
      {/* Category Header */}
      <div className="mb-8">
        <Link href={`/blog/category/${category.Slug}`}>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 hover:text-[var(--primary-color)] transition-colors duration-200 cursor-pointer" style={{ color: category.Color || 'inherit' }}>
            {category.Name}
          </h2>
        </Link>
        {category.Description && (
          <p className="text-lg text-gray-600 max-w-3xl">
            {category.Description}
          </p>
        )}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {displayedPosts.map((post) => {
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
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                  
                  {/* Post Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isListingPost 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isListingPost ? 'Listicle' : 'Article'}
                    </span>
                  </div>
                </div>

                <div>
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors duration-200">
                    {post.type === 'blog' ? getBlogTitle(post as BlogPost) : (post as ListingPost).Title}
                  </h3>

                  {/* Excerpt/Introduction */}
                  {(() => {
                    const excerpt = post.type === 'blog' 
                      ? getBlogExcerpt(post as BlogPost) 
                      : ((post as ListingPost).Excerpt || '');
                    
                    return excerpt ? (
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {excerpt}
                      </p>
                    ) : null;
                  })()}

                  {/* Meta Information */}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
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

      {/* Category Overview Button */}
      <div className="text-center">
        <Link
          href={`/blog/category/${category.Slug}`}
          className="btn-accent"
        >
          View All in {category.Name} →
        </Link>
      </div>
    </section>
  );
} 