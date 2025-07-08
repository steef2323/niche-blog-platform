import Link from 'next/link';

export default function SiteSwitcher() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Site Switcher - Testing Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Site 1: "sip and paints"</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p><strong>Domain:</strong> sipandpaints.nl</p>
            <p><strong>Local:</strong> site1.local</p>
            <p><strong>ID:</strong> recORZQLJbwzLsVU0</p>
          </div>
          
          <div className="space-y-2">
            <Link 
              href="/api/test-site?domain=site1.local"
              className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Test Site 1 API
            </Link>
            
            <p className="text-xs text-gray-500 text-center">
              Currently showing on localhost:3000
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Site 2: "sip en paints"</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p><strong>Domain:</strong> sipenpaints.nl</p>
            <p><strong>Local:</strong> site2.local</p>
            <p><strong>ID:</strong> recnn2AatU9qhOKxF</p>
          </div>
          
          <div className="space-y-2">
            <Link 
              href="/api/test-site?domain=site2.local"
              className="block w-full text-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Test Site 2 API
            </Link>
            
            <div className="text-xs text-gray-500 text-center">
              <p>To see this site in browser:</p>
              <p>Add "127.0.0.1 site2.local" to /etc/hosts</p>
              <p>Then visit site2.local:3000</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">How to test different sites:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Use the API test buttons above to see the data for each site</li>
          <li>To see Site 2 in the browser, add the hosts entry and visit site2.local:3000</li>
          <li>Both sites currently show the same fallback content since no blog/listing posts exist yet</li>
          <li>Add content to Airtable to see different sections appear</li>
        </ol>
      </div>

      <div className="mt-6 text-center">
        <Link 
          href="/"
          className="inline-block bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
} 