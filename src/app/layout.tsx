import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { headers } from 'next/headers';
import { SiteProvider } from '@/contexts/site';
import { ThemeProvider } from '@/contexts/theme';
import { getSiteConfig } from '@/lib/site-detection';
import BaseLayout from '@/components/layout/BaseLayout';
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from '@/components/common/GoogleTagManager';
import AsyncStylesheet from '@/components/common/AsyncStylesheet';
import PageViewTracker from '@/components/common/PageViewTracker';
import { getFaviconPath } from '@/lib/utils/asset-paths';
import {
  fontFamilyValue,
  googleFontStylesheetUrl,
  uniqueNonInterFonts,
} from '@/lib/utils/fonts';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: true,
});

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
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    console.log('🔍 Single site detection call for host:', host);
    const siteConfig = await getSiteConfig(host);
    console.log('✅ Site config fetched:', siteConfig ? 'success' : 'not found');

    const site = siteConfig?.site || null;
    const siteLanguage = site?.Language?.toLowerCase() || 'en';
    const gtmId = site?.['Google Tag Manager ID'];
    const extraGoogleFonts = uniqueNonInterFonts(
      site?.['Heading font'],
      site?.['Body font'],
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 GTM ID:', gtmId || 'NOT FOUND');
      if (!gtmId) {
        console.warn('⚠️ GTM ID is missing for site:', site?.Domain || host);
      }
    }

    return (
      <html lang={siteLanguage} className={inter.variable}>
        <head>
          {extraGoogleFonts.length > 0 && (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              {extraGoogleFonts.map((font) => {
                const href = googleFontStylesheetUrl(font);
                return (
                  <link key={`preload-font-${font}`} rel="preload" as="style" href={href} crossOrigin="anonymous" />
                );
              })}
              <noscript>
                {extraGoogleFonts.map((font) => (
                  <link
                    key={`noscript-font-${font}`}
                    rel="stylesheet"
                    href={googleFontStylesheetUrl(font)}
                    crossOrigin="anonymous"
                  />
                ))}
              </noscript>
              {extraGoogleFonts.map((font) => (
                <AsyncStylesheet key={`font-${font}`} href={googleFontStylesheetUrl(font)} />
              ))}
            </>
          )}

          <style dangerouslySetInnerHTML={{ __html:
            `:root{--font-heading:${fontFamilyValue(site?.['Heading font'])};--font-body:${fontFamilyValue(site?.['Body font'])};}`
          }} />

          {site && (
            <link
              rel="alternate"
              type="application/rss+xml"
              title={site.Name || host}
              href={`${(site['Site URL'] || `https://${host}`).replace(/\/$/, '')}/feed.xml`}
            />
          )}
        </head>
        <body>
          <GoogleTagManagerNoscript gtmId={gtmId} />
          {gtmId ? <GoogleTagManagerScript gtmId={gtmId} /> : null}
          <SiteProvider siteConfig={siteConfig}>
            <ThemeProvider site={site}>
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
    return (
      <html lang="en" className={inter.variable}>
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
