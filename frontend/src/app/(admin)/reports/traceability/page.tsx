'use client';

import React, { useState } from 'react';
import { Search, Map, CheckCircle2, XCircle, ArrowRight, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TraceabilityReportPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:3001/api/v1/reports/traceability/${query}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch traceability data. Ensure the Job Card No is correct.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch traceability data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="text-orange-400 w-6 h-6" /> Job Card Traceability
          </h1>
          <p className="text-xs text-slate-400 mt-1">End-to-end movement history for any Job Card or Sub Job Card.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter Job Card No or Sub Job Card No (e.g. JC001 or JC001-1)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          <button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
            Trace
          </button>
        </form>
        {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
      </div>

      {data && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Card Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Number</p>
                <p className="text-white font-mono">{data.type === 'SUB_JOB_CARD' ? data.data.subJobCardNo : data.data.jobCardNo}</p>
              </div>
              <div>
                <p className="text-slate-500">Product</p>
                <p className="text-white font-medium">{data.type === 'SUB_JOB_CARD' ? data.data.jobCard?.product?.name : data.data.product?.name}</p>
              </div>
              {data.type === 'SUB_JOB_CARD' && (
                <>
                  <div>
                    <p className="text-slate-500">Current Stage</p>
                    <p className="text-orange-400 font-bold">{data.data.currentStage?.name || 'Pending Launch'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Quantity</p>
                    <p className="text-white font-bold">{data.data.qty}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Movement Ledger</h2>
            
            {data.type === 'SUB_JOB_CARD' ? (
              <div className="space-y-4">
                {data.data.movements?.length === 0 ? (
                  <p className="text-slate-500 text-sm">No movements recorded yet.</p>
                ) : (
                  data.data.movements.map((m: any, i: number) => (
                    <div key={m.id} className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-800 ml-4 pl-6">
                      <div className="absolute -left-2 top-0 bg-slate-900 p-1 rounded-full border-2 border-slate-800">
                        {m.qtyRejected > 0 ? (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-white font-bold">{m.stage?.name}</h3>
                          <span className="text-slate-500 text-xs">{format(new Date(m.createdAt), 'dd MMM yyyy HH:mm')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                          <p>Processed By: <span className="text-slate-300">{m.createdBy?.name}</span></p>
                          <p>Received: <span className="text-slate-300">{m.qtyReceived}</span></p>
                          <p>Processed: <span className="text-indigo-400 font-bold">{m.qtyProcessed}</span></p>
                          <p>Forwarded: <span className="text-emerald-400 font-bold">{m.qtyForwarded}</span></p>
                          {m.qtyRejected > 0 && (
                            <p className="col-span-2 text-rose-400">Rejected: {m.qtyRejected} ({m.rejectionReason})</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {data.data.childSubJobCards?.length > 0 && (
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <CornerDownRight className="w-4 h-4 text-indigo-400" /> Spawned Sub-Cards (Splits/Reworks)
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {data.data.childSubJobCards.map((c: any) => (
                        <span key={c.subJobCardNo} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded text-xs font-mono">
                          {c.subJobCardNo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-slate-400 text-sm mb-4">This is a main Job Card. Showing traceability for all its sub-cards.</p>
                {data.data.subJobCards?.map((sub: any) => (
                  <div key={sub.subJobCardNo} className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800">
                      <span className="font-mono text-orange-400 font-bold">{sub.subJobCardNo}</span>
                      <span className="text-xs text-slate-400">Current Stage: {sub.currentStage?.name || 'Pending'}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {sub.movements?.length === 0 ? (
                        <p className="text-slate-500 text-xs">No movements recorded yet.</p>
                      ) : (
                        sub.movements.map((m: any, i: number) => (
                           <div key={m.id} className="flex gap-4 items-center text-xs">
                             <div className="w-24 text-slate-500">{format(new Date(m.createdAt), 'dd MMM HH:mm')}</div>
                             <div className="w-32 text-white font-bold truncate">{m.stage?.name}</div>
                             <div className="flex-1 flex gap-4 text-slate-400">
                               <span>P: {m.qtyProcessed}</span>
                               <span className="text-emerald-400">F: {m.qtyForwarded}</span>
                               {m.qtyRejected > 0 && <span className="text-rose-400">R: {m.qtyRejected}</span>}
                             </div>
                           </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
