'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Tracks page views for Google Tag Manager
 * Pushes page_view events to dataLayer on route changes
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ensure dataLayer exists
    if (typeof window === 'undefined') {
      return;
    }

    // Initialize dataLayer if it doesn't exist
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Get full URL
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Push page view event to dataLayer
    window.dataLayer.push({
      event: 'page_view',
      page_path: pathname,
      page_url: url,
      page_title: typeof document !== 'undefined' ? document.title : '',
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GTM Page View:', { pathname, url });
    }
  }, [pathname, searchParams]);

  return null;
}

