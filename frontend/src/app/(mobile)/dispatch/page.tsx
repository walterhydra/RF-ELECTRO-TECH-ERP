'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageCheck, Truck, ArrowLeft, RefreshCw, FileText, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

export default function MobileDispatchPage() {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [readyJobCards, setReadyJobCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dispRes, jcRes] = await Promise.all([
        fetchApi('/dispatches'),
        fetchApi('/job-cards'),
      ]);
      const dispData = dispRes.ok ? await dispRes.json() : [];
      const jcData = jcRes.ok ? await jcRes.json() : [];

      setDispatches(Array.isArray(dispData) ? dispData : []);
      if (Array.isArray(jcData)) {
        setReadyJobCards(jcData.filter((j: any) => j.status === 'READY_FOR_DISPATCH' || j.status === 'COMPLETED'));
      }
    } catch (e) {
      console.error('Failed to load mobile dispatch data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const assignedStage = typeof window !== 'undefined' ? localStorage.getItem('assignedStage') : null;
    const userRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || '') : '';
    const isOperator =
      Boolean(assignedStage && assignedStage.toUpperCase() !== 'ALL') ||
      userRole.toLowerCase().includes('operator') ||
      userRole === 'NORMAL' ||
      userRole === 'PROCESS_OPERATOR';

    if (isOperator) {
      router.replace('/job-cards');
      return;
    }

    loadData();
  }, [router]);

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto font-sans text-slate-100 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/scan"
            className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Dispatch & Gate Pass
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Mobile Outward Dispatch Tracker</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400 font-mono">Loading live dispatch records...</p>
        </div>
      ) : (
        <>
          {/* Ready for Dispatch */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Ready for Dispatch ({readyJobCards.length})</span>
              <span className="text-emerald-400 font-bold">{readyJobCards.length} Lots</span>
            </h2>
            {readyJobCards.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                No job cards currently awaiting dispatch in Packing.
              </div>
            ) : (
              <div className="space-y-2">
                {readyJobCards.slice(0, 5).map((jc: any) => (
                  <div
                    key={jc.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-400">{jc.jobCardNo}</span>
                      <p className="text-[11px] text-slate-300">{jc.product?.name || jc.customerPartNo || 'PCB'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Qty: {jc.totalQty || 0} PCS</p>
                    </div>
                    <Link
                      href="/dispatches"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Dispatch
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Dispatches */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Recent Dispatches ({dispatches.length})</span>
              <Link href="/dispatches" className="text-emerald-400 font-bold hover:underline">
                View All
              </Link>
            </h2>
            {dispatches.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                No dispatches logged in database yet.
              </div>
            ) : (
              <div className="space-y-2">
                {dispatches.slice(0, 8).map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/challan-pdf/${d.id}`}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white group-hover:text-emerald-400">
                          {d.dispatchNo}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            d.deliveryStatus === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {d.deliveryStatus || 'IN_TRANSIT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {d.jobCard?.customerPO?.customer?.companyName || d.destination || 'Customer'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Qty: {d.dispatchedQty} • {d.vehicleNo || 'Vehicle'}
                      </p>
                    </div>
                    <div className="flex items-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <FileText className="w-4 h-4 mr-1" />
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
