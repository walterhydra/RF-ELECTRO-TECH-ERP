import React from 'react';
import { PackageCheck } from 'lucide-react';

export default function MobileDispatchPage() {
  return (
    <div className="space-y-6 text-center pt-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <PackageCheck className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-white">FQC & Dispatch Scanner</h1>
        <p className="text-xs text-slate-400">
          Ready for Phase 3 implementation. This screen will record final quality inspection certificates, generate packing slips, and log courier dispatch details.
        </p>
      </div>
    </div>
  );
}
