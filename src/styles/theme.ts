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

export function generateCssVariables(site: Site): string {
  return `
    --primary-color: ${site['Primary color']};
    --secondary-color: ${site['Secondary color']};
    --accent-color: ${site['Accent color']};
    --background-color: ${site['Background color']};
    --text-color: ${site['Text color']};
    --heading-font: ${site['Heading font']};
    --body-font: ${site['Body font']};
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