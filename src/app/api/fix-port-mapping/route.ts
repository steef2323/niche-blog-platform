import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Update the site mappings to fix the port assignments
    const updates = [
      // Make "sip and paints" site (with content) use localhost:3000
      {
        id: 'recORZQLJbwzLsVU0', // "sip and paints" site ID
        fields: {
          'Local domain': 'localhost:3000'
        }
      },
      // Make the empty site use localhost:3001  
      {
        id: 'rec7GVK5RkxjkHKaa', // Empty site ID
        fields: {
          'Local domain': 'localhost:3001'
        }
      }
    ];

    console.log('Fixing port mappings...');
    console.log('Setting "sip and paints" (recORZQLJbwzLsVU0) to localhost:3000');
    console.log('Setting empty site (rec7GVK5RkxjkHKaa) to localhost:3001');

    // Update both records
    await base(TABLES.SITES).update(updates);

    console.log('Port mapping fix completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Port mappings fixed! localhost:3000 now shows sip and paints content',
      updates: [
        'localhost:3000 → "sip and paints" (with content)',
        'localhost:3001 → Empty site'
      ]
    });
  } catch (error) {
    console.error('Error fixing port mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fix port mappings', details: error },
      { status: 500 }
    );
  }
} 