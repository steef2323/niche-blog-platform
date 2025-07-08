import { headers } from 'next/headers';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { getBlogPostsBySiteId, getListingPostsBySiteId, getHomepageContent } from '@/lib/airtable/content';
import Homepage from '@/components/homepage/Homepage';

export default async function Home() {
  return <Homepage />;
}
