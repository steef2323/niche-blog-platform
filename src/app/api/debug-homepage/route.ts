import { NextResponse } from 'next/server';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { getBlogPostsBySiteId, getListingPostsBySiteId, getHomepageContent } from '@/lib/airtable/content';

export async function GET() {
  try {
    console.log('=== DEBUG HOMEPAGE DATA FETCHING ===');
    
    // Test site fetching
    const site = await getSiteByDomain('localhost:3001');
    console.log('Site fetched:', {
      found: !!site,
      id: site?.id,
      name: site?.Name,
      features: site?.Features?.length || 0
    });

    if (!site || !site.id) {
      return NextResponse.json({
        error: 'No site found',
        site: site
      });
    }

    // Test features fetching
    console.log('Fetching features for site ID:', site.id);
    const features = await getFeaturesBySiteId(site.id);
    console.log('Features fetched:', {
      count: features.length,
      features: features.map(f => ({ id: f.ID, name: f.Name }))
    });

    // Test homepage content fetching
    console.log('Fetching homepage content for site ID:', site.id);
    const homepageContent = await getHomepageContent(site.id);
    console.log('Homepage content fetched:', {
      found: !!homepageContent,
      title: homepageContent?.Title
    });

    // Test blog posts fetching
    console.log('Fetching blog posts for site ID:', site.id);
    const blogPosts = await getBlogPostsBySiteId(site.id, 5);
    console.log('Blog posts fetched:', {
      count: blogPosts.length,
      posts: blogPosts.map(p => ({ id: p.ID, title: p.Title }))
    });

    // Test listing posts fetching
    console.log('Fetching listing posts for site ID:', site.id);
    const listingPosts = await getListingPostsBySiteId(site.id, 5);
    console.log('Listing posts fetched:', {
      count: listingPosts.length,
      posts: listingPosts.map(p => ({ id: p.ID, title: p.Title }))
    });

    return NextResponse.json({
      success: true,
      data: {
        site: {
          id: site.id,
          name: site.Name,
          domain: site.Domain
        },
        features: features.map(f => ({ id: f.ID, name: f.Name })),
        homepageContent: homepageContent ? {
          title: homepageContent.Title,
          hasImage: !!homepageContent['Featured image']?.[0]
        } : null,
        blogPosts: blogPosts.map(p => ({ id: p.ID, title: p.Title })),
        listingPosts: listingPosts.map(p => ({ id: p.ID, title: p.Title }))
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 