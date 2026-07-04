'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';

export default function ReworkStatusPage() {
  const [reworkCards, setReworkCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/reports/rework-status')
      .then(res => res.json())
      .then(data => {
        setReworkCards(data);
        setLoading(false);
      })
      .catch(() => {
        // mock
        setReworkCards([
          {
            id: 'rw-1',
            subJobCardNo: 'JC001-RW1',
            parentSubJobCard: { subJobCardNo: 'JC001-1' },
            jobCard: {
              jobCardNo: 'JC001',
              product: { name: 'Test PCB', code: 'P01' },
              customerPO: { customer: { companyName: 'Apex' } }
            },
            currentStage: { name: 'Drilling' },
            qty: 15,
            qtyProcessed: 5,
            qtyReceived: 15,
            status: 'IN_STAGE',
            createdAt: new Date().toISOString()
          }
        ]);
        setLoading(false);
      });
  }, []);

  const filtered = reworkCards.filter(c => 
    c.subJobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.parentSubJobCard?.subJobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.jobCard?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Rework Status Report</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            ACTIVE REWORK LOTS • TRACEABILITY • CURRENT STATUS
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Rework Lot No, Parent Lot, or Product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-200 placeholder-slate-500 w-full focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-4 px-6">Date Created</th>
                <th className="py-4 px-6">Rework Lot No</th>
                <th className="py-4 px-6">Parent Lot No</th>
                <th className="py-4 px-6">Product & Customer</th>
                <th className="py-4 px-6">Current Stage</th>
                <th className="py-4 px-6 text-right">Rework Qty</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                    {c.subJobCardNo}
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-300">
                    {c.parentSubJobCard?.subJobCardNo}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-200">{c.jobCard?.product?.name}</div>
                    <div className="text-xs text-slate-500">{c.jobCard?.customerPO?.customer?.companyName}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    {c.currentStage?.name || '-'}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-slate-200">
                    {c.qty}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No active rework lots found.
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
