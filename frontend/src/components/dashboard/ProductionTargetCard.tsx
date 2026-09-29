'use client';

import React from 'react';
import { 
  Target, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { ProductionGaugeData } from '@/services/dashboardService';

interface ProductionTargetCardProps {
  data: ProductionGaugeData;
}

export const ProductionTargetCard: React.FC<ProductionTargetCardProps> = ({ data }) => {
  const percent = Math.min(100, Math.max(0, data.progressPercent));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
                Today's Production vs Target
              </h2>
              <p className="text-xs text-slate-500">Live floor sqm throughput tracking</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {percent}% Achieved
          </span>
        </div>

        {/* Large Production Counter */}
        <div className="my-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {data.currentSqm}
            </span>
            <span className="text-xl lg:text-2xl font-bold text-slate-400">
              / {data.targetSqm}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sqm</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>On Pace</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Minimum Target: {data.minTarget} Sqm
            </span>
            <span className="font-mono font-bold text-slate-800">{percent}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4-Column Stat Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {/* Min Target */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Min Target
          </span>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {data.minTarget} <span className="text-xs font-normal text-slate-500">m²</span>
          </div>
        </div>

        {/* Max Target */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Max Target
          </span>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {data.maxTarget} <span className="text-xs font-normal text-slate-500">m²</span>
          </div>
        </div>

        {/* Required to Achieve */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Required
          </span>
          <div className="text-base font-bold text-rose-700 mt-0.5">
            {data.requiredToAchieve} <span className="text-xs font-normal text-rose-600">m²</span>
          </div>
        </div>

        {/* Estimated EOD Production */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Est. EOD
          </span>
          <div className="text-base font-bold text-emerald-700 mt-0.5">
            {data.estimatedEodProduction} <span className="text-xs font-normal text-emerald-600">m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
