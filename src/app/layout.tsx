import type { Metadata } from "next";
import "./globals.css";
import { headers } from 'next/headers';
import { SiteProvider } from '@/contexts/site';
import { ThemeProvider } from '@/contexts/theme';
import { getSiteConfig } from '@/lib/site-detection';
import BaseLayout from '@/components/layout/BaseLayout';
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from '@/components/common/GoogleTagManager';
import GoogleFonts from '@/components/common/GoogleFonts';
import PageViewTracker from '@/components/common/PageViewTracker';
import { getFaviconPath } from '@/lib/utils/asset-paths';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site || null;
    const faviconPath = site ? getFaviconPath(site.Domain || host) : '/favicon.ico';
    
    return {
      icons: {
        icon: faviconPath,
        shortcut: faviconPath,
        apple: faviconPath,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      icons: {
        icon: '/favicon.ico',
      },
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the host from headers
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // SINGLE site detection call - fetches everything in parallel
    console.log('🔍 Single site detection call for host:', host);
    const siteConfig = await getSiteConfig(host);
    console.log('✅ Site config fetched:', siteConfig ? 'success' : 'not found');

    const site = siteConfig?.site || null;
    const siteLanguage = site?.Language?.toLowerCase() || 'en';
    const gtmId = site?.['Google Tag Manager ID'];

    // Log GTM ID retrieval for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 GTM ID from Airtable:', gtmId || 'NOT FOUND');
      if (!gtmId) {
        console.warn('⚠️ GTM ID is missing - check Airtable "Google Tag Manager ID" field for site:', site?.Domain || host);
      }
    }

    return (
      <html lang={siteLanguage}>
        <head>
          {/* Performance: Preconnect to external domains for faster resource loading */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          
          {/* Performance: DNS prefetch for image CDN domains */}
          <link rel="dns-prefetch" href="https://v5.airtableusercontent.com" />
          <link rel="dns-prefetch" href="https://dl.airtable.com" />
          
          <GoogleTagManagerScript gtmId={gtmId} />
        </head>
        <body>
          <GoogleTagManagerNoscript gtmId={gtmId} />
          <SiteProvider siteConfig={siteConfig}>
            <ThemeProvider site={site}>
              <GoogleFonts />
              <PageViewTracker />
              <BaseLayout>
              {children}
              </BaseLayout>
            </ThemeProvider>
          </SiteProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Error in root layout:', error);
    // Return a basic error layout
    return (
      <html lang="en"> {/* Fallback language */}
        <body>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Site</h1>
            <p>There was an error loading the site configuration. Please try again later.</p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
                {error instanceof Error ? error.message : 'Unknown error'}
              </pre>
            )}
          </div>
        </body>
      </html>
    );
  }
}
