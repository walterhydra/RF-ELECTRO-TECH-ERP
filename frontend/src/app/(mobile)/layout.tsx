import React from 'react';
import Link from 'next/link';
import { QrCode, ArrowLeft, Wifi } from 'lucide-react';

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
          <Link href="/dashboard" className="text-slate-400 hover:text-white">
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
      <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4">
        <Link href="/scan" className="flex flex-col items-center gap-1 text-amber-400">
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">SCAN QR</span>
        </Link>
        <Link href="/dispatch" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
          <span className="w-5 h-5 rounded border border-current flex items-center justify-center text-xs font-mono">↗</span>
          <span className="text-[10px] font-mono">DISPATCH</span>
        </Link>
      </footer>
    </div>
  );
}
