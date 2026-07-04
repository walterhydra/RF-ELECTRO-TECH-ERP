'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Layers } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function JobCardsReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/job-cards', { headers });
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
    const headers = ['Job Card No', 'Product', 'Customer', 'Status', 'Launched At', 'Completed At', 'Lead Time'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => {
        const leadTime = r.completedAt && r.launchedAt 
          ? `${Math.round((new Date(r.completedAt).getTime() - new Date(r.launchedAt).getTime()) / (1000 * 60 * 60 * 24))} days`
          : 'N/A';
        return `${r.jobCardNo},${r.product?.name},${r.customerPO?.customer?.companyName},${r.status},${r.launchedAt || 'N/A'},${r.completedAt || 'N/A'},${leadTime}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job_cards_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="text-pink-400 w-6 h-6" /> Job Card Status & Lead Time
          </h1>
          <p className="text-xs text-slate-400 mt-1">Overview of all job cards and their manufacturing durations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Job Card No</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Launched</th>
                <th className="px-6 py-4 font-semibold">Lead Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No job cards found</td></tr>
              ) : (
                data.map((row, i) => {
                  let leadTime = 'N/A';
                  if (row.launchedAt) {
                    if (row.completedAt) {
                       leadTime = formatDistanceToNow(new Date(row.launchedAt), { addSuffix: false }) // Just string formatting placeholder for actual time diff
                       // Proper calculation:
                       const diffTime = Math.abs(new Date(row.completedAt).getTime() - new Date(row.launchedAt).getTime());
                       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                       leadTime = `${diffDays} days`;
                    } else {
                       const diffTime = Math.abs(new Date().getTime() - new Date(row.launchedAt).getTime());
                       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                       leadTime = `${diffDays} days (Ongoing)`;
                    }
                  }

                  return (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{row.jobCardNo}</td>
                      <td className="px-6 py-4">{row.product?.name}</td>
                      <td className="px-6 py-4">{row.customerPO?.customer?.companyName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.launchedAt ? format(new Date(row.launchedAt), 'dd MMM yyyy') : 'Not Launched'}
                      </td>
                      <td className="px-6 py-4 font-bold text-pink-400">{leadTime}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
