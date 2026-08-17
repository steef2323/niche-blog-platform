/**
 * Image URL helpers for Airtable attachments.
 *
 * Always serve Airtable files through /api/image-proxy. Passing the signed
 * Airtable URL to next/image makes Vercel Image Optimization return
 * 400 INVALID_IMAGE_OPTIMIZE_REQUEST, which shows as broken card images.
 * Proxied srcs use unoptimized next/image so the browser hits the proxy
 * directly (one hop, no /_next/image).
 */

export function isAirtableUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('airtableusercontent.com') ||
      urlObj.hostname.includes('dl.airtable.com')
    );
  } catch {
    return url.includes('airtableusercontent.com') || url.includes('dl.airtable.com');
  }
}

export function isProxiedImageSrc(src: string): boolean {
  if (!src) return false;
  const queryIndex = src.indexOf('?');
  const path = queryIndex === -1 ? src : src.slice(0, queryIndex);
  return path.includes('/api/image-proxy');
}

/**
 * Convert an Airtable CDN URL to a same-origin proxy URL.
 * Already-proxied and non-Airtable URLs are returned as-is.
 */
export function getProxiedImageUrl(airtableUrl: string | undefined | null): string {
  if (!airtableUrl) return '';

  if (isProxiedImageSrc(airtableUrl) || !isAirtableUrl(airtableUrl)) {
    return airtableUrl;
  }

  return `/api/image-proxy?url=${encodeURIComponent(airtableUrl)}`;
}

export function getContentImageProps(url: string | undefined | null): {
  src: string;
  unoptimized: boolean;
} {
  const src = getProxiedImageUrl(url);
  return {
    src,
    unoptimized: isProxiedImageSrc(src),
  };
}

export function getProxiedImageUrls(urls: (string | undefined | null)[]): string[] {
  return urls
    .filter((url): url is string => !!url)
    .map((url) => getProxiedImageUrl(url));
}

export function batchProxiedImageUrls(urls: string[]): string[] {
  return urls.map((url) => getProxiedImageUrl(url));
}
