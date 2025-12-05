'use client';

import Link from 'next/link';
import { useSite } from '@/contexts/site';

export default function NotFound() {
  const { site } = useSite();

  return (
    <div 
      className="min-h-[60vh] flex items-center justify-center px-4"
      style={{ 
        backgroundColor: 'var(--background-color)',
        fontFamily: 'var(--font-body)'
      }}
    >
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Number - Large and prominent */}
        <h1 
          className="text-8xl md:text-9xl font-bold mb-6"
          style={{ 
            color: 'var(--text-color)',
            fontFamily: 'var(--font-heading)',
            opacity: 0.2
          }}
        >
          404
        </h1>

        {/* Main message */}
        <h2 
          className="text-2xl md:text-3xl font-semibold mb-4"
          style={{ 
            color: 'var(--text-color)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          That didn&apos;t work out as expected
        </h2>

        {/* Subtitle */}
        <p 
          className="text-lg mb-8"
          style={{ 
            color: 'var(--muted-color)',
            fontFamily: 'var(--font-body)'
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Call to action - Return home */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/"
            className="btn-primary"
          >
            Return home
          </Link>

          {/* Optional: Back button */}
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go back
          </button>
        </div>

        {/* Optional: Popular links */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--muted-color)' }}
          >
            Or try one of these:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link 
              href="/blog"
              className="text-sm hover:underline"
              style={{ color: 'var(--text-color)' }}
            >
              Blog
            </Link>
            {site?.['Site URL'] && (
              <>
                <span style={{ color: 'var(--muted-color)' }}>•</span>
                <Link 
                  href="/"
                  className="text-sm hover:underline"
                  style={{ color: 'var(--text-color)' }}
                >
                  Home
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

