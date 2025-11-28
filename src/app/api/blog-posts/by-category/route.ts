import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsByCategoryExcludingPopular } from '@/lib/airtable/content';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const siteId = searchParams.get('siteId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (!categoryId || !siteId) {
      return NextResponse.json(
        { error: 'Category ID and Site ID are required' },
        { status: 400 }
      );
    }

    // Fetch posts and category info, excluding popular posts
    const [posts, categoryInfo] = await Promise.all([
      getBlogPostsByCategoryExcludingPopular(categoryId, siteId, limit),
      getCategoryInfo(categoryId)
    ]);
    
    return NextResponse.json({
      posts,
      category: categoryInfo
    });
  } catch (error) {
    console.error('Error in blog posts by category API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts by category' },
      { status: 500 }
    );
  }
}

async function getCategoryInfo(categoryId: string) {
  try {
    const categoryRecord = await base(TABLES.CATEGORIES).find(categoryId);
    return { ...categoryRecord.fields, id: categoryRecord.id };
  } catch (error) {
    console.warn('Could not fetch category info:', error);
    return { Name: 'Category', Slug: 'category', id: categoryId };
  }
} 