'use client';

import React from 'react';
import { PauseCircle, User, CheckCircle2 } from 'lucide-react';
import { JobHoldItem } from '@/services/dashboardService';

interface JobHoldTableProps {
  data: JobHoldItem[];
}

export const JobHoldTable: React.FC<JobHoldTableProps> = ({ data }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <PauseCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs lg:text-sm font-bold text-slate-900 flex items-center gap-2">
              Job Hold Details
            </h2>
            <p className="text-[11px] text-slate-500">Process bottlenecks & customer approvals</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {data.length} Held Lots
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-2 px-2.5">Job Card No.</th>
              <th className="py-2 px-2.5">Customer & Job</th>
              <th className="py-2 px-2.5 text-right">Qty</th>
              <th className="py-2 px-2.5">Dept</th>
              <th className="py-2 px-2.5">Hold Reason</th>
              <th className="py-2 px-2.5">Since</th>
              <th className="py-2 px-2.5">Responsible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4" /> No jobs currently on hold
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.jobCardNo} className="hover:bg-slate-50/80 transition-colors">
                  {/* Exact Job Card No */}
                  <td className="py-2 px-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {item.jobCardNo}
                  </td>

                  {/* Customer & Job */}
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{item.customer}</div>
                    <div className="text-[10px] text-slate-500">{item.job}</div>
                  </td>

                  {/* Qty PNL */}
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    {item.qtyPnl} <span className="text-[10px] font-normal text-slate-500">pnl</span>
                  </td>

                  {/* Dept */}
                  <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium border border-slate-200">
                      {item.department}
                    </span>
                  </td>

                  {/* Hold Reason */}
                  <td className="py-2 px-2.5 text-rose-700 font-medium max-w-xs truncate">
                    {item.holdReason}
                  </td>

                  {/* Since */}
                  <td className="py-2 px-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {item.since}
                  </td>

                  {/* Responsible */}
                  <td className="py-2 px-2.5 font-medium text-slate-700 whitespace-nowrap">
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
