'use client';

import React, { useEffect, useState } from 'react';
import { Search, Download, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TraceabilityReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchJobCard, setSearchJobCard] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/traceability', { headers });
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
    const headers = ['Job Card No', 'Stage Name', 'Operator ID', 'Processed Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.jobCardNo || ''},${r.stageName || ''},${r.operatorId || ''},${r.processedAt || ''},${r.status || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `traceability_report_${new Date().toISOString().split('T')[0]}.csv`;
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Full Traveler Lot Traceability Report</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-orange-50 text-orange-700 font-semibold border border-orange-200">
                Compliance Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">End-to-end movement history for any specific Job Card, operator logs & stage timestamps.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={fetchReport} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={exportCsv} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-sm">
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
                <th className="py-3.5 px-4 whitespace-nowrap">Job Card #</th>
                <th className="py-3.5 px-4">Stage Name</th>
                <th className="py-3.5 px-4">Operator / Staff</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                    <p className="font-medium text-xs">Loading traveler traceability data...</p>
                  </td>
                </tr>
              ) : safeData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm">No traceability records logged yet.</p>
                  </td>
                </tr>
              ) : (
                safeData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{row.jobCardNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{row.stageName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{row.operatorId || 'Shop Floor Operator'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{row.processedAt ? new Date(row.processedAt).toLocaleString() : '—'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {row.status || 'VERIFIED'}
                      </span>
                    </td>
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
