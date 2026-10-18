'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Split,
  Filter
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

export default function TraceabilityReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FORWARDED' | 'PARTIAL' | 'DEFECT'>('ALL');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${getApiBaseUrl()}/reports/traceability?limit=300`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
        else if (json && Array.isArray(json.data)) setData(json.data);
        else setData([]);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Failed to load traceability report:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = safeData.length;
    const partial = safeData.filter(r => r.status === 'PARTIAL' || (r.qtyForwarded < r.qtyReceived && r.qtyReceived > 0 && r.qtyForwarded > 0));
    const defects = safeData.filter(r => r.status === 'DEFECT' || (r.qtyRejected || 0) > 0 || String(r.remarkType || '').includes('REJECT'));
    const fullForward = safeData.filter(r => r.status === 'FORWARDED' || (r.qtyForwarded >= r.qtyReceived && (r.qtyRejected || 0) === 0));

    const totalScrapQty = defects.reduce((acc, r) => acc + (r.qtyRejected || 0), 0);
    const totalPartialHoldQty = partial.reduce((acc, r) => acc + (r.qtyHold || Math.max(0, (r.qtyReceived || 0) - (r.qtyForwarded || 0) - (r.qtyRejected || 0))), 0);

    return {
      total,
      fullCount: fullForward.length,
      partialCount: partial.length,
      defectCount: defects.length,
      totalScrapQty,
      totalPartialHoldQty,
    };
  }, [safeData]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return safeData.filter(row => {
      // Type Filter
      if (filterType === 'DEFECT') {
        const isDefect = row.status === 'DEFECT' || (row.qtyRejected || 0) > 0 || String(row.remarkType || '').includes('REJECT');
        if (!isDefect) return false;
      } else if (filterType === 'PARTIAL') {
        const isPartial = row.status === 'PARTIAL' || (row.qtyForwarded < row.qtyReceived && row.qtyReceived > 0 && row.qtyForwarded > 0);
        if (!isPartial) return false;
      } else if (filterType === 'FORWARDED') {
        const isFull = row.status === 'FORWARDED' && (row.qtyRejected || 0) === 0;
        if (!isFull) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const jc = String(row.jobCardNo || '').toLowerCase();
        const sub = String(row.subJobCardNo || '').toLowerCase();
        const st = String(row.stageName || '').toLowerCase();
        const op = String(row.operatorId || '').toLowerCase();
        const rem = String(row.remarks || '').toLowerCase();
        const rej = String(row.rejectionReason || '').toLowerCase();
        return jc.includes(q) || sub.includes(q) || st.includes(q) || op.includes(q) || rem.includes(q) || rej.includes(q);
      }

      return true;
    });
  }, [safeData, filterType, searchQuery]);

  const exportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'Job Card No',
      'Sub Lot No',
      'Stage Name',
      'Status',
      'Qty Received',
      'Qty Forwarded',
      'Qty Partial Hold',
      'Qty Rejected',
      'Operator',
      'Timestamp',
      'Rejection Reason',
      'Remarks'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(r => {
        const dateStr = r.processedAt ? new Date(r.processedAt).toLocaleString('en-GB') : '';
        return [
          `"${r.jobCardNo || ''}"`,
          `"${r.subJobCardNo || ''}"`,
          `"${(r.stageName || '').replace(/"/g, '""')}"`,
          `"${r.status || ''}"`,
          r.qtyReceived || 0,
          r.qtyForwarded || 0,
          r.qtyHold || 0,
          r.qtyRejected || 0,
          `"${(r.operatorId || '').replace(/"/g, '""')}"`,
          `"${dateStr}"`,
          `"${(r.rejectionReason || '').replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `traceability_movement_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-6 max-w-[1440px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      {/* ── Top Header ── */}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Full Traveler Lot Traceability & Movement Ledger</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-orange-50 text-orange-700 font-semibold border border-orange-200">
                ISO 9001 Compliance Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete chronological stage movements, partial forwardings, and scrap rejection logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={fetchReport} 
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={exportCsv} 
            disabled={filteredData.length === 0}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Movements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">All Movements</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-500 font-medium">Events Logged</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono block mt-1">Complete shop floor ledger</span>
        </div>

        {/* Full Movements */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">Fully Forwarded</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold font-mono text-emerald-900">{metrics.fullCount}</span>
            <span className="text-xs text-emerald-700 font-medium">100% Lots</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono block mt-1">Zero units retained at stage</span>
        </div>

        {/* Partial Qty Movements */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border ${metrics.partialCount > 0 ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Partial Qty Moves</span>
            <Split className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold font-mono text-amber-900">{metrics.partialCount}</span>
            <span className="text-xs text-amber-700 font-medium">Partial Events</span>
          </div>
          <span className="text-[11px] text-amber-700 font-mono font-semibold block mt-1">
            {metrics.totalPartialHoldQty > 0 ? `${metrics.totalPartialHoldQty} PCBs WIP Hold/Retained` : 'No open partial holds'}
          </span>
        </div>

        {/* Rejection / Scrap Logs */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border ${metrics.defectCount > 0 ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Defects & Scrap</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold font-mono text-rose-900">{metrics.defectCount}</span>
            <span className="text-xs text-rose-700 font-medium">Logged</span>
          </div>
          <span className="text-[11px] text-rose-700 font-mono font-semibold block mt-1">
            {metrics.totalScrapQty > 0 ? `${metrics.totalScrapQty} Total Scrapped PCBs` : 'Zero Rejections'}
          </span>
        </div>
      </div>

      {/* ── Toolbar: Search & Filter Tabs ── */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Job Card #, sub-lot, stage, operator, rejection reason..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-slate-800 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
            >✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Movements ({metrics.total})
          </button>
          <button
            onClick={() => setFilterType('FORWARDED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterType === 'FORWARDED'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Fully Forwarded ({metrics.fullCount})
          </button>
          <button
            onClick={() => setFilterType('PARTIAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterType === 'PARTIAL'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Partially Moved ({metrics.partialCount})
          </button>
          <button
            onClick={() => setFilterType('DEFECT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterType === 'DEFECT'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Defects & Rejections ({metrics.defectCount})
          </button>
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Job Card # & Sub-Lot</th>
                <th className="py-3.5 px-4">Process Stage</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Movement Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">In (Recv)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Out (Fwd)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Partial / Hold</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Scrap (Rej)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Operator & Staff</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                <th className="py-3.5 px-4">Remarks / Rejection Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                    <p className="font-medium text-xs font-mono">Loading full traveler traceability movements...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No traceability records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try clearing your search query or switching filters.' : 'Movement logs are recorded automatically when operators scan and update stages.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any, i: number) => {
                  const isRej = row.status === 'DEFECT' || (row.qtyRejected || 0) > 0 || String(row.remarkType || '').includes('REJECT');
                  const isPartial = row.status === 'PARTIAL' || (row.qtyForwarded < row.qtyReceived && row.qtyReceived > 0 && row.qtyForwarded > 0);
                  const partialQty = row.qtyHold || Math.max(0, (row.qtyReceived || 0) - (row.qtyForwarded || 0) - (row.qtyRejected || 0));

                  return (
                    <tr 
                      key={row.id || i} 
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isRej ? 'bg-rose-50/20' : isPartial ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-[11px]">
                        #{filteredData.length - i}
                      </td>

                      {/* Job Card No & Sub Lot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">{row.jobCardNo}</div>
                        {row.subJobCardNo && row.subJobCardNo !== row.jobCardNo && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Lot: {row.subJobCardNo}
                          </div>
                        )}
                      </td>

                      {/* Process Stage */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {row.stageName}
                        </span>
                      </td>

                      {/* Movement Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRej ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Defect Logged
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Partially Moved ({partialQty} Left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Fully Forwarded
                          </span>
                        )}
                      </td>

                      {/* Qty Received */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                        {row.qtyReceived || 0}
                      </td>

                      {/* Qty Forwarded */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {row.qtyForwarded || 0}
                      </td>

                      {/* Partial / Hold Qty */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {partialQty > 0 ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {partialQty}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Qty Rejected / Scrap */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {row.qtyRejected > 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                            {row.qtyRejected}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{row.operatorId || 'Operator'}</div>
                        {row.operatorRole && (
                          <div className="text-[10px] text-slate-400 font-mono">{row.operatorRole}</div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {row.processedAt ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {new Date(row.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(row.processedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : '—'}
                      </td>

                      {/* Remarks & Rejection Reason */}
                      <td className="py-3.5 px-4 max-w-xs text-xs text-slate-700">
                        {row.rejectionReason && (
                          <div className="font-mono text-[11px] text-rose-700 font-semibold mb-0.5">
                            Defect: {row.rejectionReason}
                          </div>
                        )}
                        {row.remarks ? (
                          <div className="font-sans text-[11px] text-slate-600 leading-snug">
                            {row.remarks}
                          </div>
                        ) : (!row.rejectionReason && <span className="text-slate-300">—</span>)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Showing {filteredData.length} of {safeData.length} total movements</span>
          <span>RF ELECTRO TECH PCB MANUFACTURING TRACEABILITY LEDGER</span>
        </div>
      </div>
    </div>
  );
}
