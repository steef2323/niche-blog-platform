import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSiteByDomain } from '@/lib/airtable/sites';

// List of paths that don't need site resolution
const EXCLUDED_PATHS = [
  '/api/test-site',  // Our test endpoint
  '/favicon.ico',
  '/_next',         // Next.js internal routes
  '/api/test-types' // Our type testing endpoint
];

export async function middleware(request: NextRequest) {
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  const site = await getSiteByDomain(hostname);

  // Clone the response to modify headers
  const response = NextResponse.next();

  if (site) {
    // Add site data to headers for use in pages
    response.headers.set('x-site-id', site.ID.toString());
    response.headers.set('x-site-name', site.Name);
    
    // Add more headers as needed, but be careful with size limits
    // Store minimal data in headers, fetch full data in pages
  } else {
    console.warn(`No site found for hostname: ${hostname}`);
    // Still continue, getSiteByDomain will return fallback site
  }

  return response;
} 