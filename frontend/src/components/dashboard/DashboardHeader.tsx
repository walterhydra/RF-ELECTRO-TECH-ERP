'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Layers, 
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
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Plant Feed
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Process Flow PF-01
              </span>
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              R.F. ELECTROTECH <span className="text-slate-300 font-normal">|</span> Live Production Dashboard
            </h1>
          </div>
        </div>

        {/* Right Controls: Live Clock, Shift Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Date & Time Clock */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDateTime || 'Loading clock...'}</span>
          </div>

          {/* Shift Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
              Shift:
            </span>
            {(['A Shift', 'B Shift', 'C Shift'] as const).map((s) => {
              const active = shift === s;
              return (
                <button
                  key={s}
                  onClick={() => onShiftChange(s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    active
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
            title={isFullscreen ? 'Exit Fullscreen' : 'TV Screen View'}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Live Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all font-semibold text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
