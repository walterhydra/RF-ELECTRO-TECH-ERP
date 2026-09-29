'use client';

import React from 'react';
import { Wrench, AlertTriangle, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { MachineBreakdownItem } from '@/services/dashboardService';

interface MachineBreakdownTableProps {
  data: MachineBreakdownItem[];
}

export const MachineBreakdownTable: React.FC<MachineBreakdownTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Live Machine Breakdown
            </h2>
            <p className="text-[11px] text-slate-400">Active maintenance & downtime tracking</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
          {data.length} Under Repair
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2 px-2.5">Machine</th>
              <th className="py-2 px-2.5">Dept</th>
              <th className="py-2 px-2.5">Breakdown Since</th>
              <th className="py-2 px-2.5">Duration</th>
              <th className="py-2 px-2.5">Est. Ready</th>
              <th className="py-2 px-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> All machines running optimally
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{item.machine}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">{item.department}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-400 whitespace-nowrap">{item.breakdownSince}</td>
                  <td className="py-2 px-2.5 font-mono font-bold text-amber-400 whitespace-nowrap">{item.duration}</td>
                  <td className="py-2 px-2.5 font-mono text-emerald-400 whitespace-nowrap">{item.estimatedRunningTime}</td>
                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/20">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
