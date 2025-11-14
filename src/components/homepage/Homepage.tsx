'use client';

import { useSite, useSiteFeatures, useHomepageContent } from '@/contexts/site';
import { Feature } from '@/types/airtable';
import { InfoComponent1, InfoComponent2, ReviewComponent, PrivateEventForm } from '@/components/ui';
import { attachmentToSEOImage } from '@/lib/utils/image-seo';

import HeroSection from './HeroSection';
import PopularPostsSection from './PopularPostsSection';

export default function Homepage() {
  const { site } = useSite();
  const features = useSiteFeatures();
  const homePage = useHomepageContent(); // Get homepage content directly from context - no API call needed!

  // Check if private event form feature is enabled
  const hasPrivateEventForm = features.some(
    (feature: Feature) => feature.Name === 'Private event form'
  );



  // Prepare Info Component data
  const infoSection1Data = homePage?.['Header 2'] && homePage?.['Content 2'] && homePage?.['Featured image 2']?.[0] ? {
    title: homePage['Header 2'],
    text: homePage['Content 2'],
    image: attachmentToSEOImage(
      homePage['Featured image 2'][0],
      homePage['Featured image 2 alt text'],
      homePage['Featured image 2 title']
    )
  } : null;

  const infoSection2Data = homePage?.['Header 3'] && homePage?.['Content 3'] && homePage?.['Featured image 3']?.[0] ? {
    title: homePage['Header 3'],
    text: homePage['Content 3'],
    image: attachmentToSEOImage(
      homePage['Featured image 3'][0],
      homePage['Featured image 3 alt text'],
      homePage['Featured image 3 title']
    )
  } : null;

  // Prepare Review Component data
  const reviewData = homePage?.['Review 1'] && homePage?.['Review reviewer 1'] ? {
    reviewText: homePage['Review 1'],
    reviewerName: homePage['Review reviewer 1']
  } : null;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection homePage={homePage} />

      {/* Info Components Section - 70px padding from hero */}
      <div style={{ paddingTop: '70px' }}>
        <div className="site-container">
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
          {homePage?.['Button text'] && (
            <div className="text-center mb-[70px]">
              <button 
                onClick={() => {
                  const element = document.getElementById('private-event-form');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="btn-primary"
              >
                {homePage['Button text']}
              </button>
            </div>
          )}

          {/* Info Component 2 - Image left, content right */}
          {infoSection2Data && (
            <InfoComponent2 
              title={infoSection2Data.title}
              text={infoSection2Data.text}
              image={infoSection2Data.image}
            />
          )}

          {/* Button 2 - Between Info Component 2 and Review Component */}
          {homePage?.['Button text'] && (
            <div className="text-center mt-[70px]">
              <button 
                onClick={() => {
                  const element = document.getElementById('private-event-form');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="btn-primary"
              >
                {homePage['Button text']}
              </button>
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

          {/* Private Event Form - Below Review Component */}
          {hasPrivateEventForm && (
            <div id="private-event-form" className="mt-[70px] mb-0">
              <PrivateEventForm 
                title={homePage?.['Private event form - Title']}
                subtitle={homePage?.['Private event form - Subtitle']}
                successMessage={homePage?.['Private event form - Success message']}
                language={site?.Language?.toLowerCase() || 'en'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Popular Posts Section - No extra top padding, PopularPostsSection handles its own padding */}
      <PopularPostsSection homePage={homePage} />
    </main>
  );
}

// Loading component
function HomepageLoading() {
  return (
    <main className="min-h-screen">
      {/* Hero Loading */}
      <div className="h-[60vh] bg-gray-300 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-96 h-12 bg-gray-400 rounded mb-4 mx-auto"></div>
        </div>
      </div>
      
      {/* Info Components Loading - 70px padding from hero */}
      <div style={{ paddingTop: '70px' }}>
        <div className="site-container">
          {/* Info Component 1 Loading */}
          <div className="rounded-[10px] overflow-hidden border border-gray-200 mb-[70px] animate-pulse w-full">
            <div className="hidden md:grid md:grid-cols-2">
              {/* Left: Text content loading */}
              <div className="p-[20px] space-y-4">
                <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
              {/* Right: Image loading */}
              <div className="bg-gray-300 aspect-[4/3]"></div>
            </div>
            {/* Mobile layout loading */}
            <div className="block md:hidden">
              <div className="bg-gray-300 aspect-[4/3]"></div>
              <div className="p-[20px] space-y-4">
                <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Component 2 Loading */}
          <div className="rounded-[10px] overflow-hidden border border-gray-200 animate-pulse w-full">
            <div className="hidden md:grid md:grid-cols-2">
              {/* Left: Image loading */}
              <div className="bg-gray-300 aspect-[4/3]"></div>
              {/* Right: Text content loading */}
              <div className="p-[20px] space-y-4">
                <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
            {/* Mobile layout loading */}
            <div className="block md:hidden">
              <div className="bg-gray-300 aspect-[4/3]"></div>
              <div className="p-[20px] space-y-4">
                <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Component Loading */}
          <div className="mt-[70px] rounded-[10px] bg-gray-300 p-[40px] text-center animate-pulse w-full">
            {/* Review text loading - multiple lines for quote */}
            <div className="space-y-3 mb-5">
              <div className="w-3/4 h-5 bg-gray-400 rounded mx-auto"></div>
              <div className="w-full h-5 bg-gray-400 rounded mx-auto"></div>
              <div className="w-2/3 h-5 bg-gray-400 rounded mx-auto"></div>
            </div>
            {/* Reviewer name loading */}
            <div className="w-48 h-4 bg-gray-400 rounded mx-auto"></div>
          </div>

          {/* Private Event Form Loading */}
          <div className="mt-[70px] rounded-[10px] bg-gray-300 p-8 animate-pulse w-full">
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
        </div>
      </div>

      {/* Existing Section Loading - 70px padding from Info Components */}
      <div style={{ paddingTop: '70px' }}>
        {/* Popular Posts Section Loading */}
        <div className="py-16 bg-white">
          <div className="site-container">
            <div className="text-center mb-12">
              <div className="w-64 h-8 bg-gray-300 rounded mb-4 mx-auto"></div>
              <div className="w-48 h-4 bg-gray-300 rounded mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-[4/3] rounded-xl mb-4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 