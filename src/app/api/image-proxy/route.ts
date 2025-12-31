import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API Route
 * 
 * Proxies images from Airtable CDN to hide the relationship between sites.
 * 
 * Usage: /api/image-proxy?url={encoded_airtable_url}
 * 
 * Benefits:
 * - All images served from your own domain (no Airtable CDN visible)
 * - Better SEO (images appear to be hosted on your domain)
 * - Hides infrastructure relationships between sites
 * - Proper caching headers for performance
 */

// Cache duration: 30 days (images rarely change)
const CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// Allowed domains for security (only allow Airtable CDN domains)
const ALLOWED_DOMAINS = [
  'v5.airtableusercontent.com',
  'dl.airtable.com',
  'airtableusercontent.com',
];

/**
 * Check if URL is from an allowed domain
 */
function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get('url');

    if (!encodedUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Decode the URL
    let imageUrl: string;
    try {
      imageUrl = decodeURIComponent(encodedUrl);
    } catch (error) {
      return new NextResponse('Invalid URL encoding', { status: 400 });
    }

    // Security check: Only allow Airtable CDN domains
    if (!isAllowedDomain(imageUrl)) {
      // Don't log the full URL in production to avoid revealing infrastructure
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Blocked image proxy request for non-allowed domain:', imageUrl);
      }
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Fetch the image from Airtable
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/*',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!imageResponse.ok) {
      // Only log details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to fetch image:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
        });
      }
      return new NextResponse('Failed to fetch image', { 
        status: imageResponse.status || 500 
      });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper caching headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache for 30 days (images rarely change)
        'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`,
        // Allow CORS if needed
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });

  } catch (error) {
    // Only log full error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error in image proxy:', error);
    }
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse('Request timeout', { status: 504 });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

