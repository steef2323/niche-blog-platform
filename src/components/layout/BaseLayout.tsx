'use client';

import React, { ReactNode } from 'react';
import Header from './Header';
import { useSite } from '@/contexts/site';

interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function BaseLayout({ children, className = '' }: BaseLayoutProps) {
  const { site } = useSite();

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading site configuration...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <Header />
      
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer will be implemented in a separate task */}
    </div>
  );
} 