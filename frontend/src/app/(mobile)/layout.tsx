import React from 'react';
import Link from 'next/link';
import { QrCode, ArrowLeft, Wifi, Layers, Truck, BarChart3, LayoutDashboard } from 'lucide-react';

export default function MobileScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-md mx-auto border-x border-slate-800 shadow-2xl">
      {/* PWA App Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white" title="Back to Main Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm text-white font-mono">PWA FLOOR SCANNER</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
          <Wifi className="w-3 h-3" />
          <span>SYNCED</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom PWA Navigation */}
      <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-20">
        <Link href="/scan" className="flex flex-col items-center gap-0.5 text-amber-400 hover:text-amber-300">
          <QrCode className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold">SCAN QR</span>
        </Link>
        <Link href="/job-cards" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-mono">JOBS</span>
        </Link>
        <Link href="/dispatch" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <Truck className="w-4 h-4" />
          <span className="text-[10px] font-mono">DISPATCH</span>
        </Link>
        <Link href="/reports" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-mono">REPORTS</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] font-mono">MAIN ERP</span>
        </Link>
      </footer>
    </div>
  );
}
