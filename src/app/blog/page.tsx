import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSiteByDomain } from '@/lib/airtable/sites';
import { getBlogPageContent, getCategoriesBySiteId, getBlogPostsBySiteId, getListingPostsBySiteId } from '@/lib/airtable/content';
import { getFeaturesBySiteId } from '@/lib/airtable/features';
import { parseMarkdownToHtml } from '@/lib/utils/markdown';
import { BlogPost, ListingPost } from '@/types/airtable';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BlogGrid from '@/components/blog/BlogGrid';
import CategoryBlogSection from '@/components/blog/CategoryBlogSection';

// Type for posts with type indicator
type PostWithType = (BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      return { title: 'Blog' };
    }

    const blogPage = await getBlogPageContent(site.id);
    
    return {
      title: blogPage?.Title || 'Blog',
      description: blogPage?.Content ? 
        blogPage.Content.substring(0, 160) + '...' : 
        'Read our latest articles and insights',
      openGraph: {
        title: blogPage?.Title || 'Blog',
        description: blogPage?.Content ? 
          blogPage.Content.substring(0, 160) + '...' : 
          'Read our latest articles and insights',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: blogPage?.Title || 'Blog',
        description: blogPage?.Content ? 
          blogPage.Content.substring(0, 160) + '...' : 
          'Read our latest articles and insights',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: 'Blog' };
  }
}

export default async function BlogPage() {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // Get site data
    const site = await getSiteByDomain(host);
    if (!site?.id) {
      redirect('/');
    }

    // Check if Blog feature is enabled
    const features = await getFeaturesBySiteId(site.id);
    const blogFeature = features.find(f => f.Name === 'Blog');
    if (!blogFeature) {
      redirect('/');
    }

    // Get blog page content and categories for this site
    const [blogPage, categories] = await Promise.all([
      getBlogPageContent(site.id),
      getCategoriesBySiteId(site.id)
    ]);

    // Parse blog page content if available
    const htmlContent = blogPage?.Content ? parseMarkdownToHtml(blogPage.Content) : null;

    // Build breadcrumbs
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog' }
    ];

    // Prepare unified listing data if needed (when categories <= 1)
    let unifiedPosts: PostWithType[] = [];
    if (categories.length <= 1) {
      const [blogPosts, listingPosts] = await Promise.all([
        getBlogPostsBySiteId(site.id, 8), // Initial 8 blog posts
        getListingPostsBySiteId(site.id, 4) // Initial 4 listing posts
      ]);

      // Combine and sort by published date (most recent first)
      unifiedPosts = [
        ...blogPosts.map(post => ({ ...post, type: 'blog' as const })),
        ...listingPosts.map(post => ({ ...post, type: 'listing' as const }))
      ].sort((a, b) => {
        const dateA = new Date(a['Published date'] || '').getTime();
        const dateB = new Date(b['Published date'] || '').getTime();
        return dateB - dateA;
      }).slice(0, 12); // Take first 12 posts
    }

    return (
      <div className="site-container py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {/* Blog Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {blogPage?.Title || 'Blog'}
          </h1>
          
          {htmlContent && (
            <div 
              className="prose prose-lg mx-auto text-gray-600 max-w-3xl"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>

        {/* Blog Content - Conditional Logic */}
        {categories.length > 1 ? (
          // Multiple categories: Show category sections
          <div className="space-y-16">
            {categories.map((category, index) => (
              <CategoryBlogSection
                key={category.id}
                category={category}
                siteId={site.id}
                isFirst={index === 0}
              />
            ))}
          </div>
        ) : (
          // Single or no categories: Show unified listing
          <BlogGrid 
            initialPosts={unifiedPosts}
            siteId={site.id}
            postsPerPage={12}
          />
        )}
      </div>
    );

  } catch (error) {
    console.error('Error loading blog page:', error);
    redirect('/');
  }
} 