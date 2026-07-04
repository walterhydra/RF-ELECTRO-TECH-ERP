'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Wrench, Package, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function GenericDetailsPage() {
  const pathname = usePathname();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data fetching delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Extract info from path
  const isJobCard = pathname.includes('job-cards');
  const isPO = pathname.includes('purchase-orders');
  const isSpecCard = pathname.includes('spec-cards');
  
  let title = 'Details Page';
  let icon = <FileText className="w-8 h-8 text-blue-500" />;
  
  if (isJobCard) {
    title = `Job Card #${params.id}`;
    icon = <Wrench className="w-8 h-8 text-amber-500" />;
  } else if (isPO) {
    title = `Purchase Order #${params.id}`;
    icon = <Package className="w-8 h-8 text-emerald-500" />;
  } else if (isSpecCard) {
    title = `Spec Card #${params.id}`;
    icon = <FileText className="w-8 h-8 text-purple-500" />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Loading {title}...</h2>
        <p className="text-slate-500 text-sm mt-2">Fetching data securely</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-8 flex items-center gap-4 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="text-slate-500 text-sm mt-1">Detailed view and management module</p>
          </div>
        </div>
        
        <div className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Construction</h2>
          <p className="text-slate-500 max-w-md">
            The detailed view for <strong>{title}</strong> is currently being built. 
            Once completed, you will be able to manage all related data, statuses, and logs right here.
          </p>
        </div>
      </div>
    </div>
  );
}
