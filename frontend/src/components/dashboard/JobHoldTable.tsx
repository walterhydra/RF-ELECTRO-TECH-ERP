'use client';

import React from 'react';
import { AlertOctagon, PauseCircle, Clock, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { JobHoldItem } from '@/services/dashboardService';

interface JobHoldTableProps {
  data: JobHoldItem[];
}

export const JobHoldTable: React.FC<JobHoldTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <PauseCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Job Hold Details
            </h2>
            <p className="text-[11px] text-slate-400">Process bottlenecks & customer approvals</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {data.length} Held Lots
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2 px-2.5">Job Card No.</th>
              <th className="py-2 px-2.5">Customer & Job</th>
              <th className="py-2 px-2.5 text-right">Qty (PNL)</th>
              <th className="py-2 px-2.5">Dept</th>
              <th className="py-2 px-2.5">Hold Reason</th>
              <th className="py-2 px-2.5">Since</th>
              <th className="py-2 px-2.5">Responsible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> No jobs currently on hold
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.jobCardNo} className="hover:bg-slate-800/40 transition-colors">
                  {/* Exact Job Card No */}
                  <td className="py-2 px-2.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{item.jobCardNo}</span>
                    </div>
                  </td>

                  {/* Customer & Job */}
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <div className="font-semibold text-white">{item.customer}</div>
                    <div className="text-[10px] text-slate-400">{item.job}</div>
                  </td>

                  {/* Qty PNL */}
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
                    {item.qtyPnl} <span className="text-[10px] font-normal text-slate-400">pnl</span>
                  </td>

                  {/* Dept */}
                  <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium border border-slate-700">
                      {item.department}
                    </span>
                  </td>

                  {/* Hold Reason */}
                  <td className="py-2 px-2.5 text-rose-300 font-medium max-w-xs truncate">
                    {item.holdReason}
                  </td>

                  {/* Since */}
                  <td className="py-2 px-2.5 font-mono text-slate-400 whitespace-nowrap">
                    {item.since}
                  </td>

                  {/* Responsible */}
                  <td className="py-2 px-2.5 font-semibold text-slate-200 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.responsible}</span>
                    </div>
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
