'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PortTesting() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);

  const updateLocalDomains = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    
    try {
      const response = await fetch('/api/update-local-domains', {
        method: 'POST'
      });
      
      const result = await response.json();
      setUpdateResult(result);
    } catch (error) {
      setUpdateResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const sites = [
    { port: 3000, name: 'Site 1', url: 'http://localhost:3000', command: 'npm run dev:site1' },
    { port: 3001, name: 'Site 2', url: 'http://localhost:3001', command: 'npm run dev:site2' },
    { port: 3002, name: 'Site 3', url: 'http://localhost:3002', command: 'npm run dev:site3' },
    { port: 3003, name: 'Site 4', url: 'http://localhost:3003', command: 'npm run dev:site4' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Port-Based Site Testing</h1>
      
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>First, update the Airtable Local domain fields to use port-based detection:</li>
          <li>Then run different development servers on different ports</li>
          <li>Each port will automatically detect and show the corresponding site</li>
        </ol>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Step 1: Update Airtable Local Domains</h2>
        <button
          onClick={updateLocalDomains}
          disabled={isUpdating}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update Local Domains in Airtable'}
        </button>
        
        {updateResult && (
          <div className={`mt-4 p-4 rounded ${updateResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {updateResult.success ? (
              <div>
                <p className="font-semibold text-green-800">✅ Success!</p>
                <p className="text-green-700">{updateResult.message}</p>
                {updateResult.updates && (
                  <ul className="mt-2 space-y-1">
                    {updateResult.updates.map((update: any, index: number) => (
                      <li key={index} className="text-sm text-green-600">
                        {update.siteName}: {update.localDomain}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold text-red-800">❌ Error</p>
                <p className="text-red-700">{updateResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Step 2: Run Development Servers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <div key={site.port} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{site.name} (Port {site.port})</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Command:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{site.command}</code></p>
                <p><strong>URL:</strong> <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{site.url}</a></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Each port (3000, 3001, 3002, 3003) maps to a different site in Airtable</li>
          <li>The system detects the port number and loads the corresponding site configuration</li>
          <li>In production, it will still use the Domain field for site detection</li>
          <li>This allows you to test multiple sites locally without modifying hosts files</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Testing Tools</h2>
        <div className="space-y-2">
          <Link 
            href="/api/test-site?domain=localhost:3000"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
          >
            Test Site 1 API (Port 3000)
          </Link>
          <Link 
            href="/api/test-site?domain=localhost:3001"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
          >
            Test Site 2 API (Port 3001)
          </Link>
        </div>
      </div>

      <div className="text-center">
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