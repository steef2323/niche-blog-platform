'use client';

import { useSite, useSiteFeatures } from '@/contexts/site';
import { Page } from '@/types/airtable';
import { Feature } from '@/types/airtable';
import { InfoComponent1, InfoComponent2, ReviewComponent, PrivateEventForm } from '@/components/ui';
import { attachmentToSEOImage } from '@/lib/utils/image-seo';
import { parseMarkdownToHtml } from '@/lib/utils/markdown';
import HeroSection from '../homepage/HeroSection';

interface PageContentProps {
  page: Page;
}

export default function PageContent({ page }: PageContentProps) {
  const { site } = useSite();
  const features = useSiteFeatures();

  // Check if private event form feature is enabled
  const hasPrivateEventForm = features.some(
    (feature: Feature) => feature.Name === 'Private event form'
  );

  // Prepare Info Component data - only render if all required fields exist
  // Check for truthy values (not null, undefined, or empty string)
  const hasHeader2 = page?.['Header 2'] && typeof page['Header 2'] === 'string' && page['Header 2'].trim().length > 0;
  const hasContent2 = page?.['Content 2'] && typeof page['Content 2'] === 'string' && page['Content 2'].trim().length > 0;
  const hasImage2 = page?.['Featured image 2']?.[0] && page['Featured image 2'][0].url;

  // Debug: Log what fields are available
  console.log('Page data for InfoComponent1:', {
    'Header 2': page?.['Header 2'],
    'Content 2': page?.['Content 2']?.substring(0, 50),
    'Featured image 2': page?.['Featured image 2']?.[0]?.url,
    hasHeader2,
    hasContent2,
    hasImage2
  });

  const infoSection1Data = hasHeader2 && hasContent2 && hasImage2 ? {
    title: page['Header 2'],
    text: page['Content 2'],
    image: attachmentToSEOImage(
      page['Featured image 2']?.[0]!,
      page['Featured image 2 alt text'],
      page['Featured image 2 title']
    )
  } : null;

  console.log('InfoSection1Data:', infoSection1Data ? '✅ Will render' : '❌ Will not render');

  // Check for truthy values for InfoComponent2
  const hasHeader3 = page?.['Header 3'] && typeof page['Header 3'] === 'string' && page['Header 3'].trim().length > 0;
  const hasContent3 = page?.['Content 3'] && typeof page['Content 3'] === 'string' && page['Content 3'].trim().length > 0;
  const hasImage3 = page?.['Featured image 3']?.[0] && page['Featured image 3'][0].url;

  const infoSection2Data = hasHeader3 && hasContent3 && hasImage3 ? {
    title: page['Header 3'],
    text: page['Content 3'],
    image: attachmentToSEOImage(
      page['Featured image 3']?.[0]!,
      page['Featured image 3 alt text'],
      page['Featured image 3 title']
    )
  } : null;

  // Prepare Review Component data - only render if both fields exist
  const reviewData = page?.['Review 1'] && page?.['Review reviewer 1'] ? {
    reviewText: page['Review 1'],
    reviewerName: page['Review reviewer 1']
  } : null;

  // Parse content if available
  const htmlContent = page.Content ? parseMarkdownToHtml(page.Content) : null;

  return (
    <main className="min-h-screen">
      {/* Hero Section - only render if Featured image exists */}
      {page['Featured image']?.[0] && (
        <HeroSection homePage={page} />
      )}

      {/* If no hero, show title at top */}
      {!page['Featured image']?.[0] && (
        <div className="site-container py-12">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {page.Title}
          </h1>
        </div>
      )}

      {/* Info Components Section - 70px padding from hero if hero exists */}
      {(infoSection1Data || infoSection2Data || reviewData || hasPrivateEventForm || htmlContent) && (
        <div style={{ paddingTop: page['Featured image']?.[0] ? '70px' : '0px' }}>
          <div className="site-container">
            {/* Basic Content - render first if no hero, or after hero if hero exists */}
            {htmlContent && !page['Featured image']?.[0] && (
              <div 
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 mb-[70px]"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Info Component 1 - Content left, image right */}
            {infoSection1Data && (
              <InfoComponent1 
                title={infoSection1Data.title}
                text={infoSection1Data.text}
                image={infoSection1Data.image}
                className="mb-[70px]"
              />
            )}

            {/* Button 1 - Between Info Components */}
            {page?.['Button text'] && (
              <div className="text-center mb-[70px]">
                {page['Button url'] ? (
                  <a 
                    href={page['Button url']}
                    className="btn-primary"
                  >
                    {page['Button text']}
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      const element = document.getElementById('private-event-form');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="btn-primary"
                  >
                    {page['Button text']}
                  </button>
                )}
              </div>
            )}

            {/* Info Component 2 - Image left, content right */}
            {infoSection2Data && (
              <InfoComponent2 
                title={infoSection2Data.title}
                text={infoSection2Data.text}
                image={infoSection2Data.image}
                className={page?.['Button text'] ? 'mb-[70px]' : ''}
              />
            )}

            {/* Button 2 - Between Info Component 2 and Review Component */}
            {page?.['Button text'] && infoSection2Data && (
              <div className="text-center mt-[70px]">
                {page['Button url'] ? (
                  <a 
                    href={page['Button url']}
                    className="btn-primary"
                  >
                    {page['Button text']}
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      const element = document.getElementById('private-event-form');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="btn-primary"
                  >
                    {page['Button text']}
                  </button>
                )}
              </div>
            )}

            {/* Review Component - Below InfoComponent2 */}
            {reviewData && (
              <div className="mt-[70px]">
                <ReviewComponent 
                  reviewText={reviewData.reviewText}
                  reviewerName={reviewData.reviewerName}
                />
              </div>
            )}

            {/* Basic Content - render after other sections if hero exists */}
            {htmlContent && page['Featured image']?.[0] && (
              <div 
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 mt-[70px]"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Private Event Form - Below all other content */}
            {hasPrivateEventForm && (
              <div id="private-event-form" className="mt-[70px] mb-[70px]">
                <PrivateEventForm 
                  title={page?.['Private event form - Title']}
                  subtitle={page?.['Private event form - Subtitle']}
                  successMessage={page?.['Private event form - Success message']}
                  language={site?.Language?.toLowerCase() || 'en'}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

