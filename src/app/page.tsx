import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-detection';
import { generateHomepageSchemas } from '@/lib/utils/schema';
import { buildCanonicalUrl } from '@/lib/utils/canonical-url';
import Homepage from '@/components/homepage/Homepage';

// Enable ISR with 12-hour revalidation (content changes ~2x/week)
// This dramatically reduces API calls by caching pages at the Next.js level
export const revalidate = 12 * 60 * 60; // 12 hours in seconds

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // Use centralized site detection - will use cache if already called in layout
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    
    if (!site) {
      return { title: 'Home' };
    }

    // Get homepage content for meta fields and review schema
    const homePage = siteConfig?.homepageContent || null;
    
    // Use Page meta fields with fallback to site defaults
    const metaTitle = homePage?.['Meta title'] || site['Default meta title'] || site.Name || 'Home';
    const metaDescription = homePage?.['Meta description'] || site['Default meta description'] || `Welcome to ${site.Name}`;
    
    // Build canonical URL - ensure it's normalized and has trailing slash for homepage
    // This ensures consistency and matches what Google expects
    const canonicalUrl = buildCanonicalUrl(site['Site URL'], site.Domain, '');

    // Generate schema markup for homepage (includes review if present)
    const schemas = generateHomepageSchemas(site, homePage || undefined);

    // Get Open Graph image from homepage featured image or site logo
    const ogImage = homePage?.['Featured image']?.[0]?.url || site['Site logo']?.[0]?.url;
    
    // Get hero image for LCP preload optimization
    const heroImage = homePage?.['Featured image']?.[0]?.url;

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'website',
        url: canonicalUrl,
        ...(ogImage && { images: [{ url: ogImage }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        ...(ogImage && { images: [ogImage] }),
      },
      other: {
        // Add JSON-LD schema markup
        ...schemas.reduce((acc, schema, index) => {
          acc[`json-ld-${index}`] = JSON.stringify(schema);
          return acc;
        }, {} as Record<string, string>),
        // Performance: Preload LCP (hero) image for faster initial paint
        ...(heroImage && {
          'preload-hero-image': `<link rel="preload" as="image" href="${heroImage}" fetchpriority="high" />`
        })
      }
    };
  } catch (error) {
    console.error('Error generating homepage metadata:', error);
    return { title: 'Home' };
  }
}

export default async function Home() {
  return <Homepage />;
}
