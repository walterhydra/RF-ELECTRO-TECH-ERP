'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Loading() {
  const pathname = usePathname() || '';
  
  const segments = pathname.split('/').filter(Boolean);
  let pageName = 'Workspace';
  
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    pageName = lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600 tracking-wide">
        Loading {pageName}...
      </p>
    </div>
  );
}
