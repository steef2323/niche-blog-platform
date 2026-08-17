/**
 * Canonical URL utilities
 * Ensures canonical URLs are properly normalized and consistent
 */

type SiteLike = {
  'Site URL'?: string;
  Domain?: string;
};

function hostnameFromHost(requestHost?: string | null): string {
  return (requestHost || '')
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}

function isLocalHostname(hostname: string): boolean {
  return !hostname || hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Preferred public origin for canonicals, sitemaps, and schema.
 * Uses the request host in production so www vs non-www matches the URL
 * Vercel actually serves (apex sipandpaints.nl 307s to www).
 */
export function getCanonicalOrigin(
  requestHost?: string | null,
  siteUrl?: string,
  domain?: string
): string {
  const hostname = hostnameFromHost(requestHost);

  if (!isLocalHostname(hostname)) {
    return `https://${hostname}`;
  }

  let origin = siteUrl || (domain ? `https://${domain}` : '');
  origin = origin.replace(/\/$/, '');

  if (origin && !origin.startsWith('http://') && !origin.startsWith('https://')) {
    origin = `https://${origin}`;
  } else if (origin.startsWith('http://')) {
    origin = origin.replace('http://', 'https://');
  }

  return origin;
}

export function withCanonicalOrigin<T extends SiteLike>(site: T, requestHost?: string | null): T {
  return {
    ...site,
    'Site URL': getCanonicalOrigin(requestHost, site['Site URL'], site.Domain),
  };
}

/**
 * Normalize a canonical URL to ensure consistency
 * - Always uses HTTPS
 * - Removes trailing slashes (except for homepage which should have one)
 */
export function normalizeCanonicalUrl(url: string, isHomepage: boolean = false): string {
  if (!url) return url;

  let normalized = url.replace(/^https?:\/\//, '');
  normalized = `https://${normalized}`;
  normalized = normalized.replace(/\/$/, '');

  if (isHomepage) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

/**
 * Build a canonical URL from the live request host (production) or site config.
 */
export function buildCanonicalUrl(
  siteUrl: string | undefined,
  domain: string,
  path: string = '',
  requestHost?: string | null
): string {
  let origin = getCanonicalOrigin(requestHost, siteUrl, domain).replace(/\/$/, '');

  if (path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${cleanPath}`;
  }

  return `${origin}/`;
}
