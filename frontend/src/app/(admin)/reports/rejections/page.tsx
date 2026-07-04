'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Search, AlertCircle, Box, PackageX, RotateCcw } from 'lucide-react';

export default function RejectionSummaryPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/reports/rejection-summary')
      .then(res => res.json())
      .then(data => {
        setSummaries(data);
        setLoading(false);
      })
      .catch(() => {
        // mock
        setSummaries([
          {
            stageName: 'Drilling',
            totalRejected: 15,
            totalScrapped: 5,
            totalReworked: 10,
            pendingReview: 0,
            reasons: {
              'OVERSIZED_HOLE': 15
            }
          }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Rejection Summary Report</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PROCESS-WISE REJECTION AGGREGATION & DISPOSITION ANALYSIS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Box className="w-4 h-4 text-amber-400" />
            Total Rejected
          </div>
          <div className="text-2xl font-bold text-white">
            {summaries.reduce((acc, curr) => acc + curr.totalRejected, 0)} <span className="text-xs text-slate-500 font-normal">pcs</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <PackageX className="w-4 h-4 text-rose-400" />
            Total Scrapped
          </div>
          <div className="text-2xl font-bold text-white">
            {summaries.reduce((acc, curr) => acc + curr.totalScrapped, 0)} <span className="text-xs text-slate-500 font-normal">pcs</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            Total Reworked
          </div>
          <div className="text-2xl font-bold text-white">
            {summaries.reduce((acc, curr) => acc + curr.totalReworked, 0)} <span className="text-xs text-slate-500 font-normal">pcs</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            Pending Review
          </div>
          <div className="text-2xl font-bold text-white">
            {summaries.reduce((acc, curr) => acc + curr.pendingReview, 0)} <span className="text-xs text-slate-500 font-normal">pcs</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-4 px-6">Process Stage</th>
                <th className="py-4 px-6 text-center">Total Rejected</th>
                <th className="py-4 px-6 text-center text-rose-400">Scrap</th>
                <th className="py-4 px-6 text-center text-indigo-400">Rework</th>
                <th className="py-4 px-6 text-center">Pending Review</th>
                <th className="py-4 px-6">Top Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : summaries.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-200">{s.stageName}</td>
                  <td className="py-4 px-6 text-center font-bold text-amber-400">{s.totalRejected}</td>
                  <td className="py-4 px-6 text-center text-slate-300">{s.totalScrapped}</td>
                  <td className="py-4 px-6 text-center text-slate-300">{s.totalReworked}</td>
                  <td className="py-4 px-6 text-center text-slate-300">{s.pendingReview}</td>
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {Object.entries(s.reasons).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-'}
                  </td>
                </tr>
              ))}
              {!loading && summaries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No rejection data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
