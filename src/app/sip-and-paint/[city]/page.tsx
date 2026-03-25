import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteConfig } from '@/lib/site-detection';
import { getListingPostsByCity } from '@/lib/airtable/content';
import { generateCityPageSchemas } from '@/lib/utils/schema';
import { buildCanonicalUrl } from '@/lib/utils/canonical-url';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Business, ListingPost } from '@/types/airtable';
import {
  CurrencyEuroIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export const revalidate = 12 * 60 * 60;

// Supported cities — validated in generateStaticParams + page
const CITY_MAP: Record<string, string> = {
  amsterdam: 'Amsterdam',
  rotterdam: 'Rotterdam',
  utrecht: 'Utrecht',
  'den-haag': 'Den Haag',
  eindhoven: 'Eindhoven',
  groningen: 'Groningen',
};

const OTHER_CITIES = Object.keys(CITY_MAP);

interface Props {
  params: { city: string };
}

function getCityName(slug: string): string | null {
  return CITY_MAP[slug] ?? null;
}

export async function generateStaticParams() {
  return Object.keys(CITY_MAP).map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = getCityName(params.city);
  if (!cityName) return { title: 'Niet gevonden' };

  const headersList = headers();
  const host = headersList.get('host') || '';

  try {
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    if (!site) return { title: `Sip & Paint ${cityName}` };

    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const canonicalUrl = `${siteUrl}/sip-and-paint/${params.city}`;
    const metaTitle = `Sip & Paint ${cityName} - Workshops & Evenementen | ${site.Name}`;
    const metaDescription = `Ontdek de beste sip and paint workshops en evenementen in ${cityName}. Vergelijk aanbieders, prijzen en locaties voor jouw perfecte schilderervaring.`;

    // Fetch city posts for schema
    const cityPosts = await getListingPostsByCity(cityName, site.id!);
    const cityBusinesses = extractUniqueCityBusinesses(cityName, cityPosts);

    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Sip & Paint', href: '/sip-and-paint' },
      { label: cityName },
    ];

    const schemas = generateCityPageSchemas(cityName, params.city, cityBusinesses, site, breadcrumbs);

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'website',
        url: canonicalUrl,
      },
      other: {
        ...schemas.reduce((acc, schema, index) => {
          acc[`json-ld-${index}`] = JSON.stringify(schema);
          return acc;
        }, {} as Record<string, string>),
      },
    };
  } catch {
    return { title: `Sip & Paint ${cityName}` };
  }
}

/**
 * Collect unique businesses from listing posts that are active in the given city.
 */
function extractUniqueCityBusinesses(cityName: string, posts: ListingPost[]): Business[] {
  const seen = new Set<string>();
  const businesses: Business[] = [];
  const cityLower = cityName.toLowerCase();

  for (const post of posts) {
    if (!Array.isArray(post.BusinessDetails)) continue;
    for (const biz of post.BusinessDetails as Business[]) {
      const isInCity = Array.isArray(biz.Cities) &&
        biz.Cities.some((c) => c.toLowerCase() === cityLower);
      if (isInCity && biz.Competitor && !seen.has(biz.Competitor)) {
        seen.add(biz.Competitor);
        businesses.push(biz);
      }
    }
  }

  return businesses;
}

