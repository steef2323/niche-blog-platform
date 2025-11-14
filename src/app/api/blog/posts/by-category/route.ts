import { NextRequest, NextResponse } from 'next/server';
import { getCombinedPostsByCategorySlug } from '@/lib/airtable/content';
import { getSiteConfig } from '@/lib/site-detection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug');
    const siteId = searchParams.get('siteId');
    const limit = searchParams.get('limit');

    if (!categorySlug || !siteId) {
      return NextResponse.json(
        { error: 'Category slug and site ID are required' },
        { status: 400 }
      );
    }

    // Get site config to retrieve Airtable view names
    const host = request.headers.get('host') || '';
    const siteConfig = await getSiteConfig(host);
    const airtableViews = siteConfig?.airtableViews;

    // Get combined blog and listing posts for this category using views if available
    const posts = await getCombinedPostsByCategorySlug(
      categorySlug,
      siteId,
      limit ? parseInt(limit) : undefined,
      airtableViews?.blogPosts,
      airtableViews?.listingPosts
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 