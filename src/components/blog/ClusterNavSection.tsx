import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, ListingPost } from '@/types/airtable';
import { ClusterDefinition } from '@/lib/utils/cluster-links';
import { getBlogTitle, getBlogExcerpt } from '@/lib/utils/structured-content';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';

interface ClusterNavSectionProps {
  cluster: ClusterDefinition;
  /** Posts in the same cluster (excluding current post), max ~4 */
  clusterPosts: (BlogPost | ListingPost)[];
  isPillarPage: boolean;
  /** Site language for heading copy */
  language?: string;
}

function getPostTitle(post: BlogPost | ListingPost): string {
  if ('H1' in post && post.H1) return post.H1;
  if ('Title' in post && post.Title) return post.Title;
  return (post as any).Slug || 'Untitled';
}

function getPostExcerpt(post: BlogPost | ListingPost): string {
  if ('H1' in post) return getBlogExcerpt(post as BlogPost);
  return (post as any)['Meta description'] || '';
}

function getPostImage(post: BlogPost | ListingPost): string | null {
  return post['Featured image']?.[0]?.url ?? null;
}

/**
 * Cluster navigation section displayed in blog posts.
 *
 * On pillar pages: shows all cluster posts with a "Dive deeper" heading.
 * On cluster posts: shows a link back to the pillar + sibling posts.
 */
export default function ClusterNavSection({
  cluster,
  clusterPosts,
  isPillarPage,
  language,
}: ClusterNavSectionProps) {
  const isNl = language?.toLowerCase().startsWith('nl') ?? false;

  const headingText = isPillarPage
    ? isNl
      ? `Meer artikelen over ${cluster.name}`
      : `More articles about ${cluster.name}`
    : isNl
    ? `Meer uit het cluster: ${cluster.name}`
    : `More from this cluster: ${cluster.name}`;

  const pillarLinkText = isNl
    ? `Bekijk het hoofdartikel: ${cluster.name}`
    : `View pillar: ${cluster.name}`;

  if (clusterPosts.length === 0 && isPillarPage) return null;

  return (
    <section className="mt-12 pt-10 border-t" style={{ borderColor: 'var(--border-color)' }}>
      {/* Heading */}
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
      >
        {headingText}
      </h2>

      {/* Back-link to pillar (only on cluster posts, not on the pillar itself) */}
      {!isPillarPage && (
        <p className="mb-6 text-sm" style={{ color: 'var(--muted-color)' }}>
          <Link
            href={`/blog/${cluster.pillarSlug}`}
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'var(--primary-color)' }}
          >
            {pillarLinkText} →
          </Link>
        </p>
      )}

      {/* Cluster post grid */}
      {clusterPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clusterPosts.map((post) => {
            const title = getPostTitle(post);
            const excerpt = getPostExcerpt(post);
            const imageUrl = getPostImage(post);
            const slug = post.Slug;

            return (
              <article key={post.id || slug} className="group flex flex-col">
                <Link href={`/blog/${slug}`} className="block flex-1">
                  {/* Thumbnail */}
                  <div
                    className="aspect-[16/9] relative mb-3 overflow-hidden rounded-lg"
                    style={{ backgroundColor: 'var(--secondary-color)' }}
                  >
                    {imageUrl ? (
                      <Image
                        src={getProxiedImageUrl(imageUrl)}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        quality={70}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            'linear-gradient(to bottom right, var(--secondary-color), var(--border-color))',
                        }}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-base font-semibold mb-1 line-clamp-2 group-hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}
                  >
                    {title}
                  </h3>

                  {/* Excerpt */}
                  {excerpt && (
                    <p
                      className="text-sm line-clamp-2 leading-relaxed"
                      style={{ color: 'var(--text-color)', opacity: 0.75, fontFamily: 'var(--font-body)' }}
                    >
                      {excerpt}
                    </p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
