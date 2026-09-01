'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Download, RefreshCw, ArrowLeft } from 'lucide-react';

export default function WipReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/wip', { headers });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
        else if (json && Array.isArray(json.data)) setData(json.data);
        else setData([]);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCsv = () => {
    if (!Array.isArray(data) || data.length === 0) return;
    const headers = ['Stage Code', 'Stage Name', 'WIP Quantity (PCS)', 'Sub-Job Lots'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.stageCode || ''},${r.stageName || ''},${r.wipQty || 0},${r.subJobCardsCount || 0}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wip_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href="/reports" className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pending Stage WIP Monitor Report</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200">
                Stage Density Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time work-in-progress quantity & lot count at each manufacturing stage.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={fetchReport} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={exportCsv} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 whitespace-nowrap">Stage Code</th>
                <th className="py-3.5 px-4">Stage Name</th>
                <th className="py-3.5 px-4 text-right">WIP Quantity</th>
                <th className="py-3.5 px-4 text-right">Sub-Job Lots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-500 mx-auto mb-2" />
                    <p className="font-medium text-xs">Loading WIP report data...</p>
                  </td>
                </tr>
              ) : safeData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm">No WIP data found.</p>
                  </td>
                </tr>
              ) : (
                safeData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{row.stageCode || 'STG'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{row.stageName}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-700">{row.wipQty?.toLocaleString()} pcs</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{row.subJobCardsCount || 0} Lots</td>
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
