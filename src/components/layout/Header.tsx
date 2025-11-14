'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSite, useSitePages, useSiteFeatures } from '@/contexts/site';
import { Feature, Page } from '@/types/airtable';
import { getLogoPath } from '@/lib/utils/asset-paths';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const pathname = usePathname();
  const { site } = useSite();
  const pages = useSitePages();
  const features = useSiteFeatures();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // Check if private event form feature is enabled
  const hasPrivateEventForm = features.some(
    feature => {
      // The feature record might contain only the ID, so we need to check if it's expanded
      if (typeof feature === 'object' && feature !== null) {
        return (feature as unknown as Feature).Name === 'Private event form';
      }
      return false;
    }
  );

  // Handle scroll event for potential header styling changes
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!site) return null;

  return (
    <header 
      className={`
        relative w-full py-4 
        ${hasScrolled ? 'shadow-sm' : ''} 
        transition-all duration-300
        ${className}
      `}
    >
      {/* Background using accent color */}
      <div 
        className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden" 
        style={{
          backgroundColor: 'var(--accent-color)'
        }}
      />

      <div className="header-container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            {(() => {
              // Use getLogoPath to prefer local files over Airtable URLs
              const logoUrl = getLogoPath(
                site.Domain || '',
                site['Site logo']?.[0]?.url
              );
              const logoAlt = site['Site logo alt text'] || site.Name || 'Site Logo';
              const logoTitle = site['Site logo title'] || site.Name || 'Site Logo';
              
              if (logoUrl && !logoUrl.includes('default-logo')) {
                return (
                  <Link href={`https://${site.Domain}/`}>
                    <Image 
                      src={logoUrl}
                      alt={logoAlt}
                      title={logoTitle}
                      width={240}
                      height={48}
                      className="h-12 w-auto"
                      priority // Logo: always preload for LCP
                      quality={100} // High quality for crisp logos
                      // Next.js automatically serves WebP/AVIF if supported
                    />
                  </Link>
                );
              }
              
              return (
                <Link 
                  href={`https://${site.Domain}/`} 
                  className="text-xl font-bold" 
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {site.Name || 'Site Name'}
                </Link>
              );
            })()}
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-8 mx-auto">
            {pages
              .filter(pageLink => {
                // Skip null or undefined pages
                if (!pageLink) return false;
                
                const page = pageLink as unknown as Page;
                
                // Filter out home pages and unpublished pages
                return (
                  page.Published && 
                  page.Slug && 
                  page.Title && 
                  page.Slug.toLowerCase() !== 'home' &&
                  page.Page !== 'Home'
                );
              })
              .map((pageLink) => {
                const page = pageLink as unknown as Page;
                const isActive = pathname === `/${page.Slug}`;
                
                return (
                  <Link 
                    key={`desktop-${page.id || page.Slug}`} 
                    href={`https://${site.Domain}/${page.Slug}`}
                    className={`
                      relative font-medium transition-colors
                      hover:opacity-80
                      ${isActive ? 'after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-current' : ''}
                    `}
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {page.Title}
                  </Link>
                );
              })}
          </nav>

          {/* Right Side - Private Event Button and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Private Event Form Button - Far right, only shown if feature is enabled */}
            {hasPrivateEventForm && (
              <Link 
                href="/private-event-form"
                className="btn-secondary hidden md:inline-flex"
              >
                Book private event
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden flex items-center"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-6 h-6"
                style={{ color: 'var(--text-color)' }}
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4">
            <nav className="flex flex-col space-y-4">
              {pages
                .filter(pageLink => {
                  // Skip null or undefined pages
                  if (!pageLink) return false;
                  
                  const page = pageLink as unknown as Page;
                  
                  // Filter out home pages and unpublished pages
                  return (
                    page.Published && 
                    page.Slug && 
                    page.Title && 
                    page.Slug.toLowerCase() !== 'home' &&
                    page.Page !== 'Home'
                  );
                })
                .map((pageLink) => {
                  const page = pageLink as unknown as Page;
                  const isActive = pathname === `/${page.Slug}`;
                  
                  return (
                    <Link 
                      key={`mobile-${page.id || page.Slug}`} 
                      href={`https://${site.Domain}/${page.Slug}`}
                      className={`
                        font-medium px-2 py-1 ${isActive ? 'font-bold' : ''}
                      `}
                      style={{ 
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-body)'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {page.Title}
                    </Link>
                  );
                })}
              
              {/* Mobile Private Event Form Button */}
              {hasPrivateEventForm && (
                <Link 
                  href="/private-event-form"
                  className="btn-secondary mt-2 w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Book private event
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 