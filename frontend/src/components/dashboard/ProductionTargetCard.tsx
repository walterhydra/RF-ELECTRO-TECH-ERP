'use client';

import React from 'react';
import { 
  Target, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { ProductionGaugeData } from '@/services/dashboardService';

interface ProductionTargetCardProps {
  data: ProductionGaugeData;
}

export const ProductionTargetCard: React.FC<ProductionTargetCardProps> = ({ data }) => {
  const percent = Math.min(100, Math.max(0, data.progressPercent || 0));
  const isOnTrack = percent >= 80;
  
  // Circular gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Today's Production vs Target
            </h2>
            <p className="text-xs text-slate-500">Live floor throughput tracking</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
          isOnTrack 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnTrack ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{percent}% Achieved</span>
        </div>
      </div>

      {/* 2. Hero Section: Radial Ring + Primary Metric */}
      <div className="my-3.5 flex items-center justify-between gap-4">
        {/* Left: SVG Radial Progress Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 96 96">
            {/* Background circle track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Colored Progress Ring */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-lg font-black text-slate-900 leading-none">
              {percent}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
              Goal
            </span>
          </div>
        </div>

        {/* Right: Large Metric Counter & Progress Bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {data.currentSqm}
            </span>
            <span className="text-lg font-bold text-slate-400 font-mono">
              / {data.targetSqm}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              m²
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              {data.requiredToAchieve > 0 
                ? `${data.requiredToAchieve} m² remaining to hit target`
                : 'Target achieved! Exceeding daily plan'}
            </span>
          </div>

          {/* Progress Bar with Min/Max markers */}
          <div className="mt-2.5">
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1">
              <span>0 m²</span>
              <span className="font-semibold text-slate-600">Target: {data.minTarget} m²</span>
              <span>Max: {data.maxTarget} m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-Column Metric Stat Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        {/* Min Target */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Min Target
          </span>
          <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
            {data.minTarget} <span className="text-[10px] font-normal text-slate-500">m²</span>
          </div>
        </div>

        {/* Max Target */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Max Target
          </span>
          <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
            {data.maxTarget} <span className="text-[10px] font-normal text-slate-500">m²</span>
          </div>
        </div>

        {/* Required to Achieve */}
        <div className={`${
          data.requiredToAchieve > 0 
            ? 'bg-amber-50/70 border-amber-200 text-amber-800' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
        } border rounded-lg p-2 flex flex-col justify-between`}>
          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            {data.requiredToAchieve > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Remaining
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Surplus
              </>
            )}
          </span>
          <div className="text-sm font-bold mt-0.5 font-mono">
            {data.requiredToAchieve > 0 ? data.requiredToAchieve : '0.0'}{' '}
            <span className="text-[10px] font-normal opacity-75">m²</span>
          </div>
        </div>

        {/* Estimated EOD Production */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Est. EOD
          </span>
          <div className="text-sm font-bold text-emerald-700 mt-0.5 font-mono">
            {data.estimatedEodProduction}{' '}
            <span className="text-[10px] font-normal text-emerald-600">m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
