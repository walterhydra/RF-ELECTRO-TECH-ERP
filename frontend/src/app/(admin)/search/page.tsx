'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Searching database...</h2>
        <p className="text-slate-500 text-sm mt-2">Compiling results for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Search Results</h1>
        <p className="text-slate-500 mt-2">Showing results for: <span className="font-semibold text-slate-700">"{query}"</span></p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Global Search Module</h2>
        <p className="text-slate-500 max-w-md">
          The full search results page is currently under development. It will feature advanced filtering, sorting, and pagination for all system records.
        </p>
      </div>
    </div>
  );
}
