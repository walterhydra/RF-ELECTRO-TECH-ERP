'use client';

import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Truck,
  PackageCheck
} from 'lucide-react';
import { PipelineStageItem } from '@/services/dashboardService';

interface JobMovementPipelineProps {
  stages: PipelineStageItem[];
  todayDispatchedSqm: number;
}

// Fixed standard stage color map matching user's design
const stageColorPalette: Record<string, string> = {
  'SHEARING': '#2563EB', // Blue
  'DRILLING': '#16A34A', // Forest Green
  'DML': '#EA580C',      // Orange
  'PIT': '#6366F1',      // Indigo/Purple
  'EPL': '#E11D48',      // Rose/Red
  'SES': '#0D9488',      // Teal/Cyan
  'PISM': '#D97706',     // Amber/Gold
  'LP': '#0284C7',       // Sky Blue
  'HASL': '#7C3AED',     // Violet
  'RT': '#475569',       // Slate Gray
  'BBT': '#78350F',      // Rust Brown
  'DISPATCH': '#15803D', // Dark Green
};

export const JobMovementPipeline: React.FC<JobMovementPipelineProps> = ({
  stages,
  todayDispatchedSqm,
}) => {
  // Filter out the dispatch node from stages array if backend included it
  const processStages = stages.filter(s => !s.isDispatch);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
          <Layers className="w-4 h-4" />
        </div>
        <h2 className="text-sm lg:text-base font-bold text-slate-900">
          Job Movement – Live Status
        </h2>
      </div>

      {/* Horizontal Flow Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
        <div className="flex items-center gap-2 min-w-max">
          {processStages.map((stage, index) => {
            const shortCode = (stage.shortCode || stage.name || '').toUpperCase().replace(/^\d+\.\s*/, '');
            const bannerColor = stageColorPalette[shortCode] || stage.color || '#3B82F6';

            return (
              <React.Fragment key={stage.name || index}>
                {/* Stage Card */}
                <div className="w-28 lg:w-32 rounded-xl overflow-hidden shadow-xs border border-slate-200/90 bg-white flex flex-col shrink-0">
                  {/* Top Colored Header Banner */}
                  <div
                    className="py-1.5 px-2 text-center text-white text-xs font-black tracking-wider uppercase truncate"
                    style={{ backgroundColor: bannerColor }}
                  >
                    {shortCode}
                  </div>

                  {/* Card Body */}
                  <div className="p-2.5 flex flex-col items-center justify-center text-center">
                    {/* Sqm Output */}
                    <div className="text-sm lg:text-base font-extrabold text-slate-900 font-mono">
                      {stage.todaySqm || 0} <span className="text-[11px] font-bold text-slate-600">Sqm</span>
                    </div>

                    {/* Stats */}
                    <div className="mt-1.5 space-y-0.5 text-[11px] font-medium text-slate-600">
                      <div>Running: <span className="font-semibold text-slate-800">{stage.running || 0}</span></div>
                      <div>Waiting: <span className="font-semibold text-slate-800">{stage.waiting || 0}</span></div>
                      <div className={stage.hold > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Hold: <span>{stage.hold || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="text-slate-600 px-0.5 shrink-0">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </React.Fragment>
            );
          })}

          {/* Final Node: DISPATCH */}
          <div className="w-28 lg:w-32 rounded-xl overflow-hidden shadow-xs border border-green-300 bg-white flex flex-col shrink-0">
            {/* Dispatch Header Banner */}
            <div className="py-1.5 px-2 text-center text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 bg-green-700">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>DISPATCH</span>
            </div>

            {/* Dispatch Card Body */}
            <div className="p-2.5 flex flex-col items-center justify-center text-center">
              <Truck className="w-5 h-5 text-green-600 my-0.5" />
              <div className="text-[10px] font-semibold text-slate-500">
                Dispatched Today
              </div>
              <div className="text-sm lg:text-base font-black text-slate-900 font-mono mt-0.5">
                {todayDispatchedSqm || 0} <span className="text-[11px] font-bold text-slate-600">Sqm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
