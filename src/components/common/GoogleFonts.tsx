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
      
      // Default weights for most fonts
      const weights = '300;400;500;600;700';
      
      // Special handling for monospace fonts
      if (fontName.toLowerCase().includes('mono')) {
        return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@300;400;500;600;700&display=swap`;
      }
      
      // Special handling for serif fonts
      if (fontName.toLowerCase().includes('serif') || fontName.toLowerCase().includes('times')) {
        return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@300;400;500;600;700&display=swap`;
      }
      
      // Default for sans-serif fonts
      return `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@${weights}&display=swap`;
    };

    // Add new font links
    const fontsToLoad = new Set([headingFont, bodyFont]);
    
    fontsToLoad.forEach(font => {
      if (font && font.trim()) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = generateFontUrl(font);
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        // Log for debugging
        console.log(`Loading Google Font: ${font}`);
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