import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsBySiteId } from '@/lib/airtable/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const blogPosts = await getBlogPostsBySiteId(siteId, limit);
    
    return NextResponse.json(blogPosts);
  } catch (error) {
    console.error('Error in blog posts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
} 