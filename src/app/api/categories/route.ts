import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesBySiteId } from '@/lib/airtable/content';
import { getSiteConfig } from '@/lib/site-detection';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site config to retrieve Airtable view names
    const host = request.headers.get('host') || '';
    const siteConfig = await getSiteConfig(host);
    const airtableViews = siteConfig?.airtableViews;

    const categories = await getCategoriesBySiteId(siteId, airtableViews?.categories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 