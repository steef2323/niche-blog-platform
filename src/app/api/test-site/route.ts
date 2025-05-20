import { NextResponse } from 'next/server';
import { getSiteByDomain } from '@/lib/airtable/sites';

export async function GET(request: Request) {
  // Get the domain from the query string
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  try {
    const site = await getSiteByDomain(domain);
    
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Site found',
      domain: domain,
      site: site
    });

  } catch (error) {
    console.error('Error in test-site route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 