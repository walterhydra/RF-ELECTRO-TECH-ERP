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
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Dept Live Production
            </h2>
            <p className="text-xs text-slate-500">11 Stage rank, output vs target & active queue</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          11 Active Depts
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-300">
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
              // Rank badge styling
              let rankBadge = (
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                  {index + 1}
                </span>
              );

              if (index === 0) {
                rankBadge = (
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[11px] border border-amber-300">
                    1
                  </span>
                );
              } else if (index === 1) {
                rankBadge = (
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black flex items-center justify-center text-[11px] border border-slate-300">
                    2
                  </span>
                );
              } else if (index === 2) {
                rankBadge = (
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 font-black flex items-center justify-center text-[11px] border border-amber-200">
                    3
                  </span>
                );
              }

              // Achievement % pill
              let achPillClass = 'bg-rose-50 text-rose-700 border-rose-200';
              if (dept.achievementPercent >= 90) {
                achPillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (dept.achievementPercent >= 80) {
                achPillClass = 'bg-amber-50 text-amber-700 border-amber-200';
              }

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
