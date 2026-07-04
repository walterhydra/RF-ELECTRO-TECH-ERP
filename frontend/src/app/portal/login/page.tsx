import React from 'react';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Globe } from 'lucide-react';

export default function PortalLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-slate-950">
            CP
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Customer Portal Login</h1>
            <p className="text-xs text-slate-400">Track your PCB orders in real-time</p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">COMPANY EMAIL</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="purchasing@electrotech.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">ACCESS PIN / PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <Link
            href="/portal/orders"
            className="w-full mt-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <span>View Active Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Strictly isolated customer view. Internal scrap and yield data redacted.
          </p>
        </div>
      </div>
    </div>
  );
}
