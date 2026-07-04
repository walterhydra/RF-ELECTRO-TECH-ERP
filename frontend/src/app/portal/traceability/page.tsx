'use client';

import React, { useState } from 'react';
import { Search, MapPin, Package, Calendar } from 'lucide-react';

export default function CustomerTraceability() {
  const [jobCardNo, setJobCardNo] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCardNo.trim()) return;

    try {
      setIsLoading(true);
      setError('');
      setTraceData(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/portal/traceability/${encodeURIComponent(jobCardNo.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Job Card not found or access denied.');
      }
      const data = await res.json();
      setTraceData(data);
    } catch (err: any) {
      console.error('Traceability search failed:', err);
      setError(err.message || 'Job Card not found or access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Traceability Explorer</h1>
      
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter Job Card Number (e.g., JC001)"
              value={jobCardNo}
              onChange={(e) => setJobCardNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium disabled:opacity-50"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>

      {traceData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Job Card</p>
                <p className="font-bold text-white font-mono">{traceData.jobCardNo}</p>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <MapPin className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Current Status</p>
                <p className="font-bold text-white">{traceData.status}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Launched At</p>
                <p className="font-bold text-white text-sm">
                  {new Date(traceData.launchedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-6">Manufacturing History</h3>
            <div>
              {traceData.logs.length === 0 ? (
                <p className="text-slate-400 text-sm">No manufacturing logs available yet.</p>
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {traceData.logs.map((log: any, index: number) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-950 shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-white">{log.stageName}</h3>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(log.scannedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block">Sub-Job:</span>
                            <span className="text-blue-400">{log.subJobCardNo}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block">Processed:</span>
                            <span className="text-emerald-400">{log.qtyProcessed}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block">Forwarded:</span>
                            <span className="text-teal-400">{log.qtyForwarded}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block">Rejected:</span>
                            <span className={log.qtyRejected > 0 ? "text-red-400" : "text-slate-400"}>{log.qtyRejected}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
