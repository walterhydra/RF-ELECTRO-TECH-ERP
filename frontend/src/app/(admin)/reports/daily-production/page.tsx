'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Download, RefreshCw } from 'lucide-react';

export default function DailyProductionPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/daily-production', { headers });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCsv = () => {
    if (data.length === 0) return;
    const headers = ['Date', 'Process Stage', 'Qty Received', 'Qty Processed', 'Qty Forwarded', 'Qty Rejected'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.date},${r.stageName},${r.qtyReceived},${r.qtyProcessed},${r.qtyForwarded},${r.qtyRejected}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `daily_production_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-emerald-400 w-6 h-6" /> Daily Production
          </h1>
          <p className="text-xs text-slate-400 mt-1">Output and productivity per process stage over time.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Process Stage</th>
                <th className="px-6 py-4 font-semibold text-right">Received</th>
                <th className="px-6 py-4 font-semibold text-right text-indigo-400">Processed</th>
                <th className="px-6 py-4 font-semibold text-right text-emerald-400">Forwarded</th>
                <th className="px-6 py-4 font-semibold text-right text-rose-400">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No production data found</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{row.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{row.stageName}</td>
                    <td className="px-6 py-4 text-right">{row.qtyReceived}</td>
                    <td className="px-6 py-4 text-right text-indigo-400 font-bold">{row.qtyProcessed}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-bold">{row.qtyForwarded}</td>
                    <td className="px-6 py-4 text-right text-rose-400 font-bold">{row.qtyRejected}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
