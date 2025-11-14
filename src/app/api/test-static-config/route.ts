import { NextRequest, NextResponse } from 'next/server';
import { getStaticSiteConfig, getStaticSiteConfigFromAirtable } from '@/config/sites';

/**
 * Test endpoint to fetch static site configuration from Airtable
 * 
 * Usage:
 * GET /api/test-static-config?domain=sipandpaints.nl
 * GET /api/test-static-config?domain=localhost:3000
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required. Example: ?domain=sipandpaints.nl' },
        { status: 400 }
      );
    }
    
    console.log(`🧪 Testing static site config fetch for domain: ${domain}`);
    const startTime = Date.now();
    
    // Fetch from Airtable
    const config = await getStaticSiteConfigFromAirtable(domain);
    
    const endTime = Date.now();
    const fetchTime = endTime - startTime;
    
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: `No site found for domain: ${domain}`,
          performance: {
            fetchTime: `${fetchTime}ms`
          }
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      domain,
      config: {
        domain: config.domain,
        localDomain: config.localDomain,
        siteId: config.siteId,
        colors: config.colors,
        fonts: config.fonts,
        logo: config.logo,
        footerText: config.footerText,
        airtableViews: config.airtableViews,
        analytics: config.analytics,
      },
      performance: {
        fetchTime: `${fetchTime}ms`,
        cached: fetchTime < 50 // If very fast, likely cached
      },
      note: {
        images: 'Logo URL is fetched from Airtable attachment. You can use Airtable URLs directly, or download and host locally for better performance.',
        cache: 'Config is cached for 30 days. Changes in Airtable will appear after cache expires or is cleared. Use clearStaticSiteConfigCache() to force refresh.'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test-static-config API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch static site config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

