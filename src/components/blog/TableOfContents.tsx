'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  collapsible?: boolean;
}

export default function TableOfContents({ content, className = '', collapsible = false }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(!collapsible);

  useEffect(() => {
    // Parse headings from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const items: TOCItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      const id = heading.id || `heading-${index}`;
      
      // Set ID on heading if it doesn't have one
      if (!heading.id) {
        heading.id = id;
      }
      
      items.push({ id, text, level });
    });
    
    setTocItems(items);
  }, [content]);

  useEffect(() => {
    // Track active heading on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  if (tocItems.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-3 hover:text-[var(--primary-color)] transition-colors"
          style={{ 
            color: 'var(--text-color)',
            fontFamily: 'var(--font-heading)',
            fontWeight: '600'
          }}
        >
          <span>Table of Contents</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <h3 
          className="mb-3"
          style={{ 
            color: 'var(--text-color)',
            fontFamily: 'var(--font-heading)',
            fontWeight: '600'
          }}
        >
          Table of Contents
        </h3>
      )}
      
      {isExpanded && (
        <nav>
          <ul className="space-y-2">
            {tocItems.map(({ id, text, level }) => (
              <li key={id} style={{ marginLeft: `${(level - 1) * 12}px` }}>
                <button
                  onClick={() => scrollToHeading(id)}
                  className={`text-left text-sm hover:text-[var(--primary-color)] transition-colors duration-200 ${
                    activeId === id ? 'font-medium' : ''
                  }`}
                  style={{ 
                    color: activeId === id ? 'var(--primary-color)' : 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
} 