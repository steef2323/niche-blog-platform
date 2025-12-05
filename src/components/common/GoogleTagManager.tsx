'use client';

import { useEffect } from 'react';

interface GoogleTagManagerProps {
  gtmId?: string;
}

export function GoogleTagManagerScript({ gtmId }: GoogleTagManagerProps) {
  useEffect(() => {
    // Log GTM ID for debugging
    if (process.env.NODE_ENV === 'development') {
      if (gtmId) {
        console.log('✅ GTM ID loaded:', gtmId);
      } else {
        console.warn('⚠️ GTM ID is missing - check Airtable "Google Tag Manager ID" field');
      }
    }
  }, [gtmId]);

  if (!gtmId) {
    return null;
  }

  // Standard GTM implementation - must be in <head> as regular script
  // Initialize dataLayer and load GTM script synchronously
  const gtmScript = `
    window.dataLayer = window.dataLayer || [];
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;

  return (
    <script
      id="google-tag-manager"
      dangerouslySetInnerHTML={{
        __html: gtmScript,
      }}
    />
  );
}

export function GoogleTagManagerNoscript({ gtmId }: GoogleTagManagerProps) {
  if (!gtmId) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
} 