'use client';

import { useEffect } from 'react';

interface GoogleTagManagerProps {
  gtmId?: string;
}

const INTERACTION_EVENTS = ['pointerdown', 'scroll', 'keydown', 'touchstart'] as const;
const FALLBACK_DELAY_MS = 8000;

function loadGtm(gtmId: string) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
}

export function GoogleTagManagerScript({ gtmId }: GoogleTagManagerProps) {
  useEffect(() => {
    if (!gtmId) return;

    let loaded = false;

    const load = () => {
      if (loaded) return;
      loaded = true;
      window.clearTimeout(timeoutId);
      INTERACTION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, load);
      });
      loadGtm(gtmId);
    };

    const timeoutId = window.setTimeout(load, FALLBACK_DELAY_MS);
    INTERACTION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, load, { once: true, passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      INTERACTION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, load);
      });
    };
  }, [gtmId]);

  return null;
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
