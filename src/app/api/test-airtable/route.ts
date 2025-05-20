import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/airtable/sites';

export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Airtable test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 