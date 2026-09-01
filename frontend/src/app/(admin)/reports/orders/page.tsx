'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, ShoppingCart, Calendar, Building2, Cpu, CheckCircle2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:3001/api/v1/reports/orders', { headers });
      
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json);
        } else if (json && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          setData([]);
        }
      } else {
        // Fallback or mock data if backend report endpoint returns empty/not ready
        const posRes = await fetch('http://localhost:3001/api/v1/customer-pos', { headers });
        if (posRes.ok) {
          const posJson = await posRes.json();
          setData(Array.isArray(posJson) ? posJson : []);
        } else {
          setData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching order report:', error);
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
    const headers = ['PO No', 'Customer', 'Product', 'Order Qty', 'PO Date', 'Expected Delivery', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.poNo},${r.customer?.companyName || ''},${r.product?.name || ''},${r.orderQty || 0},${r.poDate ? new Date(r.poDate).toLocaleDateString() : ''},${r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toLocaleDateString() : ''},${r.status || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/reports"
            className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
            title="Back to Reports Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer PO Production Status Report</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Commercial Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive breakdown of customer purchase orders and their real-time manufacturing stage progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 whitespace-nowrap">PO Number</th>
                <th className="py-3.5 px-4">Customer Company</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Order Qty</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PO Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Expected Delivery</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
                    <p className="font-medium text-xs">Loading PO status report data...</p>
                  </td>
                </tr>
              ) : safeData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm">No customer purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                safeData.map((row: any, i: number) => (
                  <tr key={row.id || i} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* PO Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {row.poNo}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900">{row.customer?.companyName || '—'}</span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{row.product?.name || '—'}</span>
                      </div>
                    </td>

                    {/* Order Qty */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {row.orderQty ? Number(row.orderQty).toLocaleString() : 0} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                    </td>

                    {/* PO Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {row.poDate ? format(new Date(row.poDate), 'dd MMM yyyy') : '—'}
                    </td>

                    {/* Expected Delivery */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{row.expectedDeliveryDate ? format(new Date(row.expectedDeliveryDate), 'dd MMM yyyy') : '—'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'COMPLETED' || row.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : row.status === 'IN_PRODUCTION'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {row.status || 'OPEN'}
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
