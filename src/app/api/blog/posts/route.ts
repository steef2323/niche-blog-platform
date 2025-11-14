import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsBySiteId, getListingPostsBySiteId } from '@/lib/airtable/content';
import { getSiteConfig } from '@/lib/site-detection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const prioritizePopular = searchParams.get('prioritizePopular') === 'true';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Get site config to retrieve Airtable view names
    const host = request.headers.get('host') || '';
    const siteConfig = await getSiteConfig(host);
    const airtableViews = siteConfig?.airtableViews;

    // Get both blog posts and listing posts using views if available
    const [blogPosts, listingPosts] = await Promise.all([
      getBlogPostsBySiteId(siteId, undefined, airtableViews?.blogPosts),
      getListingPostsBySiteId(siteId, undefined, airtableViews?.listingPosts)
    ]);

    // Combine posts
    const allPosts = [
      ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
      ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
    ];

    let sortedPosts;
    if (prioritizePopular) {
      // Sort with popular posts first, then by published date
      sortedPosts = allPosts.sort((a, b) => {
        // Check if posts are popular (only blog posts can be popular)
        const aIsPopular = a.type === 'blog' && (a as any).Popular === true;
        const bIsPopular = b.type === 'blog' && (b as any).Popular === true;
        
        // If one is popular and the other isn't, popular comes first
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        
        // If both are popular or both are not popular, sort by published date
        const dateA = new Date(a['Published date'] || '').getTime();
        const dateB = new Date(b['Published date'] || '').getTime();
        return dateB - dateA;
      });
    } else {
      // Sort only by published date (most recent first)
      sortedPosts = allPosts.sort((a, b) => {
        const dateA = new Date(a['Published date'] || '').getTime();
        const dateB = new Date(b['Published date'] || '').getTime();
        return dateB - dateA;
      });
    }

    // Apply pagination
    const paginatedPosts = sortedPosts.slice(offset, offset + limit);

    return NextResponse.json(paginatedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
} 