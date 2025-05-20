import { NextResponse } from 'next/server';
import { testTypes } from '@/lib/airtable/test-types';

export async function GET() {
  try {
    await testTypes();
    return NextResponse.json({ success: true, message: 'Type testing completed successfully' });
  } catch (error) {
    console.error('Error testing types:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 