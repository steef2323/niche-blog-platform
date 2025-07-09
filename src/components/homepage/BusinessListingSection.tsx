import { ListingPost } from '@/types/airtable';
import Link from 'next/link';
import Image from 'next/image';

interface BusinessListingSectionProps {
  listingPosts: ListingPost[];
}

export default function BusinessListingSection({ listingPosts }: BusinessListingSectionProps) {
  if (listingPosts.length === 0) {
    return null;
  }

  // Take the top 3 listing posts
  const featuredListings = listingPosts.slice(0, 3);

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
            Business Listings
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the best local businesses and hidden gems in your area
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredListings.map((listing) => {
            const featuredImage = listing['Featured image']?.[0]?.url;
            const slug = listing.Slug;
            const href = `/blog/${slug}`;
            
            return (
              <Link 
                key={listing.ID}
                href={href}
                className="group block"
              >
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <Image 
                        src={featuredImage} 
                        alt={listing.Title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <span 
                        className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--secondary-color)', 
                          color: 'white' 
                        }}
                      >
                        Business Guide
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors">
                      {listing.Title}
                    </h3>
                    
                    {listing.Excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {listing.Excerpt}
                      </p>
                    )}
                    
                    {/* Business highlights */}
                    <div className="space-y-2 mb-4">
                      {listing.Businesses && listing.Businesses.length > 0 && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></span>
                          {listing.Businesses.length} business{listing.Businesses.length !== 1 ? 'es' : ''} featured
                        </div>
                      )}
                      {listing.Categories && listing.Categories.length > 0 && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></span>
                          Curated selection
                        </div>
                      )}
                      {listing['Published date'] && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></span>
                          Recently updated
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span 
                        className="text-sm font-medium group-hover:underline"
                        style={{ color: 'var(--primary-color)' }}
                      >
                        Explore Guide →
                      </span>
                      {listing['Published date'] && (
                        <span className="text-xs text-gray-500">
                          {new Date(listing['Published date']).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
        
        {/* View All Listings Link */}
        {listingPosts.length > 3 && (
          <div className="text-center mt-12">
            <Link 
              href="/blog"
              className="inline-flex items-center px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
              style={{ 
                backgroundColor: 'var(--secondary-color)', 
                color: 'white' 
              }}
            >
              View All Business Listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
} 