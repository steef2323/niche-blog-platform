import Image, { ImageProps } from 'next/image';
import { getContentImageProps } from '@/lib/utils/image-proxy';

/**
 * next/image wrapper for CMS/Airtable photos.
 * Routes Airtable URLs through /api/image-proxy and skips /_next/image
 * so Vercel cannot return INVALID_IMAGE_OPTIMIZE_REQUEST.
 * Local paths (logos, etc.) still go through the optimizer.
 */
export default function ContentImage({ src, unoptimized, ...rest }: ImageProps) {
  if (typeof src !== 'string') {
    return <Image {...rest} src={src} unoptimized={unoptimized} />;
  }

  const proxied = getContentImageProps(src);

  return (
    <Image
      {...rest}
      src={proxied.src}
      unoptimized={unoptimized ?? proxied.unoptimized}
    />
  );
}
