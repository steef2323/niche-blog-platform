import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || null;
    const limit = parseInt(searchParams.get('limit') || '1');

    let records;
    
    if (slug) {
      records = await base(TABLES.LISTING_POSTS)
        .select({
          filterByFormula: `{Slug} = "${slug}"`,
          maxRecords: 1,
        })
        .firstPage();
    } else {
      records = await base(TABLES.LISTING_POSTS)
        .select({
          maxRecords: limit,
        })
        .firstPage();
    }

    if (records.length === 0) {
      return NextResponse.json({ 
        message: 'No listing posts found',
        fields: []
      });
    }

    // Get all field names from the first record
    const firstRecord = records[0];
    const allFields = Object.keys(firstRecord.fields);
    
    // Format the response to show field names and sample values
    const fieldInfo = allFields.map(fieldName => ({
      fieldName,
      value: firstRecord.fields[fieldName],
      type: Array.isArray(firstRecord.fields[fieldName]) 
        ? 'array' 
        : typeof firstRecord.fields[fieldName]
    }));

    return NextResponse.json({
      message: `Found ${records.length} listing post(s)`,
      totalFields: allFields.length,
      fields: fieldInfo,
      sampleRecord: {
        id: firstRecord.id,
        fields: firstRecord.fields
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching listing post fields:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch listing post fields',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

