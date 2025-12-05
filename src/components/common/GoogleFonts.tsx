'use client';

import { useSite } from '@/contexts/site';
import { useEffect } from 'react';

interface GoogleFontsProps {
  className?: string;
}

export default function GoogleFonts({ className = '' }: GoogleFontsProps) {
  const { site } = useSite();

  useEffect(() => {
    if (!site) return;

    const headingFont = site['Heading font'];
    const bodyFont = site['Body font'];

    // Remove existing font links
    const existingLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    existingLinks.forEach(link => link.remove());

    // Function to generate Google Fonts URL for any font
    const generateFontUrl = (fontName: string): string => {
      // Handle special cases for fonts that need specific parameters
      const fontNameEncoded = encodeURIComponent(fontName);
      
      // Default weights for most fonts - reduced to only essential weights for performance
      const weights = '400;600;700';
      
      // Special handling for monospace fonts
      if (fontName.toLowerCase().includes('mono')) {
        return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@400;600;700&display=swap`;
      }
      
      // Special handling for serif fonts
      if (fontName.toLowerCase().includes('serif') || fontName.toLowerCase().includes('times')) {
        return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@400;600;700&display=swap`;
      }
      
      // Default for sans-serif fonts
      return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@${weights}&display=swap`;
    };

    // Add new font links with optimized loading strategy
    const fontsToLoad = new Set([headingFont, bodyFont]);
    
    fontsToLoad.forEach(font => {
      if (font && font.trim()) {
        // Use preload for critical fonts to reduce layout shift
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'style';
        preloadLink.href = generateFontUrl(font);
        preloadLink.crossOrigin = 'anonymous';
        
        // Create the actual stylesheet link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = generateFontUrl(font);
        link.crossOrigin = 'anonymous';
        link.media = 'print'; // Load async using media print trick
        link.onload = function() {
          // @ts-ignore
          this.media = 'all'; // Switch to all media after load
        };
        
        // Append preload first, then stylesheet
        document.head.appendChild(preloadLink);
        document.head.appendChild(link);
        
        // Fallback for browsers that don't support preload
        const noscript = document.createElement('noscript');
        const fallbackLink = document.createElement('link');
        fallbackLink.rel = 'stylesheet';
        fallbackLink.href = generateFontUrl(font);
        noscript.appendChild(fallbackLink);
        document.head.appendChild(noscript);
        
        // Log for debugging
        console.log(`⚡ Optimized font loading: ${font}`);
      }
    });

    // Update CSS variables with proper font family names
    if (headingFont) {
      document.documentElement.style.setProperty('--font-heading', `'${headingFont}', system-ui, -apple-system, sans-serif`);
    }
    if (bodyFont) {
      document.documentElement.style.setProperty('--font-body', `'${bodyFont}', system-ui, -apple-system, sans-serif`);
    }
  }, [site]);

  return null; // This component doesn't render anything
} 