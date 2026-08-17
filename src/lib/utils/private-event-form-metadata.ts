import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getSiteConfig } from '@/lib/site-detection';
import { getLanguageText, getPrivateEventFormH1 } from '@/lib/utils/language-text';
import { buildCanonicalUrl, withCanonicalOrigin } from '@/lib/utils/canonical-url';

export async function generatePrivateEventFormMetadata(
  formPath: string,
  fallbackLanguage: 'en' | 'nl'
): Promise<Metadata> {
  const host = headers().get('host') || '';
  const fallback = getLanguageText(fallbackLanguage);

  try {
    const siteConfig = await getSiteConfig(host);
    if (!siteConfig?.site) {
      return {
        title: getPrivateEventFormH1(undefined, fallbackLanguage),
        description: fallback.privateEventPageDescription,
      };
    }

    const site = withCanonicalOrigin(siteConfig.site, host);
    const language = site.Language || fallbackLanguage;
    const t = getLanguageText(language);

    return {
      title: getPrivateEventFormH1(site.Name, language),
      description: t.privateEventPageDescription,
      alternates: {
        canonical: buildCanonicalUrl(site['Site URL'], site.Domain, formPath, host),
      },
    };
  } catch (error) {
    console.error('Error generating private event form metadata:', error);
    return {
      title: getPrivateEventFormH1(undefined, fallbackLanguage),
      description: fallback.privateEventPageDescription,
    };
  }
}
