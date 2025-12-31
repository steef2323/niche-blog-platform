/**
 * API Protection Middleware Utilities
 * 
 * Protects debug/test endpoints from being accessed in production.
 * These endpoints could reveal infrastructure details.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * List of debug/test endpoints that should be blocked in production
 */
const PROTECTED_ENDPOINTS = [
  '/api/test-',
  '/api/debug-',
  '/api/fetch-all-sites',
  '/api/list-tables',
  '/api/create-',
  '/api/fix-',
  '/api/update-',
  '/api/test-airtable',
  '/api/test-blog-content',
  '/api/test-markdown',
  '/api/test-site',
  '/api/test-static-config',
  '/api/test-structure',
  '/api/test-types',
];

/**
 * Check if a pathname matches a protected endpoint pattern
 */
function isProtectedEndpoint(pathname: string): boolean {
  return PROTECTED_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Check if we're in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Protect debug/test endpoints in production
 * Returns a 404 response if accessed in production
 */
export function protectDebugEndpoints(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // Only protect in production
  if (!isProduction()) {
    return null; // Allow in development
  }
  
  // Check if this is a protected endpoint
  if (isProtectedEndpoint(pathname)) {
    // Return 404 to hide the endpoint exists
    return new NextResponse('Not Found', { status: 404 });
  }
  
  return null; // Not a protected endpoint, allow through
}

