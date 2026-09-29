'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Clock, 
  Calendar,
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Radio,
  Tv,
  CheckCircle2,
  Activity
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
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedCurrentShift, setDetectedCurrentShift] = useState<string>('A Shift');

  // Live ticking clock & Auto-shift detection
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Date formatting: Tue, 29 Sep 2026
      const dateFormatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Time formatting: 09:48:40 PM
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setCurrentDateStr(dateFormatted);
      setCurrentTimeStr(timeFormatted);

      // Auto detect shift
      const hour = now.getHours();
      let autoShift = 'A Shift';
      if (hour >= 6 && hour < 14) {
        autoShift = 'A Shift';
      } else if (hour >= 14 && hour < 22) {
        autoShift = 'B Shift';
      } else {
        autoShift = 'C Shift';
      }
      setDetectedCurrentShift(autoShift);
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

  const shiftDetails: Record<string, { label: string; timing: string; range: string }> = {
    'A Shift': { label: 'A Shift', timing: '06:00 AM – 02:00 PM', range: '06:00 - 14:00' },
    'B Shift': { label: 'B Shift', timing: '02:00 PM – 10:00 PM', range: '14:00 - 22:00' },
    'C Shift': { label: 'C Shift', timing: '10:00 PM – 06:00 AM', range: '22:00 - 06:00' },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 lg:p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        
        {/* Left: RF Electrotech Official Logo & Executive Header */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <Image
              src="/Assets/logo-1.png"
              alt="RF Electrotech"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          <div className="border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                SHOP FLOOR TELEMETRY
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                Process Flow PF-01 • MES Live Monitor
              </span>
            </div>
            <h1 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
              R.F. ELECTROTECH <span className="text-slate-300 font-normal">|</span> Live Production Dashboard
            </h1>
          </div>
        </div>

        {/* Right: Clean Time Badge, Working Shift Selector & Sync Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Live Date & Time Display */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium border-r border-slate-200 pr-2.5 mr-2.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentDateStr || 'Tue, Sep 29, 2026'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentTimeStr || '09:48:40 PM'}</span>
            </div>
          </div>

          {/* Proper Working Shift Selector with Live Timing */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
              Shift:
            </span>
            {(['A Shift', 'B Shift', 'C Shift'] as const).map((s) => {
              const active = shift === s;
              const isAuto = detectedCurrentShift === s;

              return (
                <button
                  key={s}
                  onClick={() => onShiftChange(s)}
                  title={`${s} (${shiftDetails[s].timing})`}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{s.split(' ')[0]}</span>
                  {isAuto && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        active ? 'bg-emerald-300' : 'bg-emerald-500'
                      }`}
                      title="Current Live Time Shift"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Fullscreen TV Mode */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen / TV Screen Mode'}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Sync Live Button */}
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
