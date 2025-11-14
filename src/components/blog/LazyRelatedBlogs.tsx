'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/types/airtable';
import { getBlogTitle, getBlogExcerpt, getContentForReadingTime } from '@/lib/utils/structured-content';
import { calculateReadingTime } from '@/lib/utils/reading-time';

interface LazyRelatedBlogsProps {
  relatedBlogs: BlogPost[];
}

export default function LazyRelatedBlogs({ relatedBlogs }: LazyRelatedBlogsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    console.log('LazyRelatedBlogs mounted with', relatedBlogs.length, 'blogs');
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('LazyRelatedBlogs section is now visible, loading content');
            setIsVisible(true);
            setHasLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before the section comes into view
        threshold: 0.1
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, relatedBlogs.length]);

  if (relatedBlogs.length === 0) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="mt-16"
    >
      <h2 
        className="text-3xl font-bold mb-8"
        style={{ 
          color: 'var(--text-color)',
          fontFamily: 'var(--font-heading)'
        }}
      >
        Other blogs
      </h2>
      
      {isVisible ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedBlogs.map((relatedPost) => {
            const relatedTitle = getBlogTitle(relatedPost);
            const relatedExcerpt = getBlogExcerpt(relatedPost);
            const relatedReadingTime = (() => {
              const content = getContentForReadingTime(relatedPost);
              return content ? calculateReadingTime(content) : null;
            })();
            const relatedPublishDate = relatedPost['Published date'] 
              ? new Date(relatedPost['Published date']).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : null;

            return (
              <article key={relatedPost.id || relatedPost.Slug} className="group">
                <Link href={`/blog/${relatedPost.Slug}`} className="block">
                  {/* Featured Image */}
                  <div 
                    className="aspect-[4/3] relative mb-4 overflow-hidden rounded-lg"
                    style={{ backgroundColor: 'var(--secondary-color)' }}
                  >
                    {relatedPost['Featured image']?.[0] ? (
                      <Image
                        src={relatedPost['Featured image'][0].url}
                        alt={relatedTitle}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        quality={75}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(to bottom right, var(--secondary-color), var(--border-color))`,
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{ color: 'var(--muted-color)' }}
                        >
                          No image
                        </span>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {relatedPost.CategoryDetails && (
                      <div className="absolute top-4 left-4">
                        <Link
                          href={`/blog/category/${relatedPost.CategoryDetails.Slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block px-3 py-1 text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                          style={{ 
                            backgroundColor: 'var(--accent-color)',
                            color: 'var(--text-color)'
                          }}
                        >
                          {relatedPost.CategoryDetails.Name}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div>
                    {/* Title */}
                    <h3 
                      className="text-xl font-semibold mb-3 line-clamp-2 group-hover:opacity-80 transition-opacity duration-200"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {relatedTitle}
                    </h3>

                    {/* Excerpt */}
                    {relatedExcerpt && (
                      <p 
                        className="mb-4 line-clamp-3 leading-relaxed"
                        style={{ 
                          color: 'var(--text-color)',
                          fontFamily: 'var(--font-body)',
                          opacity: 0.8
                        }}
                      >
                        {relatedExcerpt}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div 
                      className="flex flex-wrap items-center gap-3 text-sm"
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-body)',
                        opacity: 0.7
                      }}
                    >
                      {relatedPublishDate && (
                        <span>{relatedPublishDate}</span>
                      )}
                      {relatedReadingTime && (
                        <span>{relatedReadingTime} min read</span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        // Placeholder/skeleton while loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedBlogs.map((_, index) => (
            <div key={index} className="animate-pulse">
              <div 
                className="aspect-[4/3] rounded-lg mb-4"
                style={{ backgroundColor: 'var(--border-color)' }}
              ></div>
              <div 
                className="h-6 rounded mb-3"
                style={{ backgroundColor: 'var(--border-color)' }}
              ></div>
              <div 
                className="h-4 rounded mb-2"
                style={{ backgroundColor: 'var(--border-color)' }}
              ></div>
              <div 
                className="h-4 rounded w-3/4"
                style={{ backgroundColor: 'var(--border-color)' }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

