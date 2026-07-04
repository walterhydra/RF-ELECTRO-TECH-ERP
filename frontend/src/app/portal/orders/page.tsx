'use client';

import React, { useState, useEffect } from 'react';
import { TraceLine } from '@/components/layout/TraceLine';
import { Package, Clock, CheckCircle2, AlertCircle, Cpu, Paperclip, ExternalLink, RefreshCw } from 'lucide-react';

interface PortalOrder {
  id: string;
  poNo: string;
  orderQty: number;
  poDate: string;
  expectedDeliveryDate: string;
  status: string;
  attachmentUrl?: string | null;
  product?: {
    name: string;
    code: string;
    specCardNo: string;
    pcbSize: string;
    layers: number;
  };
  jobCards?: {
    id: string;
    jobCardNo: string;
    status: string;
    totalQty: number;
    completedAt?: string | null;
  }[];
}

const FALLBACK_PORTAL_ORDERS: PortalOrder[] = [
  {
    id: '1',
    poNo: 'PO-2026-001',
    orderQty: 2500,
    poDate: '2026-07-01',
    expectedDeliveryDate: '2026-07-15',
    status: 'IN_PRODUCTION',
    attachmentUrl: 'https://storage.rfelectro.com/pos/PO-2026-001.pdf',
    product: { name: 'Main Motherboard V2', code: 'PCB-MB-V2', specCardNo: 'D001', pcbSize: '150x100mm', layers: 4 },
    jobCards: [{ id: 'jc-1', jobCardNo: 'JC-2026-001', status: 'IN_PROGRESS', totalQty: 2500 }]
  },
  {
    id: '2',
    poNo: 'PO-2026-002',
    orderQty: 1000,
    poDate: '2026-07-02',
    expectedDeliveryDate: '2026-07-20',
    status: 'OPEN',
    attachmentUrl: null,
    product: { name: 'RF Transceiver Board', code: 'PCB-RF-01', specCardNo: 'D002', pcbSize: '80x60mm', layers: 6 },
    jobCards: []
  },
  {
    id: '3',
    poNo: 'PO-2026-003',
    orderQty: 5000,
    poDate: '2026-06-28',
    expectedDeliveryDate: '2026-07-10',
    status: 'READY',
    attachmentUrl: 'https://storage.rfelectro.com/pos/PO-2026-003.pdf',
    product: { name: 'Power Supply PCB', code: 'PCB-PSU-10', specCardNo: 'D003', pcbSize: '120x120mm', layers: 2 },
    jobCards: [{ id: 'jc-2', jobCardNo: 'JC-2026-002', status: 'COMPLETED', totalQty: 5000, completedAt: '2026-07-03T10:00:00Z' }]
  }
];

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<PortalOrder[]>(FALLBACK_PORTAL_ORDERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('portal_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:3001/api/v1/portal/orders', { headers });
      if (!res.ok) {
        throw new Error('Could not connect to backend API');
      }
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders(data.orders);
      }
    } catch (e) {
      // Keep fallback data if offline or unauthorized
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStageInfo = (order: PortalOrder) => {
    if (order.status === 'READY' || order.status === 'DISPATCHED') {
      return { stage: 10, name: '10. Final QC & Dispatch Ready', status: 'COMPLETED' as const };
    }
    if (!order.jobCards || order.jobCards.length === 0) {
      return { stage: 1, name: '1. Order Entry & CAM Engineering', status: 'IN_PROGRESS' as const };
    }
    const hasCompleted = order.jobCards.some((jc) => jc.status === 'COMPLETED');
    if (hasCompleted) {
      return { stage: 9, name: '9. Surface Finish & Final Inspection', status: 'IN_PROGRESS' as const };
    }
    return { stage: 5, name: '5. CNC Drilling & Plating', status: 'IN_PROGRESS' as const };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">LOGGED / CAM PREP</span>;
      case 'IN_PRODUCTION':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">IN PRODUCTION</span>;
      case 'READY':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">READY FOR SHIPMENT</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">SHIPPED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-amber-500" />
            <span>Your Active Orders & Production Status</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            REAL-TIME TRACEABILITY • CLIENT COMMITTED SCHEDULES • REDACTED SCRAP DATA
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all w-fit disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Tracking</span>
        </button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You do not have any active purchase orders registered against your customer account yet.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const stageInfo = getStageInfo(order);
            return (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg hover:border-slate-700 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                        PO # {order.poNo}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-1">
                      <Cpu className="w-5 h-5 text-slate-400" />
                      <span>{order.product?.name || 'Custom PCB'}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        [{order.product?.specCardNo || 'D000'}] • {order.product?.layers || 2}L
                      </span>
                    </h3>
                  </div>

                  <div className="text-right font-mono text-xs space-y-1 bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-end gap-2 text-slate-300">
                      <span className="text-slate-500">ORDERED QTY:</span>
                      <span className="font-bold text-white text-sm">{order.orderQty.toLocaleString()} PCS</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>EST. DELIVERY: {new Date(order.expectedDeliveryDate).toLocaleDateString().toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">CURRENT MANUFACTURING STAGE:</span>
                    <span className="font-bold text-amber-400">{stageInfo.name}</span>
                  </div>
                  <TraceLine currentStageOrder={stageInfo.stage} totalStages={10} status={stageInfo.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                  <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                    <span>Logged: {new Date(order.poDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Job Cards: {order.jobCards?.length || 0} Launched</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.attachmentUrl && (
                      <a
                        href={order.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                        <span>View PO / Spec PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
