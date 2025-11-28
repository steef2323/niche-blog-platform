import { NextRequest, NextResponse } from 'next/server';
import { getListingPostBySlug } from '@/lib/airtable/content';
import { getLocationById } from '@/lib/airtable/content';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'most-fun-clay-workshops-in-amsterdam';
    const viewName = searchParams.get('view') || 'sipandpaints.nl';

    console.log(`Debug: Fetching listing post ${slug} using view ${viewName}`);
    
    // First, get the raw record directly from Airtable
    const rawRecords = await base(TABLES.LISTING_POSTS)
      .select({
        filterByFormula: `{Slug} = "${slug}"`,
        maxRecords: 1,
      })
      .firstPage();
    
    if (rawRecords.length === 0) {
      return NextResponse.json({ 
        message: 'No listing post found in Airtable',
        slug
      }, { status: 404 });
    }
    
    const rawRecord = rawRecords[0];
    const businessIds = rawRecord.fields.Businesses as string[] || [];
    
    // Fetch locations directly
    const locations = await Promise.all(
      businessIds.map(async (id, index) => {
        const loc = await getLocationById(id);
        return {
          index,
          id,
          found: !!loc,
          price: loc?.Price,
          address: loc?.Address,
          website: loc?.Website,
          googleMapsLink: loc?.['Google maps link'],
          cityWebsitePage: loc?.['City website page'],
          artInstructorFromBusiness: loc?.['Art instructor (from Business)'],
          languageFromBusiness: loc?.['Language  (from Business)'],
          privateEventFromBusiness: loc?.['Private event possible? (from Business)'],
          groupSizeFromBusiness: loc?.['Group size (maximum) (from Business)'],
          rawFields: loc ? Object.keys(loc) : []
        };
      })
    );

    return NextResponse.json({
      message: 'Listing post found',
      title: rawRecord.fields.Title,
      slug: rawRecord.fields.Slug,
      siteField: rawRecord.fields.Site,
      businessesField: businessIds,
      locationsCount: locations.length,
      locations
    }, { status: 200 });

  } catch (error) {
    console.error('Error in debug-listing-full:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch listing post',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

