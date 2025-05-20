'use client';

import { useTheme } from '@/contexts/theme';

export default function ThemeTest() {
  const { colors } = useTheme();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Theme Test Page</h1>

      <div className="grid gap-8">
        {/* Color Swatches */}
        <section className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">Site Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                {key.includes('color') && (
                  <>
                    <div 
                      className="h-20 rounded"
                      style={{ backgroundColor: value }}
                    />
                    <p className="text-sm font-mono">
                      {key}: {value}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">Typography</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-mono">Heading Font: {colors.headingFont}</p>
              <h1 className="text-4xl" style={{ fontFamily: colors.headingFont }}>
                Heading Example
              </h1>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-mono">Body Font: {colors.bodyFont}</p>
              <p style={{ fontFamily: colors.bodyFont }}>
                This is an example of body text using the site's body font.
              </p>
            </div>
          </div>
        </section>

        {/* Example Components */}
        <section className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">Example Components</h2>
          <div className="space-y-4">
            <button 
              className="px-4 py-2 rounded"
              style={{ 
                backgroundColor: colors.primaryColor,
                color: '#ffffff'
              }}
            >
              Primary Button
            </button>
            <button 
              className="px-4 py-2 rounded ml-2"
              style={{ 
                backgroundColor: colors.secondaryColor,
                color: colors.textColor
              }}
            >
              Secondary Button
            </button>
            <div 
              className="p-4 rounded"
              style={{ 
                backgroundColor: colors.accentColor,
                color: colors.textColor
              }}
            >
              Accent Box
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 