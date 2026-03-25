/**
 * Topic cluster & internal linking utilities
 *
 * Clusters are defined per-language so Dutch and English content both benefit.
 * Each cluster has:
 *  - pillarSlug : the canonical blog post that acts as the pillar page
 *  - keywords   : first-mention of any of these phrases gets linked to the pillar
 *
 * Only the FIRST occurrence of each keyword is linked to avoid over-linking.
 */

export interface ClusterDefinition {
  id: string;
  pillarSlug: string;
  /** Display name used in "More from this cluster" heading */
  name: string;
  /** Keywords / keyphrases to auto-link (case-insensitive) */
  keywords: string[];
}

/**
 * Site-agnostic cluster definitions.
 * The same three clusters apply to all three sip-and-paint sites; the pillar
 * slug is the same across sites (content is differentiated in Airtable, not here).
 */
export const CLUSTERS: ClusterDefinition[] = [
  {
    id: 'amsterdam',
    pillarSlug: 'sip-and-paint-amsterdam',
    name: 'Sip & Paint Amsterdam',
    keywords: [
      'sip and paint amsterdam',
      'sip en paint amsterdam',
      'sip & paint amsterdam',
      'amsterdam sip and paint',
      'sip paint amsterdam',
    ],
  },
  {
    id: 'beginners',
    pillarSlug: 'sip-and-paint-voor-beginners',
    name: 'Sip & Paint voor Beginners',
    keywords: [
      'sip and paint voor beginners',
      'sip en paint voor beginners',
      'sip & paint voor beginners',
      'beginners sip and paint',
      'sip paint for beginners',
      'sip and paint beginners',
    ],
  },
  {
    id: 'ideas',
    pillarSlug: 'sip-and-paint-ideeen',
    name: 'Sip & Paint Ideeën',
    keywords: [
      'sip and paint ideeën',
      'sip en paint ideeën',
      'sip & paint ideeën',
      'sip and paint ideas',
      'sip paint ideas',
      'sip and paint themas',
      'sip and paint thema',
    ],
  },
];

/**
 * Return the cluster a given post slug belongs to, or null.
 * A post is considered part of a cluster if its slug matches the pillar slug, OR
 * if the cluster ID is a substring of the slug (loose heuristic — can be
 * tightened by adding an explicit Airtable `Cluster` field later).
 */
export function getClusterForPost(postSlug: string): ClusterDefinition | null {
  const slug = postSlug.toLowerCase();
  for (const cluster of CLUSTERS) {
    if (
      slug === cluster.pillarSlug ||
      slug.includes(cluster.id) ||
      cluster.keywords.some((kw) => slug.includes(kw.replace(/\s+/g, '-')))
    ) {
      return cluster;
    }
  }
  return null;
}

/**
 * Inject contextual internal links into HTML content.
 *
 * Rules:
 * - Only the first occurrence of each keyword is linked.
 * - Never links if the text is already inside an <a> tag.
 * - The current post's own pillar link is skipped (no self-linking).
 * - Link text preserves original casing.
 */
export function injectClusterLinks(
  html: string,
  currentPostSlug: string
): string {
  if (!html) return html;

  let result = html;

  for (const cluster of CLUSTERS) {
    // Skip pillar → self link
    if (cluster.pillarSlug === currentPostSlug) continue;

    for (const keyword of cluster.keywords) {
      // Build a regex that matches the keyword but NOT when inside an <a>…</a>
      // We use a simple approach: replace first bare match only.
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?<!<[^>]*)(${escaped})(?![^<]*>)`, 'i');

      if (pattern.test(result)) {
        result = result.replace(
          pattern,
          `<a href="/blog/${cluster.pillarSlug}" class="cluster-link">$1</a>`
        );
        // Only link once per keyword per page — break to next keyword after first replacement
        break;
      }
    }
  }

  return result;
}
