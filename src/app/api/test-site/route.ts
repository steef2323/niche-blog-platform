import { NextResponse } from 'next/server';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { getBlogPostsBySiteId, getListingPostsBySiteId, getHomepageContent } from '@/lib/airtable/content';

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'site2.local';

    console.log(`=== TESTING SITE: ${domain} ===`);
    
    // Test site fetching
    const site = await getSiteByDomain(domain);
    console.log('Site fetched:', {
      found: !!site,
      id: site?.id,
      name: site?.Name,
      domain: site?.Domain,
      localDomain: site?.['Local domain']
    });
    
    if (!site || !site.id) {
      return NextResponse.json({
        error: 'No site found',
        domain: domain,
        site: site
      });
    }

    // Test features fetching
    const features = await getFeaturesBySiteId(site.id);
    console.log('Features fetched:', {
      count: features.length,
      features: features.map(f => ({ id: f.ID, name: f.Name }))
    });

    // Test homepage content fetching
    const homepageContent = await getHomepageContent(site.id);
    console.log('Homepage content fetched:', {
      found: !!homepageContent,
      title: homepageContent?.Title
    });

    // Test blog posts fetching
    const blogPosts = await getBlogPostsBySiteId(site.id, 5);
    console.log('Blog posts fetched:', {
      count: blogPosts.length,
      posts: blogPosts.map(p => ({ id: p.ID, title: p.Title }))
    });

    // Test listing posts fetching
    const listingPosts = await getListingPostsBySiteId(site.id, 5);
    console.log('Listing posts fetched:', {
      count: listingPosts.length,
      posts: listingPosts.map(p => ({ id: p.ID, title: p.Title }))
    });

    return NextResponse.json({
      success: true,
      domain: domain,
      data: {
        site: {
          id: site.id,
          name: site.Name,
          domain: site.Domain,
          localDomain: site['Local domain'],
          primaryColor: site['Primary color'],
          secondaryColor: site['Secondary color'],
          accentColor: site['Accent color']
        },
        features: features.map(f => ({ id: f.ID, name: f.Name })),
        homepageContent: homepageContent ? {
          title: homepageContent.Title,
          hasImage: !!homepageContent['Featured image']?.[0],
          content: homepageContent.Content?.substring(0, 100) + '...'
        } : null,
        blogPosts: blogPosts.map(p => ({ id: p.ID, title: p.Title })),
        listingPosts: listingPosts.map(p => ({ id: p.ID, title: p.Title }))
      }
    });

  } catch (error) {
    console.error('Test site API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 