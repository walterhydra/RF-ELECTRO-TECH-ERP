'use client';

import React from 'react';
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MachineBreakdownItem } from '@/services/dashboardService';

interface MachineBreakdownTableProps {
  data: MachineBreakdownItem[];
}

export const MachineBreakdownTable: React.FC<MachineBreakdownTableProps> = ({ data }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs lg:text-sm font-bold text-slate-900 flex items-center gap-2">
              Live Machine Breakdown
            </h2>
            <p className="text-[11px] text-slate-500">Active maintenance tracking</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {data.length} Under Repair
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-2 px-2.5">Machine</th>
              <th className="py-2 px-2.5">Dept</th>
              <th className="py-2 px-2.5">Since</th>
              <th className="py-2 px-2.5">Duration</th>
              <th className="py-2 px-2.5">Est. Ready</th>
              <th className="py-2 px-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4" /> All machines running optimally
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{item.machine}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">{item.department}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-500 whitespace-nowrap">{item.breakdownSince}</td>
                  <td className="py-2 px-2.5 font-mono font-bold text-amber-700 whitespace-nowrap">{item.duration}</td>
                  <td className="py-2 px-2.5 font-mono text-emerald-700 whitespace-nowrap">{item.estimatedRunningTime}</td>
                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
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
