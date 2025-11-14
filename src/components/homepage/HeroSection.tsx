'use client';

import { useSite } from '@/contexts/site';
import { Page } from '@/types/airtable';
import Image from 'next/image';

interface HeroSectionProps {
  homePage: Page | null;
}

export default function HeroSection({ homePage }: HeroSectionProps) {
  const { site } = useSite();

  if (!homePage || !site) {
    return null;
  }

  const featuredImage = homePage['Featured image']?.[0];
  const title = homePage.Title;
  const backgroundColor = site['Background color'];

  const accentColor = site['Accent color'];
  
  return (
    <section 
      className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden"
      style={{ 
        background: `linear-gradient(to bottom, ${accentColor}, ${backgroundColor})`
      }}
    >
      {/* Background Image Container - Full Section Height */}
      {featuredImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-[1140px] h-full rounded-xl overflow-hidden">
            <Image
              src={featuredImage.url}
              alt={title || 'Hero image'}
              fill
              className="object-cover"
              priority // Hero image: always preload for LCP
              quality={75} // Compress for web
              // Next.js automatically serves WebP/AVIF if supported
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 text-center h-full flex items-center justify-center py-20 md:py-32">
        <div>
          <h1 
            className="text-4xl md:text-6xl font-bold text-white leading-tight px-4 mb-8"
            style={{ 
              fontFamily: `var(--font-heading)`,
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
            }}
          >
            {title}
          </h1>
          {/* Hero Button */}
          {homePage['Button text'] && (
            <div className="px-4">
              <a 
                href={homePage['Button url'] || '#'} 
                className="btn-primary"
              >
                {homePage['Button text']}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 