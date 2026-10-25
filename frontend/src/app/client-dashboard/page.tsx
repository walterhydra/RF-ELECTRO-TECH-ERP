'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, ShieldCheck, Layers, FileText, Truck } from 'lucide-react';

export default function ClientDashboardGateway() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect authenticated customer portal users or fallback after 2s
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const isCustomer = typeof window !== 'undefined' ? localStorage.getItem('isCustomerPortalUser') === 'true' : false;
    if (token && isCustomer) {
      router.replace('/portal/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl mx-auto flex items-center justify-center">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            RF ELECTRO TECH
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Customer Portal & Production Traceability Gateway
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Official Client Access</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Track your Purchase Orders, live PCB Job Card progress, stage movements, and download signed delivery challans in real time.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/portal/dashboard"
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <span>Enter Customer Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full py-3 px-6 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>Go to Staff ERP Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
