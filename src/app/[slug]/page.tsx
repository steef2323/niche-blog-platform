import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-detection';
import { getPageBySlug } from '@/lib/airtable/sites';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageContent from '@/components/pages/PageContent';
import { generateWebSiteSchema, generateOrganizationSchema } from '@/lib/utils/schema';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    if (!site?.id) {
      return { title: 'Page Not Found' };
    }

    // Get page data using views if available
    const page = await getPageBySlug(site.id, params.slug, siteConfig?.airtableViews?.pages);
    
    if (!page) {
      return { title: 'Page Not Found' };
    }

    // Use Page meta fields with fallbacks
    const metaTitle = page['Meta title'] || page.Title || site['Default meta title'] || 'Page';
    const metaDescription = page['Meta description'] || 
      (page.Content ? page.Content.substring(0, 160) + '...' : null) ||
      site['Default meta description'] || 
      '';
    
    // Build canonical URL
    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const canonicalUrl = `${siteUrl}/${params.slug}`;

    // Get Open Graph image from page featured image or site logo
    const ogImage = page['Featured image']?.[0]?.url || site['Site logo']?.[0]?.url;
    
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
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: 'Page' };
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // SINGLE site detection call - uses cache if already called in layout
    const siteConfig = await getSiteConfig(host);
    if (!siteConfig?.site?.id) {
      redirect('/');
    }

    const { site, siteId, airtableViews } = siteConfig;

    // Get page data using views if available
    const page = await getPageBySlug(siteId, params.slug, airtableViews?.pages);
    
    if (!page) {
      notFound();
    }

    // Don't render Home page here - it should use the homepage route
    if (page.Page === 'Home') {
      redirect('/');
    }

    // Build breadcrumbs
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: page.Title }
    ];

    // Generate schema markup
    const schemas = [
      generateWebSiteSchema(site),
      generateOrganizationSchema(site)
    ];

    return (
      <>
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas)
          }}
        />
        
        {/* Breadcrumbs - show at top if not using hero section */}
        {!page['Featured image']?.[0] && (
          <div className="site-container pt-8 pb-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        )}

        {/* Page Content using the same framework as homepage */}
        {/* Debug: Log page data */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `console.log('Page data passed to PageContent:', ${JSON.stringify({
                title: page.Title,
                hasHeader2: !!page['Header 2'],
                hasContent2: !!page['Content 2'],
                hasImage2: !!page['Featured image 2']?.[0],
                header2: page['Header 2'],
                content2: page['Content 2']?.substring(0, 50),
                image2: page['Featured image 2']?.[0]?.url
              })});`
            }}
          />
        )}
        <PageContent page={page} />
      </>
    );

  } catch (error) {
    console.error('Error loading page:', error);
    notFound();
  }
}