export default async function CityPage({ params }: Props) {
  const cityName = getCityName(params.city);
  if (!cityName) notFound();

  const headersList = headers();
  const host = headersList.get('host') || '';

  const siteConfig = await getSiteConfig(host).catch(() => null);
  const site = siteConfig?.site;
  if (!site?.id) notFound();

  const cityPosts = await getListingPostsByCity(cityName, site.id);
  const cityBusinesses = extractUniqueCityBusinesses(cityName, cityPosts);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Sip & Paint', href: '/sip-and-paint' },
    { label: cityName },
  ];

  const otherCities = OTHER_CITIES.filter((c) => c !== params.city);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* Hero */}
      <h1
        className="text-3xl font-bold mb-4"
        style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
      >
        Sip &amp; Paint {cityName}
      </h1>

      <p
        className="text-lg mb-10"
        style={{ color: 'var(--muted-color)', fontFamily: 'var(--font-body)' }}
      >
        Op zoek naar een gezellige sip and paint avond in {cityName}? Hieronder vind je alle aanbieders in de stad — inclusief prijzen, groepsgroottes en boekingslinks.
      </p>

      {/* Businesses */}
      {cityBusinesses.length > 0 ? (
        <section className="mb-12">
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
          >
            Aanbieders in {cityName}
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {cityBusinesses.map((biz, index) => (
              <BusinessCityCard key={biz.id || index} business={biz} rank={index + 1} />
            ))}
          </div>
        </section>
      ) : (
        <p
          className="mb-12 text-base"
          style={{ color: 'var(--muted-color)', fontFamily: 'var(--font-body)' }}
        >
          Op dit moment zijn er nog geen aanbieders gevonden voor {cityName}. Bekijk de blog voor meer sip and paint gidsen.
        </p>
      )}

      {/* Relevant listing posts */}
      {cityPosts.length > 0 && (
        <section className="mb-12">
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
          >
            Gidsen &amp; Lijstjes voor {cityName}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cityPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.Slug}`}
                className="block rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                }}
              >
                {post['Featured image']?.[0]?.url && (
                  <div className="relative h-44 w-full">
                    <Image
                      src={getProxiedImageUrl(post['Featured image'][0].url)}
                      alt={post['Featured image alt text'] || post.Title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3
                    className="font-semibold text-base mb-1"
                    style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
                  >
                    {post.Title}
                  </h3>
                  {post.Excerpt && (
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: 'var(--muted-color)', fontFamily: 'var(--font-body)' }}
                    >
                      {post.Excerpt}
                    </p>
                  )}
                  <span
                    className="mt-3 inline-block text-sm font-medium"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    Lees meer →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-12">
        <h2
          className="text-2xl font-semibold mb-6"
          style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
        >
          Veelgestelde vragen over Sip &amp; Paint in {cityName}
        </h2>

        <div className="space-y-4">
          {[
            {
              q: `Wat kost een sip and paint avond in ${cityName}?`,
              a: `De prijzen variëren per aanbieder, maar gemiddeld betaal je tussen de €25 en €60 per persoon in ${cityName}. De prijs is inclusief materialen en een welkomstdrankje.`,
            },
            {
              q: `Heb ik tekenvaardigheid nodig voor sip and paint in ${cityName}?`,
              a: `Nee, absoluut niet! Sip and paint is voor iedereen. Een ervaren instructeur begeleidt je stap voor stap door het schilderproces — van beginner tot gevorderde.`,
            },
            {
              q: `Kan ik een privé-evenement boeken in ${cityName}?`,
              a: `Veel aanbieders in ${cityName} bieden privé-evenementen aan voor bedrijfsuitjes, vrijgezellenfeesten of verjaardagen. Vraag naar de opties via de website van de aanbieder.`,
            },
            {
              q: `Hoe lang duurt een sip and paint workshop in ${cityName}?`,
              a: `Een standaard sip and paint workshop duurt gemiddeld 2 tot 3 uur. Inclusief een welkomsdrankje, schilderen onder begeleiding en gezelligheid.`,
            },
          ].map((item, i) => (
            <details
              key={i}
              className="border rounded-lg p-4"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <summary
                className="font-semibold cursor-pointer"
                style={{ color: 'var(--text-color)' }}
              >
                {item.q}
              </summary>
              <p
                className="mt-3 text-sm"
                style={{ color: 'var(--muted-color)' }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Cross-links to other cities */}
      <section>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
        >
          Sip &amp; Paint in andere steden
        </h2>
        <div className="flex flex-wrap gap-3">
          {otherCities.map((slug) => (
            <Link
              key={slug}
              href={`/sip-and-paint/${slug}`}
              className="px-4 py-2 rounded-full border text-sm font-medium hover:shadow-sm transition-shadow"
              style={{
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {CITY_MAP[slug]}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function BusinessCityCard({ business, rank }: { business: Business; rank: number }) {
  const image = business.Image?.[0];

  return (
    <div
      className="border rounded-xl p-6 flex gap-5 shadow-sm hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Rank */}
      <div className="flex-shrink-0">
        <span
          className="w-10 h-10 rounded-full text-lg font-bold flex items-center justify-center"
          style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
        >
          {rank}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
            >
              {business.Competitor}
            </h3>

            {/* Quick facts */}
            <div
              className="flex flex-wrap gap-4 text-sm mb-3"
              style={{ color: 'var(--muted-color)' }}
            >
              {business.Price != null && (
                <span className="flex items-center gap-1">
                  <CurrencyEuroIcon className="h-4 w-4" />
                  Vanaf €{business.Price}
                </span>
              )}
              {business['Duration (minutes)'] && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {business['Duration (minutes)']} min
                </span>
              )}
              {business['Group size (maximum)'] && (
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  Max {business['Group size (maximum)']} personen
                </span>
              )}
              {business.Cities && business.Cities.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {business.Cities.join(', ')}
                </span>
              )}
            </div>

            {business.Information && (
              <p
                className="text-sm line-clamp-3 mb-4"
                style={{ color: 'var(--muted-color)' }}
              >
                {business.Information}
              </p>
            )}

            {business.Website && (
              <a
                href={business.Website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--primary-color)' }}
              >
                <GlobeAltIcon className="h-4 w-4" />
                Bezoek website
              </a>
            )}
          </div>

          {/* Image */}
          {image?.url && (
            <div className="flex-shrink-0 hidden sm:block">
              <div className="relative w-28 h-28 rounded-lg overflow-hidden">
                <Image
                  src={getProxiedImageUrl(image.url)}
                  alt={business.Competitor}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
