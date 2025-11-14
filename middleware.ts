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

  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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