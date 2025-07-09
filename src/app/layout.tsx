import type { Metadata } from "next";
import "./globals.css";
import { headers } from 'next/headers';
import { SiteProvider } from '@/contexts/site';
import { ThemeProvider } from '@/contexts/theme';
import { getSiteByDomain } from '@/lib/airtable/sites';
import BaseLayout from '@/components/layout/BaseLayout';
import { GoogleTagManagerScript, GoogleTagManagerNoscript } from '@/components/common/GoogleTagManager';
import GoogleFonts from '@/components/common/GoogleFonts';

export const metadata: Metadata = {
  title: "Multi-site Framework",
  description: "A framework for deploying multiple websites from Airtable data",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the host from headers
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // Get the site data
    console.log('Fetching site data for host:', host);
    const site = await getSiteByDomain(host);
    console.log('Site data fetched:', site ? 'success' : 'not found');

    return (
      <html lang="en">
        <head>
          <GoogleTagManagerScript gtmId={site?.['Google Tag Manager ID']} />
        </head>
        <body>
          <GoogleTagManagerNoscript gtmId={site?.['Google Tag Manager ID']} />
          <SiteProvider site={site}>
            <ThemeProvider site={site}>
              <GoogleFonts />
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
      <html lang="en">
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
