import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to fetch all sites from Airtable with their full configuration
 * Useful for populating sites.ts with actual site data
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active sites
    const sites = await base(TABLES.SITES)
      .select({
        filterByFormula: '{Active} = "Active"',
        sort: [{ field: 'ID', direction: 'asc' }]
      })
      .all();
    
    const siteData = sites.map(site => {
      const fields = site.fields as any;
      const language = fields.Language?.toLowerCase() || 'en';
      const isDutch = language === 'dutch' || language === 'nl' || language === 'nederlands';
      
      // Determine language-specific text
      const languageText = {
        privateEventButton: isDutch ? 'Boek evenement' : 'Book private event',
        contactUs: isDutch ? 'Contact ons' : 'Contact us',
        pages: isDutch ? 'Pagina\'s' : 'Pages',
        blog: 'Blog', // Same in both languages
        allArticles: isDutch ? 'Alle artikelen' : 'All Articles',
        home: isDutch ? 'Home' : 'Home', // Same in both languages
        sitemap: 'Sitemap' // Same in both languages
      };
      
      return {
        id: site.id,
        name: fields.Name || 'Unnamed Site',
        domain: fields.Domain,
        localDomain: fields['Local domain'] || undefined,
        language: fields.Language || 'English',
        languageCode: language,
        siteId: site.id,
        
        // Theme colors
        colors: {
          primary: fields['Primary color'] || '#000000',
          secondary: fields['Secondary color'] || '#666666',
          accent: fields['Accent color'] || '#000000',
          background: fields['Background color'] || '#FFFFFF',
          text: fields['Text color'] || '#333333',
        },
        
        // Fonts
        fonts: {
          heading: fields['Heading font'] || 'Inter',
          body: fields['Body font'] || 'Inter',
        },
        
        // Logo
        logo: {
          url: fields['Site logo']?.[0]?.url || '',
          alt: fields['Site logo alt text'] || fields.Name || 'Site Logo',
          title: fields['Site logo title'] || fields.Name || 'Site Logo',
        },
        
        // Footer content
        footerText: fields['Footer text'] || undefined,
        instagram: fields['Instagram'] || undefined,
        emailContact: fields['Email contact'] || undefined,
        
        // Analytics
        analytics: {
          googleAnalyticsId: fields['Google analytics ID'] || undefined,
          googleTagManagerId: fields['Google Tag Manager ID'] || undefined,
        },
        
        // Language-specific text
        languageText,
        
        // Airtable views (these should be configured per site)
        airtableViews: {
          blogPosts: fields.Domain || undefined,
          listingPosts: fields.Domain || undefined,
          pages: fields.Domain || undefined,
          categories: fields.Domain || undefined,
          authors: fields.Domain || undefined,
          features: fields.Domain || undefined,
        }
      };
    });

    return NextResponse.json({
      sites: siteData,
      totalSites: sites.length,
      message: 'Use this data to populate sites.ts. Copy the site configurations and add them to staticSiteConfigs object.'
    });
  } catch (error) {
    console.error('Error fetching all sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

