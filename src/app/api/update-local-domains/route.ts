import { NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export async function POST() {
  try {
    console.log('Updating local domains for port-based testing...');
    
    // Get all sites
    const sites = await base(TABLES.SITES)
      .select({
      })
      .all();

    console.log(`Found ${sites.length} sites to update`);

    const updates = [];
    
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const portNumber = 3000 + i; // Start from 3000, then 3001, 3002, etc.
      const localDomain = `localhost:${portNumber}`;
      
      console.log(`Updating site ${site.fields.Name} (ID: ${site.fields.ID}) to use ${localDomain}`);
      
      updates.push(
        base(TABLES.SITES).update(site.id, {
          'Local domain': localDomain
        })
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);
    
    console.log('All updates completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} sites with port-based local domains`,
      updates: results.map((result, index) => ({
        siteId: result.id,
        siteName: sites[index].fields.Name,
        localDomain: `localhost:${3000 + index}`
      }))
    });

  } catch (error) {
    console.error('Error updating local domains:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 