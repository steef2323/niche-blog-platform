'use client';

import React, { createContext, useContext } from 'react';
import { Site } from '@/types/airtable';
import { ThemeColors, generateCssVariables, siteToTheme } from '@/styles/theme';

interface ThemeContextType {
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ site, children }: { site: Site | null; children: React.ReactNode }) {
  // Apply CSS variables when site changes
  React.useEffect(() => {
    if (site) {
      // Apply theme variables without overwriting font variables
      const themeVars = generateCssVariables(site);
      const lines = themeVars.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.includes(':')) {
          const colonIndex = trimmedLine.indexOf(':');
          const property = trimmedLine.substring(0, colonIndex).trim();
          let value = trimmedLine.substring(colonIndex + 1).trim();
          
          // Remove trailing semicolon if present
          if (value.endsWith(';')) {
            value = value.slice(0, -1).trim();
          }
          
        if (property && value) {
          // Don't overwrite font variables that are set by GoogleFonts component
          if (!property.includes('font')) {
            document.documentElement.style.setProperty(property, value);
              // Debug log for accent color to verify it's being set
              if (property === '--accent-color') {
                console.log(`✅ Setting --accent-color to: ${value}`);
              }
            }
          }
        }
      });
    } 
  }, [site]);

  const value = React.useMemo(() => ({
    colors: site ? siteToTheme(site) : {} as ThemeColors,
  }), [site]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 