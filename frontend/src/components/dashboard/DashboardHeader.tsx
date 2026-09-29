'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Layers, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Radio,
  Building2,
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

  // Live ticking clock (1 second interval)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' | ' + now.toLocaleTimeString('en-US', {
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                Live Feed
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider">
                PCB MANUFACTURING PLANT
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              R.F. ELECTROTECH <span className="text-blue-400 font-light">|</span> <span className="text-slate-200">LIVE PRODUCTION DASHBOARD</span>
            </h1>
          </div>
        </div>

        {/* Right Controls: Live Clock, Shift Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Date & Time Clock */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-slate-200 shadow-inner">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs lg:text-sm font-mono font-medium tracking-wide">
              {currentDateTime || 'Loading live clock...'}
            </span>
          </div>

          {/* Shift Selector */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Shift:
            </span>
            {(['A Shift', 'B Shift', 'C Shift'] as const).map((s) => {
              const active = shift === s;
              return (
                <button
                  key={s}
                  onClick={() => onShiftChange(s)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* TV Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'TV Screen / Fullscreen View'}
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors shadow-inner"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Manual Refresh / Pulse */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Live Data"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 transition-all font-semibold text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
