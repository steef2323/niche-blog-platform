import { Site } from '@/types/airtable';

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Lighten or darken a color by a percentage
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (rgb.r * percent / 100))));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (rgb.g * percent / 100))));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (rgb.b * percent / 100))));
  
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Mix two colors
 */
function mixColors(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const w = weight;
  const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w);
  const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w);
  const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w);
  
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

export function generateCssVariables(site: Site): string {
  const primaryColor = site['Primary color'] || '#3b82f6';
  const secondaryColor = site['Secondary color'] || '#f1f5f9';
  const accentColor = site['Accent color'] || '#fefae0';
  const backgroundColor = site['Background color'] || '#ffffff';
  const textColor = site['Text color'] || '#0f172a';
  
  // Derive additional colors from base colors
  // Border color: mix of background and text color (lighter)
  const borderColor = mixColors(backgroundColor, textColor, 0.1);
  
  // Muted color: lighter version of text color
  const mutedColor = mixColors(backgroundColor, textColor, 0.4);
  
  // Card background: same as background (or slightly different if needed)
  const cardBg = backgroundColor;
  
  // Card text: same as text color
  const cardText = textColor;
  
  return `
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
    --accent-color: ${accentColor};
    --background-color: ${backgroundColor};
    --text-color: ${textColor};
    --border-color: ${borderColor};
    --muted-color: ${mutedColor};
    --card-bg: ${cardBg};
    --card-text: ${cardText};
    --font-heading: ${site['Heading font']};
    --font-body: ${site['Body font']};
  `;
}

// Convert Airtable site to theme colors
export function siteToTheme(site: Site): ThemeColors {
  return {
    primaryColor: site['Primary color'],
    secondaryColor: site['Secondary color'],
    accentColor: site['Accent color'],
    backgroundColor: site['Background color'],
    textColor: site['Text color'],
    headingFont: site['Heading font'],
    bodyFont: site['Body font']
  };
} 