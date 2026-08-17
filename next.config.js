/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,
  
  // Disable source maps in production to hide code structure
  productionBrowserSourceMaps: false,
  
  images: {
    // Airtable photos are served via /api/image-proxy (see ContentImage).
    // Do not add Airtable hosts here — /_next/image returns
    // INVALID_IMAGE_OPTIMIZE_REQUEST (400) for those signed URLs.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for optimized images
  },
};

module.exports = nextConfig;
