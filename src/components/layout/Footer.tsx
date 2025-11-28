'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSite, useSitePages } from '@/contexts/site';
import { Category, Page } from '@/types/airtable';
import { getLogoPath } from '@/lib/utils/asset-paths';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const { site } = useSite();
  const pages = useSitePages(); // Use hook to get pages from context
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site?.id) return;

    const fetchFooterData = async () => {
      try {
        // Fetch categories for footer navigation
        const categoriesRes = await fetch(`/api/categories?siteId=${site.id}`);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, [site?.id]);

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
              
              {/* Other pages - including Work with us and Sip and Paint Amsterdam */}
              {pages
                .filter(page => {
                  if (!page.Published || !page.Slug || !page.Title) return false;
                  
                  const slugLower = page.Slug?.toLowerCase() || '';
                  const titleLower = page.Title?.toLowerCase() || '';
                  
                  // Exclude home pages
                  if (slugLower === 'home' || page.Page === 'Home') return false;
                  
                  // Always include Work with us (check various possible formats)
                  const isWorkWithUs = slugLower.includes('work') && slugLower.includes('us') ||
                                       titleLower.includes('work') && titleLower.includes('us');
                  
                  // Always include Sip and Paint Amsterdam (check various possible formats)
                  const isSipAndPaintAmsterdam = (slugLower.includes('sip') && slugLower.includes('paint') && slugLower.includes('amsterdam')) ||
                                                 (titleLower.includes('sip') && titleLower.includes('paint') && titleLower.includes('amsterdam'));
                  
                  if (isWorkWithUs || isSipAndPaintAmsterdam) {
                    return true;
                  }
                  
                  // Exclude Amsterdam page (but not Sip and Paint Amsterdam)
                  if (slugLower === 'amsterdam' && !titleLower.includes('sip') && !titleLower.includes('paint')) {
                    return false;
                  }
                  
                  // Include all other published pages
                  return true;
                })
                .sort((a, b) => {
                  // Sort: Work with us first, then Sip and Paint Amsterdam, then alphabetically
                  const aSlug = a.Slug?.toLowerCase() || '';
                  const aTitle = a.Title?.toLowerCase() || '';
                  const bSlug = b.Slug?.toLowerCase() || '';
                  const bTitle = b.Title?.toLowerCase() || '';
                  
                  const aIsWorkWithUs = (aSlug.includes('work') && aSlug.includes('us')) ||
                                       (aTitle.includes('work') && aTitle.includes('us'));
                  const aIsSipAndPaint = (aSlug.includes('sip') && aSlug.includes('paint') && aSlug.includes('amsterdam')) ||
                                        (aTitle.includes('sip') && aTitle.includes('paint') && aTitle.includes('amsterdam'));
                  const bIsWorkWithUs = (bSlug.includes('work') && bSlug.includes('us')) ||
                                       (bTitle.includes('work') && bTitle.includes('us'));
                  const bIsSipAndPaint = (bSlug.includes('sip') && bSlug.includes('paint') && bSlug.includes('amsterdam')) ||
                                        (bTitle.includes('sip') && bTitle.includes('paint') && bTitle.includes('amsterdam'));
                  
                  if (aIsWorkWithUs && !bIsWorkWithUs && !bIsSipAndPaint) return -1;
                  if (bIsWorkWithUs && !aIsWorkWithUs && !aIsSipAndPaint) return 1;
                  if (aIsSipAndPaint && !bIsSipAndPaint && !bIsWorkWithUs) return -1;
                  if (bIsSipAndPaint && !aIsSipAndPaint && !aIsWorkWithUs) return 1;
                  
                  // Alphabetical for others
                  return (a.Title || '').localeCompare(b.Title || '');
                })
                .map((page) => (
                  <li key={page.id || page.Slug}>
                    <Link 
                      href={`/${page.Slug}`}
                      className="text-sm hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {page.Title === 'Blog overview' ? 'Blog' : page.Title}
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
      <div className="py-4 relative">
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ 
            backgroundColor: 'var(--text-color)',
            opacity: 0.2
          }}
        />
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