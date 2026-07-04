'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function DispatchReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/dispatch', { headers });
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
    const headers = ['Job Card No', 'Customer', 'Product', 'Dispatched Qty', 'Destination', 'Status', 'Dispatched At', 'Delivered At'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.jobCard?.jobCardNo},${r.jobCard?.customerPO?.customer?.companyName},${r.jobCard?.product?.name},${r.dispatchedQty},"${r.destination}",${r.deliveryStatus},${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'},${r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : 'N/A'}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dispatch_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-purple-400 w-6 h-6" /> Dispatch Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status of dispatched goods and deliveries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
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
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold text-right">Dispatched Qty</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Dispatched At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No dispatch records found</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{row.jobCard?.jobCardNo}</td>
                    <td className="px-6 py-4">{row.jobCard?.customerPO?.customer?.companyName}</td>
                    <td className="px-6 py-4">{row.jobCard?.product?.name}</td>
                    <td className="px-6 py-4 text-right text-purple-400 font-bold">{row.dispatchedQty}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' :
                        row.deliveryStatus === 'IN_TRANSIT' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {row.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.createdAt ? format(new Date(row.createdAt), 'dd MMM yyyy HH:mm') : 'N/A'}
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
