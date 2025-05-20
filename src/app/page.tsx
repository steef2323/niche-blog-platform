'use client';

import { useSite, useSiteTheme } from '@/contexts/site';

export default function Home() {
  return (
    <main className="p-8">
      <SiteInfo />
    </main>
  );
}

// We need to create this as a Client Component since it uses hooks
function SiteInfo() {
  const { site, isLoading, error } = useSite();
  const theme = useSiteTheme();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!site) return <div>No site found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Site Information</h1>
      
      <div className="space-y-6">
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Info</h2>
          <dl className="grid grid-cols-2 gap-4">
            <dt>Name:</dt>
            <dd>{site.Name}</dd>
            <dt>Domain:</dt>
            <dd>{site.Domain}</dd>
            <dt>Local Domain:</dt>
            <dd>{site['Local domain'] || 'Not set'}</dd>
            <dt>Status:</dt>
            <dd>{site.Active}</dd>
          </dl>
        </section>

        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Theme</h2>
          <div className="grid grid-cols-2 gap-4">
            {theme && Object.entries(theme).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium">{key}:</span>
                {key.toLowerCase().includes('color') ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border" 
                      style={{ backgroundColor: value }}
                    />
                    <span>{value}</span>
                  </div>
                ) : (
                  <span>{value}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Content</h2>
          <dl className="grid grid-cols-2 gap-4">
            <dt>Features:</dt>
            <dd>{site.Features?.length || 0} enabled</dd>
            <dt>Pages:</dt>
            <dd>{site.Pages?.length || 0} pages</dd>
            <dt>Blog Posts:</dt>
            <dd>{site['Blog posts']?.length || 0} posts</dd>
            <dt>Listing Posts:</dt>
            <dd>{site['Listing posts']?.length || 0} listings</dd>
          </dl>
        </section>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">Raw Site Data:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(site, null, 2)}
        </pre>
      </div>
    </div>
  );
}
