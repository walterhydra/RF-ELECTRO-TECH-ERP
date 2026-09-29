'use client';

import React from 'react';
import { 
  ArrowRight, 
  Activity, 
  Truck, 
  PlayCircle, 
  Hourglass, 
  PauseCircle, 
  CheckCircle2 
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Job Movement — Live Status Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Real-time work-in-progress throughput across all 12 manufacturing stages
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <span className="flex items-center gap-1 text-emerald-700">
            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" /> Running
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-amber-700">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" /> Waiting
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-rose-700">
            <PauseCircle className="w-3.5 h-3.5 text-rose-600" /> Hold
          </span>
        </div>
      </div>

      {/* Horizontal Flow */}
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
        <div className="flex items-center gap-2 min-w-max">
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;
            const hasHold = stage.hold > 0;

            return (
              <React.Fragment key={stage.name}>
                {/* Stage Box */}
                <div
                  className={`w-32 rounded-lg border p-2.5 flex flex-col justify-between transition-all ${
                    stage.isDispatch
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : hasHold
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Dept Name & Color */}
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-900 tracking-wider truncate">
                        {stage.name}
                      </span>
                    </div>
                    {stage.isDispatch && (
                      <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  {/* Metric: Today's Sqm */}
                  <div className="my-1.5">
                    <div className="text-lg font-bold text-slate-900 font-mono">
                      {stage.todaySqm}{' '}
                      <span className="text-[10px] font-normal text-slate-500">m²</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {stage.isDispatch ? "Today's Ship" : "Output"}
                    </div>
                  </div>

                  {/* Bottom Breakdown (Running, Waiting, Hold) */}
                  {stage.isDispatch ? (
                    <div className="pt-1 border-t border-emerald-200 text-[10px] font-bold text-emerald-700 flex items-center justify-between">
                      <span>Ready</span>
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-700 font-bold" title="Running Jobs">
                        R:{stage.running}
                      </span>
                      <span className="text-amber-700 font-medium" title="Waiting Jobs">
                        W:{stage.waiting}
                      </span>
                      <span
                        className={`font-bold ${
                          hasHold ? 'text-rose-700 font-black' : 'text-slate-400'
                        }`}
                        title="Held Jobs"
                      >
                        H:{stage.hold}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className="text-slate-400 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
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
