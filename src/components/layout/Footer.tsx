'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSite } from '@/contexts/site';
import { Category, Page } from '@/types/airtable';
import { getLogoPath } from '@/lib/utils/asset-paths';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const { site } = useSite();
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site?.id) return;

    const fetchFooterData = async () => {
      try {
        // Fetch categories and pages for footer navigation
        const [categoriesRes, pagesRes] = await Promise.all([
          fetch(`/api/categories?siteId=${site.id}`),
          // We'll get pages from the site context since they're already loaded
          Promise.resolve(site.Pages || [])
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        // Filter and prepare pages data
        const pagesData = Array.isArray(pagesRes) ? pagesRes : [];
        setPages(pagesData as Page[]);
      } catch (error) {
        console.error('Error fetching footer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, [site?.id, site?.Pages]);

  if (!site || loading) {
    return null;
  }

  return (
    <footer 
      className={className}
      style={{ backgroundColor: 'var(--accent-color)' }}
    >
      
      <div className="site-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Blog Categories & Blog Overview (25%) */}
          <div className="md:col-span-1">
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Blog
            </h3>
            <ul className="space-y-2">
              {/* Blog overview link at the top */}
              <li>
                <Link 
                  href="/blog"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-color)' }}
                >
                  All Articles
                </Link>
              </li>
              
              {/* Blog category links */}
              {categories.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/blog/category/${category.Slug}`}
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {category.Name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: All Pages including Home (25%) */}
          <div className="md:col-span-1">
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Pages
            </h3>
            <ul className="space-y-2">
              {/* Home page link at the top */}
              <li>
                <Link 
                  href="/"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-color)' }}
                >
                  Home
                </Link>
              </li>
              
              {/* Other pages */}
              {pages
                .filter(page => {
                  // Filter out home pages and ensure published pages
                  return (
                    page.Published && 
                    page.Slug && 
                    page.Title && 
                    page.Slug.toLowerCase() !== 'home' &&
                    page.Page !== 'Home'
                  );
                })
                .map((page) => (
                  <li key={page.id || page.Slug}>
                    <Link 
                      href={`/${page.Slug}`}
                      className="text-sm hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {page.Title}
                    </Link>
                  </li>
                ))}
              
              {/* Sitemap link */}
              <li>
                <Link 
                  href="/sitemap.xml"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-color)' }}
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Logo and Footer Text (50%) */}
          <div className="md:col-span-2">
            {/* Site Logo */}
            <div className="mb-6">
              {(() => {
                // Use getLogoPath to prefer local files over Airtable URLs
                const logoUrl = getLogoPath(
                  site.Domain || '',
                  site['Site logo']?.[0]?.url
                );
                const logoAlt = site['Site logo alt text'] || site.Name || 'Site Logo';
                const logoTitle = site['Site logo title'] || site.Name;
                
                if (logoUrl && !logoUrl.includes('default-logo')) {
                  return (
                    <Image 
                      src={logoUrl}
                      alt={logoAlt}
                      title={logoTitle}
                      width={240}
                      height={48}
                      className="h-15 w-auto"
                      priority // Footer logo: always preload for LCP
                      quality={100} // High quality for crisp logos
                      // Next.js automatically serves WebP/AVIF if supported
                    />
                  );
                }
                
                return (
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {site.Name || 'Site Name'}
                  </div>
                );
              })()}
            </div>

            {/* Footer Text */}
            {site['Footer text'] && (
              <div 
                className="text-sm leading-relaxed max-w-2xl"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {site['Footer text']}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom bar with copyright */}
      <div 
        className="border-t py-4"
        style={{ 
          borderColor: 'var(--text-color)',
          borderOpacity: 0.2
        }}
      >
        <div className="site-container">
          <p 
            className="text-sm text-center"
            style={{ color: 'var(--text-color)' }}
          >
            © 2025 - Built & designed by B Influence
          </p>
        </div>
      </div>
    </footer>
  );
} 