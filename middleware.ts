import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedirectUrl } from '@/lib/redirects';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  
  // Check for redirects on blog post routes
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    const slug = pathname.split('/blog/')[1]?.split('?')[0]; // Remove query params
    
    if (slug) {
      try {
        console.log(`🔍 Middleware checking redirect for: ${pathname} (slug: ${slug}, host: ${host})`);
        const redirectUrl = await getRedirectUrl(host, slug);
        
        if (redirectUrl) {
          // Handle redirect URL
          let targetUrl: string;
          
          if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
            // External redirect
            targetUrl = redirectUrl;
          } else if (redirectUrl.startsWith('/')) {
            // Internal absolute path
            targetUrl = new URL(redirectUrl, request.url).toString();
          } else {
            // Internal relative path (assume blog post slug)
            targetUrl = new URL(`/blog/${redirectUrl}`, request.url).toString();
          }
          
          console.log(`🔄 Middleware redirect: ${pathname} → ${targetUrl}`);
          return NextResponse.redirect(targetUrl, 307); // 307 = Temporary Redirect
        } else {
          console.log(`✅ No redirect found in middleware for: ${slug}`);
        }
      } catch (error) {
        // If redirect check fails, continue with normal request
        console.error(`❌ Error checking redirect for ${pathname}:`, error);
      }
    }
  }
  
  // Continue with normal request
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (CSP) for enhanced security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://www.googletagmanager.com; " +
    "frame-src 'self' https://www.googletagmanager.com;"
  );
  
  // Performance: Cache-Control headers for static assets
  if (pathname.startsWith('/_next/static/')) {
    // Static assets from Next.js build (immutable)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/_next/image/')) {
    // Optimized images from Next.js Image component
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/)) {
    // Static images in public folder
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    // API routes: no cache by default (can be overridden per route)
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

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