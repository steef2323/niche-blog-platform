'use client';

import { useEffect, useState } from 'react';
import { useSite, useSiteFeatures } from '@/contexts/site';
import { Page, Feature } from '@/types/airtable';
import { PrivateEventForm } from '@/components/ui';
import { getPrivateEventFormH1 } from '@/lib/utils/language-text';

export default function PrivateEventFormPage() {
  const { site } = useSite();
  const features = useSiteFeatures();
  const [homePage, setHomePage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const heading = getPrivateEventFormH1(site?.Name, site?.Language || 'en');

  const hasPrivateEventForm = features.some(
    (feature: any) => {
      if (typeof feature === 'object' && feature !== null) {
        return (feature as unknown as Feature).Name === 'Private event form';
      }
      return false;
    }
  );

  useEffect(() => {
    if (!site?.id) return;

    const fetchHomepageContent = async () => {
      try {
        const response = await fetch(`/api/homepage-content?siteId=${site.id}`);
        if (response.ok) {
          const pageData = await response.json();
          setHomePage(pageData);
        }
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageContent();
  }, [site?.id]);

  return (
    <main className="min-h-screen">
      <div className="site-container py-16">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl font-bold mb-8 text-center"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {heading}
          </h1>

          {loading ? (
            <div className="rounded-[10px] bg-gray-300 p-8 animate-pulse w-full">
              <div className="text-center mb-6">
                <div className="w-64 h-6 bg-gray-400 rounded mx-auto mb-4"></div>
                <div className="w-96 h-4 bg-gray-400 rounded mx-auto"></div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-400 rounded"></div>
                  <div className="h-12 bg-gray-400 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-400 rounded"></div>
                  <div className="h-12 bg-gray-400 rounded"></div>
                </div>
                <div className="h-12 bg-gray-400 rounded"></div>
                <div className="h-24 bg-gray-400 rounded"></div>
                <div className="h-12 bg-gray-400 rounded"></div>
              </div>
            </div>
          ) : !hasPrivateEventForm ? (
            <div className="text-center">
              <p className="text-gray-600 mb-8">
                The private event form feature is not enabled for this site.
              </p>
              <a
                href="/"
                className="btn-accent"
              >
                Back to Homepage
              </a>
            </div>
          ) : (
            <PrivateEventForm
              title={homePage?.['Private event form - Title']}
              subtitle={homePage?.['Private event form - Subtitle']}
              successMessage={homePage?.['Private event form - Success message']}
              language={site?.Language?.toLowerCase() || 'en'}
            />
          )}
        </div>
      </div>
    </main>
  );
}
