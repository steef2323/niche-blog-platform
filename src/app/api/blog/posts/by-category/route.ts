import { NextRequest, NextResponse } from 'next/server';
import { getCombinedPostsByCategorySlug } from '@/lib/airtable/content';

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

    // Get combined blog and listing posts for this category
    const posts = await getCombinedPostsByCategorySlug(
      categorySlug,
      siteId,
      limit ? parseInt(limit) : undefined
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