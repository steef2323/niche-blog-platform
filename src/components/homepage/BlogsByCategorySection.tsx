'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, Category } from '@/types/airtable';

interface BlogsByCategorySectionProps {
  siteId: string;
}

export default function BlogsByCategorySection({ siteId }: BlogsByCategorySectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPosts, setCategoryPosts] = useState<Record<string, BlogPost[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesAndPosts = async () => {
      try {
        setLoading(true);
        
        // Get all categories used by this site via API route
        const categoriesResponse = await fetch(`/api/categories?siteId=${siteId}`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const siteCategories = await categoriesResponse.json();
        
        if (siteCategories.length === 0) {
          setLoading(false);
          return;
        }

        setCategories(siteCategories);

        // Get blog posts for each category via API route (limit to 4 per category)
        const postsPromises = siteCategories.map(async (category: Category) => {
          const response = await fetch(`/api/blog-posts/by-category?categorySlug=${category.Slug}&siteId=${siteId}&limit=4`);
          if (!response.ok) {
            throw new Error(`Failed to fetch posts for category ${category.Slug}`);
          }
          const posts = await response.json();
          return { categorySlug: category.Slug, posts };
        });

        const results = await Promise.all(postsPromises);
        
        const postsMap: Record<string, BlogPost[]> = {};
        results.forEach(({ categorySlug, posts }) => {
          postsMap[categorySlug] = posts;
        });

        setCategoryPosts(postsMap);
      } catch (error) {
        console.error('Error fetching categories and posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndPosts();
  }, [siteId]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="mb-12">
          <div className="w-48 h-8 bg-gray-300 rounded mb-4 animate-pulse"></div>
          <div className="w-96 h-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-6">
              <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
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
            Local Corner
          </h2>
          <p 
            className="text-lg"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7
            }}
          >
            Explore articles by category to find exactly what you&apos;re looking for
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => {
            const posts = categoryPosts[category.Slug] || [];
            
            if (posts.length === 0) {
              return null;
            }

            return (
              <div key={category.Slug} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {category.Name}
                  </h3>
                  <Link 
                    href={`/blog/category/${category.Slug}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    More
                  </Link>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {posts.map((post, index) => {
                    const featuredImage = post['Featured image']?.[0]?.url;
                    
                    return (
                      <article 
                        key={`category-blog-${post.Slug}-${index}`}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200"
                      >
                        {/* Featured Image */}
                        {featuredImage && (
                          <div className="aspect-[4/3] relative overflow-hidden">
                            <Image
                              src={featuredImage}
                              alt={post.Title || 'Blog post image'}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          {/* Title */}
                          <h4 className="text-lg font-bold mb-2 line-clamp-2">
                            <Link 
                              href={`/blog/${post.Slug}`}
                              style={{ color: 'var(--text-color)' }}
                              className="hover:underline hover:opacity-80 transition-opacity"
                            >
                              {post.Title}
                            </Link>
                          </h4>

                          {/* Excerpt */}
                          {post.Excerpt && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {post.Excerpt}
                            </p>
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
            );
          })}
        </div>
      </div>
    </section>
  );
} 