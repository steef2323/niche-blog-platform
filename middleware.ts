import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers - OWASP Best Practices
  const securityHeaders = {
    // Content Security Policy - Prevents XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),

    // X-Frame-Options - Prevents clickjacking
    'X-Frame-Options': 'DENY',

    // X-Content-Type-Options - Prevents MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // X-XSS-Protection - Additional XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy - Controls referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy - Controls browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'serial=()',
      'sync-xhr=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', '),

    // Strict-Transport-Security - Enforces HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Cache Control - Optimizes caching for SEO
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',

    // ETag - Helps with caching
    'ETag': `"${Date.now()}"`,

    // Vary - Helps with caching
    'Vary': 'Accept-Encoding, User-Agent',

    // X-Powered-By - Remove server information
    'X-Powered-By': '',

    // X-DNS-Prefetch-Control - Controls DNS prefetching
    'X-DNS-Prefetch-Control': 'on',

    // X-Download-Options - Prevents IE from executing downloads
    'X-Download-Options': 'noopen',

    // X-Permitted-Cross-Domain-Policies - Controls cross-domain policies
    'X-Permitted-Cross-Domain-Policies': 'none',

    // Cross-Origin-Embedder-Policy - Controls cross-origin embedding
    'Cross-Origin-Embedder-Policy': 'require-corp',

    // Cross-Origin-Opener-Policy - Controls cross-origin opening
    'Cross-Origin-Opener-Policy': 'same-origin',

    // Cross-Origin-Resource-Policy - Controls cross-origin resources
    'Cross-Origin-Resource-Policy': 'same-origin'
  };

  // Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  // Additional SEO-friendly headers
  const seoHeaders = {
    // X-Robots-Tag - Controls search engine crawling
    'X-Robots-Tag': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',

    // Link - Preload critical resources
    'Link': [
      '</_next/static/css/app/layout.css>; rel=preload; as=style',
      '</_next/static/chunks/main-app.js>; rel=preload; as=script'
    ].join(', ')
  };

  // Add SEO headers
  Object.entries(seoHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 