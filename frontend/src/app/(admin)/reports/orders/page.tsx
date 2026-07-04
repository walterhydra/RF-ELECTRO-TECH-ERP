'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, ShoppingCart } from 'lucide-react';
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
    const headers = ['PO No', 'Customer', 'Product', 'Order Qty', 'PO Date', 'Expected Delivery', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.poNo},${r.customer?.companyName},${r.product?.name},${r.orderQty},${new Date(r.poDate).toLocaleDateString()},${new Date(r.expectedDeliveryDate).toLocaleDateString()},${r.status}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-blue-400 w-6 h-6" /> Order Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">Customer POs and their current production status.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">PO No</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold text-right">Order Qty</th>
                <th className="px-6 py-4 font-semibold">PO Date</th>
                <th className="px-6 py-4 font-semibold">Delivery Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No purchase orders found</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{row.poNo}</td>
                    <td className="px-6 py-4">{row.customer?.companyName}</td>
                    <td className="px-6 py-4">{row.product?.name}</td>
                    <td className="px-6 py-4 text-right text-blue-400 font-bold">{row.orderQty}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(row.poDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(row.expectedDeliveryDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        row.status === 'IN_PRODUCTION' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {row.status}
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
