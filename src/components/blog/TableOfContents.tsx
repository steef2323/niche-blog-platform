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

  // Helper function to create a slug from text
  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  useEffect(() => {
    // Read headings directly from the DOM instead of parsing HTML string
    // This ensures we get the actual rendered headings with their IDs
    const extractHeadingsFromDOM = () => {
      const contentContainers = document.querySelectorAll('[data-blog-content]');
      if (contentContainers.length === 0) {
        console.warn('No [data-blog-content] containers found');
        return [];
      }
      
      const items: TOCItem[] = [];
      const seenIds = new Set<string>();
      
      contentContainers.forEach((contentContainer) => {
        const domHeadings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
        domHeadings.forEach((domHeading, index) => {
          const level = parseInt(domHeading.tagName.charAt(1));
          const text = domHeading.textContent || '';
          
          if (!text.trim()) return; // Skip empty headings
          
          // Get or create ID
          let id = domHeading.id;
          if (!id) {
            id = createSlug(text) || `heading-${index}`;
            // Ensure unique ID
            let uniqueId = id;
            let counter = 1;
            while (seenIds.has(uniqueId)) {
              uniqueId = `${id}-${counter}`;
              counter++;
            }
            id = uniqueId;
            domHeading.id = id;
            console.log(`✅ Set ID "${id}" on heading: "${text.substring(0, 50)}"`);
          }
          
          seenIds.add(id);
          items.push({ id, text, level });
        });
      });
      
      return items;
    };
    
    // Try to extract headings immediately
    let items = extractHeadingsFromDOM();
    
    // If no headings found, wait for DOM to be ready
    if (items.length === 0) {
      const timeoutId1 = setTimeout(() => {
        items = extractHeadingsFromDOM();
        if (items.length > 0) {
          setTocItems(items);
        }
      }, 100);
      
      const timeoutId2 = setTimeout(() => {
        items = extractHeadingsFromDOM();
        if (items.length > 0) {
          setTocItems(items);
        }
      }, 500);
      
      const timeoutId3 = setTimeout(() => {
        items = extractHeadingsFromDOM();
        if (items.length > 0) {
          setTocItems(items);
        } else {
          console.warn('⚠️ No headings found in DOM after multiple attempts');
        }
      }, 1000);
      
      setTocItems(items);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
    
    setTocItems(items);
    return undefined;
  }, [content]);

  useEffect(() => {
    if (tocItems.length === 0) {
      console.log('⚠️ No TOC items to observe');
      return;
    }

    console.log(`📋 Setting up IntersectionObserver for ${tocItems.length} headings:`, 
      tocItems.map(item => ({ id: item.id, text: item.text.substring(0, 30) })));

    // Use IntersectionObserver to track which heading is currently in view
    const observer = new IntersectionObserver(
      (entries) => {
        // Find all visible headings
        const visibleHeadings = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => ({
            id: entry.target.id,
            ratio: entry.intersectionRatio,
            top: entry.boundingClientRect.top
          }))
          .sort((a, b) => {
            // Sort by intersection ratio (most visible first), then by position (topmost first)
            if (Math.abs(a.ratio - b.ratio) > 0.1) {
              return b.ratio - a.ratio;
            }
            return a.top - b.top;
          });

        if (visibleHeadings.length > 0) {
          const newActiveId = visibleHeadings[0].id;
          setActiveId(prevId => {
            if (prevId !== newActiveId) {
              console.log(`📍 Active heading changed to: "${newActiveId}" (ratio: ${visibleHeadings[0].ratio.toFixed(2)})`);
              return newActiveId;
            }
            return prevId;
          });
        }
      },
      { 
        rootMargin: '-120px 0% -70% 0%', // Account for header and trigger when heading is near top
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all headings
    const observedElements: Element[] = [];
    tocItems.forEach(({ id }) => {
      let element = document.getElementById(id);
      
      // If not found, search in data-blog-content containers
      if (!element) {
        const containers = document.querySelectorAll('[data-blog-content]');
        for (const container of containers) {
          element = container.querySelector(`#${id}`) as HTMLElement;
          if (element) break;
        }
      }
      
      if (element) {
        observer.observe(element);
        observedElements.push(element);
        console.log(`✅ Observing heading: "${id}"`);
      } else {
        console.warn(`⚠️ Could not find element with ID "${id}" to observe`);
      }
    });

    console.log(`✅ Observing ${observedElements.length} of ${tocItems.length} headings`);

    // Fallback scroll handler for edge cases
    const handleScroll = () => {
      const headerOffset = 150;
      const scrollPosition = window.scrollY + headerOffset;
      
      // Find the heading that's currently closest to the top of the viewport
      let activeHeading = '';
      let minDistance = Infinity;

      tocItems.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const distance = Math.abs(elementTop - scrollPosition);
          
          // If heading is above the scroll position and closer than previous
          if (elementTop <= scrollPosition && distance < minDistance) {
            minDistance = distance;
            activeHeading = id;
          }
        }
      });

      // If we're at the top, activate the first heading
      if (scrollPosition < 200 && tocItems.length > 0) {
        activeHeading = tocItems[0].id;
      }

      if (activeHeading) {
        setActiveId(activeHeading);
      }
    };

    // Use scroll handler as backup (throttled)
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    // Handle URL hash changes (e.g., when page loads with a hash or hash changes)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash && tocItems.some(item => item.id === hash)) {
        setActiveId(hash);
        // Scroll to the element if it exists
        const element = document.getElementById(hash);
        if (element) {
          const headerOffset = 120;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }
    };

    // Check hash on mount
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('hashchange', handleHashChange);
      clearTimeout(scrollTimeout);
    };
  }, [tocItems]);

  if (tocItems.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    console.log(`🔍 Attempting to scroll to heading with ID: "${id}"`);
    
    // Try to find the element
    let element = document.getElementById(id);
    
    // If not found, try searching in data-blog-content containers
    if (!element) {
      const containers = document.querySelectorAll('[data-blog-content]');
      for (const container of containers) {
        element = container.querySelector(`#${id}`) as HTMLElement;
        if (element) break;
      }
    }
    
    if (element) {
      console.log(`✅ Found element for ID "${id}":`, element.textContent?.substring(0, 50));
      
      // Account for fixed header if present
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Update active state immediately for better UX
      setActiveId(id);
      console.log(`✅ Set active ID to: "${id}"`);
      
      // Scroll to the element
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      // Update URL hash after a short delay to avoid scroll jump
      setTimeout(() => {
        const currentHash = window.location.hash;
        if (currentHash !== `#${id}`) {
          window.history.pushState(null, '', `#${id}`);
        }
      }, 100);
    } else {
      console.error(`❌ Heading with id "${id}" not found in DOM.`);
      console.log('Available headings in TOC:', tocItems.map(item => ({ id: item.id, text: item.text.substring(0, 30) })));
      
      // Try to find headings in DOM
      const allHeadings = document.querySelectorAll('[data-blog-content] h1, [data-blog-content] h2, [data-blog-content] h3, [data-blog-content] h4, [data-blog-content] h5, [data-blog-content] h6');
      console.log('Headings found in DOM:', Array.from(allHeadings).map(h => ({ 
        id: h.id, 
        text: h.textContent?.substring(0, 30),
        tag: h.tagName 
      })));
    }
  };

  return (
    <div 
      className={`rounded-lg p-4 ${className}`}
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        color: 'var(--card-text)'
      }}
    >
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
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHeading(id);
                  }}
                  className={`text-left text-sm hover:opacity-80 transition-all duration-200 w-full cursor-pointer ${
                    activeId === id ? 'font-bold' : 'font-normal'
                  }`}
                  style={{ 
                    color: activeId === id ? 'var(--text-color)' : 'var(--muted-color)',
                    fontFamily: 'var(--font-body)',
                    borderLeft: activeId === id ? '3px solid var(--text-color)' : '3px solid transparent',
                    paddingLeft: activeId === id ? '12px' : '15px',
                    marginLeft: activeId === id ? '-3px' : '0',
                    fontWeight: activeId === id ? '700' : '400',
                    opacity: activeId === id ? 1 : 0.7
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