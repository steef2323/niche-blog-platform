import { headers } from 'next/headers';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/site-detection';
import { generateWebSiteSchema, generateOrganizationSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/utils/schema';
import { buildCanonicalUrl } from '@/lib/utils/canonical-url';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 12 * 60 * 60;

// Supported cities
const CITIES = [
  { slug: 'amsterdam', name: 'Amsterdam', description: 'De bruisende hoofdstad met een levendig kunst- en cultuurscène.' },
  { slug: 'rotterdam', name: 'Rotterdam', description: 'Moderne architectuur en een diverse, creatieve gemeenschap.' },
  { slug: 'utrecht', name: 'Utrecht', description: 'Historische grachten en gezellige, intieme workshoplocaties.' },
  { slug: 'den-haag', name: 'Den Haag', description: 'Hofstad met verfijnde kunst- en culturele evenementen.' },
  { slug: 'eindhoven', name: 'Eindhoven', description: 'Design-hoofdstad van Nederland met innovatieve creatieve ruimtes.' },
  { slug: 'groningen', name: 'Groningen', description: 'Gezellige studentenstad met een rijke kunst- en muziekcultuur.' },
];

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';

  try {
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    if (!site) return { title: 'Sip & Paint per Stad' };

    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const canonicalUrl = `${siteUrl}/sip-and-paint`;
    const metaTitle = `Sip & Paint per Stad - Workshops & Evenementen | ${site.Name}`;
    const metaDescription = `Vind de beste sip and paint workshops in jouw stad. Kies uit Amsterdam, Rotterdam, Utrecht, Den Haag, Eindhoven en Groningen.`;

    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Sip & Paint per Stad' },
    ];

    const schemas = combineSchemas([
      generateWebSiteSchema(site),
      generateOrganizationSchema(site),
      generateBreadcrumbSchema(breadcrumbs, site),
    ]);

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
    return { title: 'Sip & Paint per Stad' };
  }
}

export default async function SipAndPaintIndexPage() {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const siteConfig = await getSiteConfig(host).catch(() => null);
  const site = siteConfig?.site;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Sip & Paint per Stad' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <h1
        className="text-3xl font-bold mb-4"
        style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
      >
        Sip &amp; Paint per Stad
      </h1>

      <p
        className="text-lg mb-10"
        style={{ color: 'var(--muted-color)', fontFamily: 'var(--font-body)' }}
      >
        Ontdek sip and paint workshops en evenementen in jouw stad. Kies hieronder een stad en bekijk de beschikbare aanbieders, prijzen en locaties.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={`/sip-and-paint/${city.slug}`}
            className="block rounded-xl border p-6 hover:shadow-md transition-shadow"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
            >
              {city.name}
            </h2>
            <p
              className="text-sm"
              style={{ color: 'var(--muted-color)' }}
            >
              {city.description}
            </p>
            <span
              className="mt-4 inline-block text-sm font-medium"
              style={{ color: 'var(--primary-color)' }}
            >
              Bekijk aanbieders →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
