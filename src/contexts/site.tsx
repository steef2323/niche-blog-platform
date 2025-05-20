'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Site } from '@/types/airtable';

interface SiteContextType {
  site: Site | null;
  isLoading: boolean;
  error: Error | null;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

interface SiteProviderProps {
  site: Site | null;
  children: ReactNode;
}

export function SiteProvider({ site, children }: SiteProviderProps) {
  return (
    <SiteContext.Provider 
      value={{
        site,
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
  const { site } = useSite();
  if (!site) return [];
  return site.Features || [];
}

export function useSitePages() {
  const { site } = useSite();
  if (!site) return [];
  return site.Pages || [];
} 