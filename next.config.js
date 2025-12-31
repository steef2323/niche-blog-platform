/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,
  
  // Disable source maps in production to hide code structure
  productionBrowserSourceMaps: false,
  
  images: {
    // Note: Airtable domains removed - images are now proxied through /api/image-proxy
    // This hides infrastructure relationships between sites
    // The proxy route handles fetching from Airtable CDN
    // Images are served from the same origin via /api/image-proxy, so no remote patterns needed
    // Prefer AVIF over WebP for better compression (smaller file sizes)
    formats: ['image/avif', 'image/webp'],
    // Enable image optimization
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for optimized images
  },
};

module.exports = nextConfig; 