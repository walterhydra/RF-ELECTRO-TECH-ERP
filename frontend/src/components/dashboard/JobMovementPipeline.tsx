'use client';

import React from 'react';
import { 
  ArrowRight, 
  Activity, 
  Truck, 
  PlayCircle, 
  Hourglass, 
  PauseCircle, 
  CheckCircle2,
  Boxes
} from 'lucide-react';
import { PipelineStageItem } from '@/services/dashboardService';

interface JobMovementPipelineProps {
  stages: PipelineStageItem[];
  todayDispatchedSqm: number;
}

export const JobMovementPipeline: React.FC<JobMovementPipelineProps> = ({
  stages,
  todayDispatchedSqm,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Job Movement — Live Status Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Real-time work-in-progress throughput across all 12 manufacturing stages
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 self-start sm:self-auto">
          <span className="flex items-center gap-1 text-emerald-400">
            <PlayCircle className="w-3.5 h-3.5" /> Running
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Hourglass className="w-3.5 h-3.5" /> Waiting
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-rose-400">
            <PauseCircle className="w-3.5 h-3.5" /> Hold
          </span>
        </div>
      </div>

      {/* Horizontal Flow Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex items-center gap-2 min-w-max">
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;
            const hasHold = stage.hold > 0;

            return (
              <React.Fragment key={stage.name}>
                {/* Stage Box */}
                <div
                  className={`w-36 rounded-xl border p-3 flex flex-col justify-between shadow-md transition-all hover:scale-105 duration-200 ${
                    stage.isDispatch
                      ? 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 border-emerald-500/40'
                      : hasHold
                      ? 'bg-slate-800/90 border-rose-500/40 hover:border-rose-400'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {/* Top Bar: Dept Name & Color Dot */}
                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-xs font-black text-white tracking-wider truncate">
                        {stage.name}
                      </span>
                    </div>
                    {stage.isDispatch && (
                      <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {/* Metric: Today's Sqm */}
                  <div className="my-2.5">
                    <div className="text-xl font-black text-white font-mono tracking-tight">
                      {stage.todaySqm}{' '}
                      <span className="text-xs font-normal text-slate-400">Sqm</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {stage.isDispatch ? "Today's Dispatched" : "Today's Output"}
                    </div>
                  </div>

                  {/* Bottom Breakdown (Running, Waiting, Hold) */}
                  {stage.isDispatch ? (
                    <div className="pt-1.5 border-t border-emerald-800/40 text-[10px] font-bold text-emerald-400 flex items-center justify-between">
                      <span>Ready to Ship</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold" title="Running Jobs">
                        R: {stage.running}
                      </span>
                      <span className="text-amber-400 font-medium" title="Waiting Jobs">
                        W: {stage.waiting}
                      </span>
                      <span
                        className={`font-bold ${
                          hasHold ? 'text-rose-400 font-black animate-pulse' : 'text-slate-500'
                        }`}
                        title="Held Jobs"
                      >
                        H: {stage.hold}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow connector */}
                {!isLast && (
                  <div className="text-slate-600 shrink-0 px-0.5">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
