'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Camera, ArrowRight, Search, AlertTriangle, Loader2, Package, ScanLine } from 'lucide-react';

const API = 'http://localhost:3001/api/v1';

export default function MobileScanPage() {
  const router = useRouter();
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveQrCode = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setLastResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/sub-job-cards/qr-lookup/${encodeURIComponent(value.trim())}`, { headers });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `QR lookup failed (${res.status})`);
      }

      const data = await res.json();
      setLastResult(data);

      // Navigate to stage-update with the resolved sub-job-card ID
      if (data.id) {
        setTimeout(() => {
          router.push(`/stage-update/${data.id}`);
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveQrCode(manualInput);
  };

  return (
    <div className="space-y-6 text-center h-full pb-8">
      {/* Scanner Viewfinder Area */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-amber-500/10 blur-[60px] pointer-events-none rounded-full" />
        
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Camera className="w-7 h-7" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Scan QR Code</h1>
            <p className="text-sm text-slate-400 font-medium">
              Point camera at the Job Card sticker
            </p>
          </div>

          {/* High-Tech Viewfinder */}
          <div className="relative aspect-square max-w-[260px] mx-auto mt-6 bg-slate-950/50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
            {/* Viewfinder Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500 rounded-tl-lg opacity-80" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500 rounded-tr-lg opacity-80" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500 rounded-bl-lg opacity-80" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500 rounded-br-lg opacity-80" />
            
            {/* Laser Animation */}
            <div className="absolute left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)] top-[10%] animate-scan" />
            
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            <QrCode className="w-20 h-20 text-slate-700/50 z-0" />
          </div>
        </div>
      </div>

      {/* Manual Search Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 space-y-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ScanLine className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-mono font-bold text-slate-300 tracking-wider">
            MANUAL ENTRY
          </h3>
        </div>
        
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR value or ID..."
              className="w-full pl-11 pr-4 h-14 bg-slate-950/80 border border-slate-800 rounded-2xl text-base text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="w-14 h-14 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-2xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:shadow-none hover:scale-105 active:scale-95 duration-200"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-start gap-3 text-sm text-red-400 backdrop-blur-sm">
            <div className="p-1 rounded-full bg-red-500/20 shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-medium mt-0.5">{error}</span>
          </div>
        )}

        {/* Success Preview */}
        {lastResult && !error && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 space-y-3 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider">MATCH FOUND</span>
            </div>
            
            <div className="text-left text-sm text-slate-200 font-mono space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ID</span>
                <span className="font-bold text-white text-base">{lastResult.subJobCardNo || lastResult.jobCardNo || lastResult.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className="text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">{lastResult.status}</span>
              </div>
              {lastResult.qty && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-white">{lastResult.qty}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono font-medium pt-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>NAVIGATING TO UPDATE STAGE...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 font-medium opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        STAGE OPERATOR SCOPE ENFORCED
      </div>
    </div>
  );
}
