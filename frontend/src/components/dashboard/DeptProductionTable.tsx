'use client';

import React from 'react';
import { 
  Layers, 
  PlayCircle, 
  PauseCircle, 
  Hourglass 
} from 'lucide-react';
import { DeptProductionRow } from '@/services/dashboardService';

interface DeptProductionTableProps {
  data: DeptProductionRow[];
}

export const DeptProductionTable: React.FC<DeptProductionTableProps> = ({ data }) => {
  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black flex items-center justify-center text-[10.5px] border border-amber-300 shadow-2xs shrink-0 font-mono">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 font-black flex items-center justify-center text-[10.5px] border border-slate-300 shadow-2xs shrink-0 font-mono">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-800 font-black flex items-center justify-center text-[10.5px] border border-amber-200 shadow-2xs shrink-0 font-mono">
          3
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10.5px] border border-slate-200 shrink-0 font-mono">
        {index + 1}
      </span>
    );
  };

  const getAchPillClass = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (percent >= 80) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (percent > 0) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 lg:p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Dept Live Production
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">11 Stage rank, output vs target & queue</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
          11 Active Depts
        </span>
      </div>

      {/* MOBILE VIEW (< md): Clean Modern Department Cards */}
      <div className="block md:hidden flex-1 max-h-[440px] overflow-y-auto space-y-2 pr-0.5">
        {data.map((dept, index) => {
          const rankBadge = getRankBadge(index);
          const achPillClass = getAchPillClass(dept.achievementPercent);
          const progressPercent = Math.min(100, Math.max(0, dept.achievementPercent));

          return (
            <div 
              key={dept.department} 
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2 shadow-2xs transition-colors"
            >
              {/* Row 1: Rank Badge + Department Name + Achievement Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {rankBadge}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: dept.color }} 
                    />
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {dept.department}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border shrink-0 ${achPillClass}`}>
                  {dept.achievementPercent}%
                </span>
              </div>

              {/* Row 2: Subtle Progress Line (Instant visual feedback of throughput) */}
              <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: dept.achievementPercent >= 90 ? '#10b981' : dept.achievementPercent >= 80 ? '#f59e0b' : dept.achievementPercent > 0 ? '#3b82f6' : 'transparent'
                  }}
                />
              </div>

              {/* Row 3: Output Metrics & Live Queue Status */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-baseline gap-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-400">Output:</span>
                  <strong className="text-slate-900 font-mono font-bold">{dept.todayProductionSqm}</strong>
                  <span className="text-slate-400 font-mono text-[10.5px]">/ {dept.targetSqm} m²</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    <PlayCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{dept.runningJobs} run</span>
                  </span>
                  <span className="text-amber-700 font-medium flex items-center gap-0.5">
                    <Hourglass className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{dept.waitingJobs} wait</span>
                  </span>
                  {dept.holdJobs > 0 && (
                    <span className="text-rose-600 font-bold flex items-center gap-0.5">
                      <PauseCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{dept.holdJobs} hold</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (>= md): Full Data Table */}
      <div className="hidden md:block overflow-x-auto flex-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3 text-right">Today (Sqm)</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-center">Ach %</th>
              <th className="py-2.5 px-3 text-center">Active Jobs (R / W / H)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {data.map((dept, index) => {
              const rankBadge = getRankBadge(index);
              const achPillClass = getAchPillClass(dept.achievementPercent);

              return (
                <tr key={dept.department} className="hover:bg-slate-50/80 transition-colors">
                  {/* Rank */}
                  <td className="py-2.5 px-3 whitespace-nowrap">{rankBadge}</td>

                  {/* Dept Name */}
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                      <span>{dept.department}</span>
                    </div>
                  </td>

                  {/* Today Sqm */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {dept.todayProductionSqm} <span className="text-[10px] text-slate-500 font-normal">m²</span>
                  </td>

                  {/* Target Sqm */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                    {dept.targetSqm} <span className="text-[10px] font-normal">m²</span>
                  </td>

                  {/* Achievement % */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${achPillClass}`}>
                      {dept.achievementPercent}%
                    </span>
                  </td>

                  {/* Active Jobs (Running / Waiting / Hold) */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5" title="Running">
                        <PlayCircle className="w-3 h-3 text-emerald-600" /> {dept.runningJobs}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-700 font-medium flex items-center gap-0.5" title="Waiting">
                        <Hourglass className="w-3 h-3 text-amber-600" /> {dept.waitingJobs}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className={`font-bold flex items-center gap-0.5 ${dept.holdJobs > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}`} title="Hold">
                        <PauseCircle className="w-3 h-3" /> {dept.holdJobs}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
