'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Site, Page, Feature } from '@/types/airtable';
import { SiteConfig } from '@/lib/site-config';

interface SiteContextType {
  site: Site | null;
  siteId: string | null;
  pages: Page[];
  features: Feature[];
  homepageContent: Page | null;
  isLoading: boolean;
  error: Error | null;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

interface SiteProviderProps {
  siteConfig: SiteConfig | null;
  children: ReactNode;
}

export function SiteProvider({ siteConfig, children }: SiteProviderProps) {
  return (
    <SiteContext.Provider 
      value={{
        site: siteConfig?.site || null,
        siteId: siteConfig?.siteId || null,
        pages: siteConfig?.pages || [],
        features: siteConfig?.features || [],
        homepageContent: siteConfig?.homepageContent || null,
        isLoading: false,
        error: null
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}

// Helper hooks for common site data
export function useSiteTheme() {
  const { site } = useSite();
  if (!site) return null;

  return {
    primaryColor: site['Primary color'],
    secondaryColor: site['Secondary color'],
    accentColor: site['Accent color'],
    backgroundColor: site['Background color'],
    textColor: site['Text color'],
    headingFont: site['Heading font'],
    bodyFont: site['Body font']
  };
}

export function useSiteFeatures() {
  const { features } = useSite();
  return features;
}

export function useSitePages() {
  const { pages } = useSite();
  return pages;
}

export function useHomepageContent() {
  const { homepageContent } = useSite();
  return homepageContent;
} 