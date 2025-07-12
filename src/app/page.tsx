import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { getBlogPostsBySiteId, getListingPostsBySiteId, getHomepageContent } from '@/lib/airtable/content';
import { generateHomepageSchemas } from '@/lib/utils/schema';
import Homepage from '@/components/homepage/Homepage';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      return { title: 'Home' };
    }

    // Generate schema markup for homepage
    const schemas = generateHomepageSchemas(site);

    return {
      title: site['Default meta title'] || site.Name || 'Home',
      description: site['Default meta description'] || `Welcome to ${site.Name}`,
      openGraph: {
        title: site['Default meta title'] || site.Name || 'Home',
        description: site['Default meta description'] || `Welcome to ${site.Name}`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: site['Default meta title'] || site.Name || 'Home',
        description: site['Default meta description'] || `Welcome to ${site.Name}`,
      },
      other: {
        // Add JSON-LD schema markup
        ...schemas.reduce((acc, schema, index) => {
          acc[`json-ld-${index}`] = JSON.stringify(schema);
          return acc;
        }, {} as Record<string, string>)
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
