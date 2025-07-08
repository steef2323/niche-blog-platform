import { NextResponse } from 'next/server';
import { testBusinessesTable, testListingPostsTable } from '@/lib/airtable/test-types';

export async function GET() {
  try {
    console.log('Starting structure investigation...');
    
    // Test both the Businesses table and updated Listing Posts table
    const businesses = await testBusinessesTable();
    const listingPosts = await testListingPostsTable();
    
    return NextResponse.json({
      success: true,
      message: 'Structure investigation completed successfully',
      data: {
        businesses: businesses,
        listingPosts: listingPosts,
        businessesCount: businesses.length,
        listingPostsCount: listingPosts.length
      }
    });

  } catch (error) {
    console.error('Error during structure investigation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 