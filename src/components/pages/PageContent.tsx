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
  
  // Get language for translations
  const language = site?.Language?.toLowerCase() || 'en';
  const isDutch = language === 'dutch' || language === 'nl' || language === 'nederlands';

  // Check if private event form feature is enabled
  const hasPrivateEventForm = features.some(
    (feature: Feature) => feature.Name === 'Private event form'
  );

  // Prepare Info Component data - check for Header, Content, and Image
  const hasHeader2 = page?.['Header 2'] && typeof page['Header 2'] === 'string' && page['Header 2'].trim().length > 0;
  const hasContent2 = page?.['Content 2'] && typeof page['Content 2'] === 'string' && page['Content 2'].trim().length > 0;
  const hasImage2 = !!(page?.['Featured image 2']?.[0]?.url);

  // Section 1: Use InfoComponent1 if image exists, otherwise use simple text layout
  const infoSection1Data = hasHeader2 && hasContent2 && hasImage2 ? {
    title: page['Header 2']!,
    text: page['Content 2']!,
    image: attachmentToSEOImage(
      page['Featured image 2']?.[0]!,
      page['Featured image 2 alt text'],
      page['Featured image 2 title']
    )
  } : null;

  // Simple text section 1 (no image) - render if Header + Content exist but no image
  // Explicitly check that image does NOT exist
  const hasNoImage2 = !hasImage2;
  const simpleSection1Data = (hasHeader2 && hasContent2 && hasNoImage2) ? {
    title: page['Header 2']!,
    text: page['Content 2']!
  } : null;
  
  // Debug: Log simpleSection1Data creation
  if (hasHeader2 && hasContent2) {
    console.log('Section 1 check:', {
      hasHeader2,
      hasContent2,
      hasImage2,
      hasNoImage2,
      willCreateSimpleSection: hasNoImage2,
      simpleSection1Data: !!simpleSection1Data,
      simpleSection1DataValue: simpleSection1Data
    });
  }

  // Check for truthy values for InfoComponent2
  const hasHeader3 = page?.['Header 3'] && typeof page['Header 3'] === 'string' && page['Header 3'].trim().length > 0;
  const hasContent3 = page?.['Content 3'] && typeof page['Content 3'] === 'string' && page['Content 3'].trim().length > 0;
  const hasImage3 = !!(page?.['Featured image 3']?.[0]?.url);

  // Section 2: Use InfoComponent2 if image exists, otherwise use simple text layout
  const infoSection2Data = hasHeader3 && hasContent3 && hasImage3 ? {
    title: page['Header 3']!,
    text: page['Content 3']!,
    image: attachmentToSEOImage(
      page['Featured image 3']?.[0]!,
      page['Featured image 3 alt text'],
      page['Featured image 3 title']
    )
  } : null;

  // Simple text section 2 (no image) - render if Header + Content exist but no image
  // Explicitly check that image does NOT exist
  const hasNoImage3 = !hasImage3;
  const simpleSection2Data = (hasHeader3 && hasContent3 && hasNoImage3) ? {
    title: page['Header 3']!,
    text: page['Content 3']!
  } : null;

  // Prepare Review Component data - only render if both fields exist
  const reviewData = page?.['Review 1'] && page?.['Review reviewer 1'] ? {
    reviewText: page['Review 1']!,
    reviewerName: page['Review reviewer 1']!
  } : null;

  // Parse content if available
  const htmlContent = page.Content ? parseMarkdownToHtml(page.Content) : null;

  // Debug logging - always log to help troubleshoot
  console.log('PageContent Debug:', {
    pageTitle: page?.Title,
    hasHeader2,
    hasContent2,
    hasImage2,
    header2Value: page?.['Header 2'],
    content2Preview: page?.['Content 2']?.substring(0, 50),
    hasHeader3,
    hasContent3,
    hasImage3,
    header3Value: page?.['Header 3'],
    content3Preview: page?.['Content 3']?.substring(0, 50),
    infoSection1Data: !!infoSection1Data,
    simpleSection1Data: !!simpleSection1Data,
    simpleSection1DataValue: simpleSection1Data,
    infoSection2Data: !!infoSection2Data,
    simpleSection2Data: !!simpleSection2Data,
    htmlContent: !!htmlContent,
    hasPrivateEventForm,
    willRenderContent: !!(infoSection1Data || infoSection2Data || simpleSection1Data || simpleSection2Data || reviewData || hasPrivateEventForm || htmlContent),
    conditionCheck: {
      infoSection1Data: !!infoSection1Data,
      infoSection2Data: !!infoSection2Data,
      simpleSection1Data: !!simpleSection1Data,
      simpleSection2Data: !!simpleSection2Data,
      reviewData: !!reviewData,
      hasPrivateEventForm,
      htmlContent: !!htmlContent
    }
  });

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

      {/* Content Sections - 70px padding from hero if hero exists */}
      {(infoSection1Data || infoSection2Data || simpleSection1Data || simpleSection2Data || reviewData || hasPrivateEventForm || htmlContent) ? (
        <div style={{ paddingTop: page['Featured image']?.[0] ? '70px' : '0px' }}>
          <div className="site-container">
            {/* Basic Content - render first if no hero, or after hero if hero exists */}
            {htmlContent && !page['Featured image']?.[0] && (
              <div 
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 prose-strong:font-bold prose-strong:text-[var(--text-color)] mb-[70px]"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Info Component 1 - Content left, image right (only if image exists) */}
            {infoSection1Data && (
              <InfoComponent1 
                title={infoSection1Data.title}
                text={infoSection1Data.text}
                image={infoSection1Data.image}
                className="mb-[70px]"
              />
            )}

            {/* Simple Text Section 1 - H2.1 + Text2.1 (when no image) */}
            {simpleSection1Data && (
              <div className="mb-[70px]">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {simpleSection1Data.title}
                </h2>
                <div 
                  className="prose prose-lg max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 prose-strong:font-bold prose-strong:text-[var(--text-color)]"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(simpleSection1Data.text) }}
                />
              </div>
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

            {/* Info Component 2 - Image left, content right (only if image exists) */}
            {infoSection2Data && (
              <InfoComponent2 
                title={infoSection2Data.title}
                text={infoSection2Data.text}
                image={infoSection2Data.image}
                className={page?.['Button text'] ? 'mb-[70px]' : ''}
              />
            )}

            {/* Simple Text Section 2 - H2.2 + Text2.2 (when no image) */}
            {simpleSection2Data && (
              <div className="mb-[70px]">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {simpleSection2Data.title}
                </h2>
                <div 
                  className="prose prose-lg max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 prose-strong:font-bold prose-strong:text-[var(--text-color)]"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(simpleSection2Data.text) }}
                />
              </div>
            )}

            {/* Button 2 - Between Info Component 2 and Review Component */}
            {page?.['Button text'] && (infoSection2Data || simpleSection2Data) && (
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
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[var(--text-color)] prose-a:underline hover:prose-a:opacity-80 prose-strong:font-bold prose-strong:text-[var(--text-color)] mt-[70px]"
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
      ) : (
        /* Show message if no content is available */
        !page['Featured image']?.[0] && (
          <div className="site-container py-8">
            <p 
              className="text-lg opacity-75"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {isDutch ? 'Inhoud komt binnenkort...' : 'Content coming soon...'}
            </p>
          </div>
        )
      )}
    </main>
  );
}

