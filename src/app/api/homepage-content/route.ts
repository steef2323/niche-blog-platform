import { NextRequest, NextResponse } from 'next/server';
import { getHomepageContent } from '@/lib/airtable/content';

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

    const homepageContent = await getHomepageContent(siteId);
    
    if (!homepageContent) {
      return NextResponse.json(
        { error: 'Homepage content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(homepageContent);
  } catch (error) {
    console.error('Error in homepage content API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
} 