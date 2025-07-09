import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm overflow-x-auto scrollbar-hide ${className}`} 
      aria-label="Breadcrumb"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center flex-shrink-0">
          {index > 0 && (
            <ChevronRightIcon 
              className="h-3 w-3 mx-1" 
              style={{ color: 'var(--muted-color)' }}
            />
          )}
          
          {item.href && index < items.length - 1 ? (
            <Link 
              href={item.href}
              className="hover:text-[var(--primary-color)] transition-colors duration-200 whitespace-nowrap"
              style={{ 
                color: 'var(--muted-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={`whitespace-nowrap ${index === items.length - 1 ? 'font-medium' : ''}`}
              style={{ 
                color: index === items.length - 1 ? 'var(--text-color)' : 'var(--muted-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
} 