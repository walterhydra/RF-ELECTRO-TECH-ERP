'use client';

import React from 'react';
import { 
  Target, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { ProductionGaugeData } from '@/services/dashboardService';

interface ProductionTargetCardProps {
  data: ProductionGaugeData;
}

export const ProductionTargetCard: React.FC<ProductionTargetCardProps> = ({ data }) => {
  const percent = Math.min(100, Math.max(0, data.progressPercent));
  const isTargetAchieved = data.currentSqm >= data.minTarget;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Today's Production vs Target
              </h2>
              <p className="text-xs text-slate-400">Live floor sqm throughput tracking</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
            {percent}% Achieved
          </span>
        </div>

        {/* Large Production Counter */}
        <div className="my-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              {data.currentSqm}
            </span>
            <span className="text-2xl lg:text-3xl font-bold text-slate-500">
              / {data.targetSqm}
            </span>
            <span className="text-sm font-bold text-amber-400 ml-1">Sqm</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
            <TrendingUp className="w-4 h-4" />
            <span>+14% vs Yesterday</span>
          </div>
        </div>

        {/* Dynamic Gradient Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Progress towards Minimum Target (150 Sqm)
            </span>
            <span className="font-mono text-amber-300 font-bold">{percent}%</span>
          </div>
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-1000 shadow-lg shadow-orange-500/30"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4-Column Stat Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        {/* Min Target */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Min Target
          </span>
          <div className="text-lg font-black text-white mt-1">
            {data.minTarget} <span className="text-xs font-normal text-slate-400">Sqm</span>
          </div>
        </div>

        {/* Max Target */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Max Target
          </span>
          <div className="text-lg font-black text-white mt-1">
            {data.maxTarget} <span className="text-xs font-normal text-slate-400">Sqm</span>
          </div>
        </div>

        {/* Required to Achieve (Highlighted Red) */}
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex flex-col justify-between shadow-inner">
          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Req to Goal
          </span>
          <div className="text-lg font-black text-rose-400 mt-1">
            {data.requiredToAchieve} <span className="text-xs font-normal text-rose-300/80">Sqm</span>
          </div>
        </div>

        {/* Estimated EOD Production (Highlighted Green) */}
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex flex-col justify-between shadow-inner">
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Est. EOD
          </span>
          <div className="text-lg font-black text-emerald-400 mt-1">
            {data.estimatedEodProduction} <span className="text-xs font-normal text-emerald-300/80">Sqm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
