import { Attachment, SEOImage } from '@/types/airtable';

/**
 * Converts an Airtable attachment to SEOImage with proper fallbacks
 * @param attachment - Airtable attachment object
 * @param fallbackAlt - Fallback alt text if not provided in attachment
 * @param fallbackTitle - Fallback title if not provided in attachment
 * @returns SEOImage object with proper SEO attributes
 */
export function attachmentToSEOImage(
  attachment: Attachment,
  fallbackAlt?: string,
  fallbackTitle?: string
): SEOImage {
  return {
    src: attachment.url,
    alt: attachment.altText || fallbackAlt || generateAltFromFilename(attachment.filename),
    title: attachment.title || fallbackTitle,
    caption: attachment.caption,
    width: attachment.width,
    height: attachment.height,
    focalPoint: attachment.focalPoint || 'center'
  };
}

/**
 * Generates descriptive alt text from filename as fallback
 * @param filename - Image filename
 * @returns Generated alt text
 */
function generateAltFromFilename(filename: string): string {
  // Remove file extension and replace hyphens/underscores with spaces
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const words = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
    .toLowerCase();
  
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Validates SEO image data and provides recommendations
 * @param image - SEOImage object
 * @returns Object with validation results and recommendations
 */
export function validateImageSEO(image: SEOImage) {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Alt text validation
  if (!image.alt) {
    issues.push('Missing alt text - critical for accessibility and SEO');
  } else if (image.alt.length < 10) {
    recommendations.push('Alt text is quite short - consider more descriptive text');
  } else if (image.alt.length > 125) {
    recommendations.push('Alt text is long - consider keeping under 125 characters');
  }

  // Title validation
  if (image.title && image.title.length > 60) {
    recommendations.push('Image title is long - consider keeping under 60 characters');
  }

  // Caption validation
  if (image.caption && image.caption.length > 200) {
    recommendations.push('Image caption is long - consider keeping under 200 characters');
  }

  // Dimensions validation
  if (!image.width || !image.height) {
    issues.push('Missing width/height - can cause layout shift (bad for Core Web Vitals)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
    score: Math.max(0, 100 - (issues.length * 25) - (recommendations.length * 5))
  };
}

/**
 * Gets the loading attribute based on image position
 * @param isAboveFold - Whether image is above the fold
 * @returns Loading attribute value
 */
export function getImageLoading(isAboveFold: boolean = false): 'eager' | 'lazy' {
  return isAboveFold ? 'eager' : 'lazy';
}

/**
 * Gets responsive sizes string for Next.js Image component
 * @param layout - Layout type for the image
 * @returns Sizes string for responsive images
 */
export function getImageSizes(layout: 'hero' | 'card' | 'sidebar' | 'full' = 'card'): string {
  switch (layout) {
    case 'hero':
      return '100vw';
    case 'card':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    case 'sidebar':
      return '(max-width: 768px) 100vw, 25vw';
    case 'full':
      return '100vw';
    default:
      return '(max-width: 768px) 100vw, 50vw';
  }
} 