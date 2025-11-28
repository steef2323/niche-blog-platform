import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('id') || 'recyZZrQ5U3ybpGRH';

    console.log(`Fetching location with ID: ${locationId}`);
    
    const locationRecord = await base(TABLES.LOCATIONS).find(locationId);
    
    // Get all field names from the record
    const allFields = Object.keys(locationRecord.fields);

    // Format the response to show field names and sample values
    const fieldInfo = allFields.map(fieldName => ({
      fieldName,
      value: locationRecord.fields[fieldName],
      type: Array.isArray(locationRecord.fields[fieldName])
        ? 'array'
        : typeof locationRecord.fields[fieldName]
    }));

    return NextResponse.json({
      message: `Found location with ID: ${locationId}`,
      totalFields: allFields.length,
      fields: fieldInfo,
      record: {
        id: locationRecord.id,
        fields: locationRecord.fields
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch location',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

