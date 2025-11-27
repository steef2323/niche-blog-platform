import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-detection';
import { getBlogPageContent, getCategoriesBySiteId, getBlogPostsBySiteId, getListingPostsBySiteId } from '@/lib/airtable/content';
import { parseMarkdownToHtml } from '@/lib/utils/markdown';
import { generateBlogOverviewSchemas } from '@/lib/utils/schema';
import { BlogPost, ListingPost } from '@/types/airtable';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BlogGrid from '@/components/blog/BlogGrid';
import CategoryBlogSection from '@/components/blog/CategoryBlogSection';

// Type for posts with type indicator
type PostWithType = (BlogPost & { type: 'blog' }) | (ListingPost & { type: 'listing' });

// Enable ISR with 12-hour revalidation (content changes ~2x/week)
// This dramatically reduces API calls by caching pages at the Next.js level
export const revalidate = 12 * 60 * 60; // 12 hours in seconds

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  try {
    // Use centralized site detection - will use cache if already called in layout
    const siteConfig = await getSiteConfig(host);
    const site = siteConfig?.site;
    
    if (!site?.id) {
      return { title: 'Blog' };
    }

    // Get blog page content using views if available
    const blogPage = await getBlogPageContent(site.id, siteConfig?.airtableViews?.pages);
    
    // Use Page meta fields with fallbacks
    const metaTitle = blogPage?.['Meta title'] || blogPage?.Title || site['Default meta title'] || 'Blog';
    const metaDescription = blogPage?.['Meta description'] || 
      (blogPage?.Content ? blogPage.Content.substring(0, 160) + '...' : null) ||
      site['Default meta description'] || 
      'Read our latest articles and insights';
    
    // Build canonical URL
    const siteUrl = site['Site URL'] || `https://${site.Domain}`;
    const canonicalUrl = `${siteUrl}/blog`;

    // Get Open Graph image from blog page featured image or site logo
    const ogImage = blogPage?.['Featured image']?.[0]?.url || site['Site logo']?.[0]?.url;
    
    // Get initial posts for schema (limited to first 20 for schema)
    let schemaPosts: Array<{id?: string, Slug: string, Title?: string, H1?: string}> = [];
    try {
      const [blogPosts, listingPosts] = await Promise.all([
        getBlogPostsBySiteId(site.id, 20, siteConfig?.airtableViews?.blogPosts),
        getListingPostsBySiteId(site.id, 20, siteConfig?.airtableViews?.listingPosts)
      ]);
      
      schemaPosts = [
        ...blogPosts.map(post => ({ id: post.id, Slug: post.Slug, Title: post.Title, H1: post.H1 })),
        ...listingPosts.map(post => ({ id: post.id, Slug: post.Slug, Title: post.Title }))
      ].slice(0, 20);
    } catch (error) {
      console.error('Error fetching posts for schema:', error);
    }
    
    // Build breadcrumbs for schema
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog' }
    ];
    
    // Generate schema markup
    const schemas = generateBlogOverviewSchemas(site, blogPage || undefined, schemaPosts, breadcrumbItems);
    
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
      other: {
        // Add JSON-LD schema markup
        ...schemas.reduce((acc, schema, index) => {
          acc[`json-ld-${index}`] = JSON.stringify(schema);
          return acc;
        }, {} as Record<string, string>)
      }
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
    // SINGLE site detection call - uses cache if already called in layout
    const siteConfig = await getSiteConfig(host);
    if (!siteConfig?.site?.id) {
      redirect('/');
    }

    const { site, siteId, features, airtableViews } = siteConfig;

    // Check if Blog feature is enabled
    const blogFeature = features.find(f => f.Name === 'Blog');
    if (!blogFeature) {
      redirect('/');
    }

    // Get blog page content and categories for this site
    // Use Airtable views if available for faster queries
    const [blogPage, categories] = await Promise.all([
      getBlogPageContent(siteId, airtableViews?.pages),
      getCategoriesBySiteId(siteId, airtableViews?.categories)
    ]);

    // Parse blog page content if available
    const htmlContent = blogPage?.Content ? parseMarkdownToHtml(blogPage.Content) : null;

    // Build breadcrumbs
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Blog' }
    ];

    // Prepare unified listing data if needed (when categories <= 1)
    // Use Airtable views if available (e.g., "sipandpaints.nl" view)
    let unifiedPosts: PostWithType[] = [];
    if (categories.length <= 1) {
      const [blogPosts, listingPosts] = await Promise.all([
        getBlogPostsBySiteId(siteId, 8, airtableViews?.blogPosts), // Use view if available
        getListingPostsBySiteId(siteId, 4, airtableViews?.listingPosts) // Use view if available
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
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {blogPage?.Title || 'Blog'}
          </h1>
          
          {htmlContent && (
            <div 
              className="prose prose-lg mx-auto max-w-3xl"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-body)'
              }}
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
                siteId={siteId}
                isFirst={index === 0}
              />
            ))}
          </div>
        ) : (
          // Single or no categories: Show unified listing
          <BlogGrid 
            initialPosts={unifiedPosts}
            siteId={siteId}
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