import { NextRequest, NextResponse } from 'next/server';
import { getAllPublishedContent, getSiteDataOptimized } from '@/lib/airtable/bulk-fetchers';
import contentCache from '@/lib/airtable/content-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    console.log(`🚀 Optimized site data request for domain: ${domain}`);
    const startTime = Date.now();

    // Try to get bulk data from cache first
    const cacheKey = 'bulk-content';
    let bulkData = contentCache.get(cacheKey);
    
    // If not in cache, fetch and cache
    if (!bulkData) {
      console.log('📡 Cache miss - fetching bulk content from Airtable');
      bulkData = await getAllPublishedContent();
      contentCache.set(cacheKey, bulkData);
    } else {
      console.log('⚡ Cache hit - using cached bulk content');
    }

    // Get site-specific data using efficient filtering
    const siteData = await getSiteDataOptimized(domain, bulkData);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`✅ Optimized site data response completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      data: siteData,
      performance: {
        totalTime: `${totalTime}ms`,
        cached: !!contentCache.get(cacheKey),
        cacheStats: contentCache.getStats()
      }
    });

  } catch (error) {
    console.error('❌ Error in optimized site data endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 