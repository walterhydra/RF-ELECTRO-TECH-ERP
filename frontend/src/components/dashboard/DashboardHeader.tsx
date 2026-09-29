'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Clock, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Radio,
  Tv
} from 'lucide-react';

interface DashboardHeaderProps {
  shift: string;
  onShiftChange: (shift: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: string;
  isAutoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  shift,
  onShiftChange,
  onRefresh,
  isLoading,
  lastUpdated,
  isAutoRefreshEnabled,
  onToggleAutoRefresh,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' • ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentDateTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-4">
          <div className="h-14 lg:h-16 flex items-center justify-center shrink-0">
            <Image
              src="/Assets/Screenshot_2026-07-04_162637-removebg-preview.png"
              alt="RF Electrotech Logo"
              width={200}
              height={60}
              className="h-12 lg:h-14 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Shop Floor Operations
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              R.F. ELECTROTECH <span className="text-slate-300 font-normal">|</span> Live Production Dashboard
            </h1>
          </div>
        </div>

        {/* Right Controls: Live Clock, Shift Selector, TV Mode & Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Date & Time Clock */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-mono font-medium shadow-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{currentDateTime || 'Loading...'}</span>
          </div>

          {/* Premium iOS-style Shift Selector Segmented Control */}
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-xs gap-0.5">
            <div className="px-2 py-0.5 flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Shift</span>
            </div>
            {(['A Shift', 'B Shift', 'C Shift'] as const).map((s) => {
              const active = shift === s;
              return (
                <button
                  key={s}
                  onClick={() => onShiftChange(s)}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 select-none ${
                    active
                      ? 'bg-white text-blue-700 font-bold shadow-sm border border-slate-200/80 ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>

          {/* TV Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit TV Mode (Esc)' : 'Enter TV Display Fullscreen Mode'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300 transition-all font-semibold text-xs active:scale-95"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Exit TV</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">TV Mode</span>
              </>
            )}
          </button>

          {/* Live Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Live Data"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all font-semibold text-xs active:scale-95 disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
