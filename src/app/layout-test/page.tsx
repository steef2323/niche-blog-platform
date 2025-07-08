'use client';

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import { useSite, useSiteTheme, useSiteFeatures } from '@/contexts/site';

export default function LayoutTestPage() {
  const { site } = useSite();
  const theme = useSiteTheme();
  const features = useSiteFeatures();

  const hasPrivateEventForm = features.some(
    feature => {
      if (typeof feature === 'object' && feature !== null) {
        return (feature as any).Name === 'Private event form';
      }
      return false;
    }
  );

  return (
    <BaseLayout>
      <div className="site-container py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
          Layout Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-color)' }}>
            Site Configuration
          </h2>
          
          {site ? (
            <div className="space-y-4">
              <p><strong>Site Name:</strong> {site.Name}</p>
              <p><strong>Domain:</strong> {site.Domain}</p>
              <p><strong>Private Event Feature:</strong> {hasPrivateEventForm ? 'Enabled' : 'Disabled'}</p>
              
              <h3 className="text-lg font-medium mt-6 mb-2">Theme Colors</h3>
              {theme && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded flex items-center">
                    <div 
                      className="w-10 h-10 rounded mr-3" 
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div>
                      <p className="font-medium">Primary Color</p>
                      <p className="text-sm text-gray-500">{theme.primaryColor}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded flex items-center">
                    <div 
                      className="w-10 h-10 rounded mr-3" 
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <div>
                      <p className="font-medium">Secondary Color</p>
                      <p className="text-sm text-gray-500">{theme.secondaryColor}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded flex items-center">
                    <div 
                      className="w-10 h-10 rounded mr-3" 
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <div>
                      <p className="font-medium">Accent Color</p>
                      <p className="text-sm text-gray-500">{theme.accentColor}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded flex items-center">
                    <div 
                      className="w-10 h-10 rounded mr-3" 
                      style={{ backgroundColor: theme.backgroundColor }}
                    />
                    <div>
                      <p className="font-medium">Background Color</p>
                      <p className="text-sm text-gray-500">{theme.backgroundColor}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded flex items-center">
                    <div 
                      className="w-10 h-10 rounded mr-3" 
                      style={{ backgroundColor: theme.textColor }}
                    />
                    <div>
                      <p className="font-medium">Text Color</p>
                      <p className="text-sm text-gray-500">{theme.textColor}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No site data available</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
            Header Component Test
          </h2>
          <p>The header above uses the site configuration to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Apply theme colors using CSS variables</li>
            <li>Display site logo or name</li>
            <li>Render navigation links from Pages data</li>
            <li>Show or hide the Private Event Form button based on feature flag</li>
            <li>Provide a responsive mobile menu</li>
            <li>Use a background swirl effect with accent and background colors</li>
          </ul>
        </div>
      </div>
    </BaseLayout>
  );
} 