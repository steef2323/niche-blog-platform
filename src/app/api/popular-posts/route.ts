import { NextRequest, NextResponse } from 'next/server';
import { getPopularBlogPosts } from '@/lib/airtable/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 3;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const popularPosts = await getPopularBlogPosts(siteId, limit);
    
    return NextResponse.json(popularPosts);
  } catch (error) {
    console.error('Error in popular posts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular posts' },
      { status: 500 }
    );
  }
} 