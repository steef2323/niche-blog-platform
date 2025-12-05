/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,
  
  images: {
    domains: [
      'v5.airtableusercontent.com',
      'dl.airtable.com',
      'airtable.com'
    ],
    // Prefer AVIF over WebP for better compression (smaller file sizes)
    formats: ['image/avif', 'image/webp'],
    // Enable image optimization
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for optimized images
  },
};

module.exports = nextConfig; 