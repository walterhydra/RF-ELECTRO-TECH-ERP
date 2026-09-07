'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Building2,
  FileText,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react';

const API = 'http://localhost:3001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface CustomerPO {
  id: string;
  poNo: string;
  orderQty: number;
  poDate: string;
  expectedDeliveryDate: string;
  status: string;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  product: {
    id: string;
    name: string;
    code: string;
    specCardNo: string;
    layers: number;
    thicknessMm?: number | string;
    copperWeight?: string;
    solderMask?: string;
    surfaceFinish?: string;
  };
  jobCards?: Array<{
    id: string;
    jobCardNo: string;
    totalQty: number;
    status: string;
    createdAt: string;
    subJobCards?: Array<{ id: string; subJobCardNo: string; qty: number; status: string }>;
  }>;
}

export default function CustomerPODetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [po, setPo] = useState<CustomerPO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchPo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/customer-pos/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Purchase Order not found (${res.status})`);
      const data = await res.json();
      setPo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Purchase Order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchPo();
  }, [id, fetchPo]);

  const handleGenerateJobCard = async () => {
    if (!po) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/job-cards/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ customerPoId: po.id }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate Job Card');
      }
      await fetchPo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> OPEN FOR PRODUCTION
          </span>
        );
      case 'IN_PRODUCTION':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-600" /> IN PRODUCTION
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1.5">
            CLOSED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> CANCELLED
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading Purchase Order details...</p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/pos" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Purchase Orders
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Purchase Order Error</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Purchase order record not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-slate-100 min-h-screen text-slate-900 font-sans pb-16">
      
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/pos" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5 text-emerald-600" /> Back to Customer Purchase Orders
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPo}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh
          </button>

          {po.status === 'OPEN' && (
            <button
              onClick={handleGenerateJobCard}
              disabled={generating}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all inline-flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
              <span>Generate Job Card</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">PO: {po.poNo}</h1>
                {getStatusBadge(po.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customer: <strong className="text-slate-900">{po.customer?.companyName}</strong> • PO Date: {new Date(po.poDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">ORDER QUANTITY</span>
              <span className="text-base font-bold text-slate-900">{po.orderQty.toLocaleString()} PCS</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">EXPECTED DELIVERY</span>
              <span className="text-xs font-bold text-emerald-700">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* PO Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Customer Profile */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Customer Contact Details</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Company Name:</span>
                <span className="font-bold text-slate-900">{po.customer?.companyName}</span>
              </div>
              {po.customer?.contactPerson && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Person:</span>
                  <span className="font-semibold text-slate-800">{po.customer.contactPerson}</span>
                </div>
              )}
              {po.customer?.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-mono text-blue-700">{po.customer.email}</span>
                </div>
              )}
              {po.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono text-slate-800">{po.customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Ordered Product Specifications</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name / Code:</span>
                <span className="font-bold text-slate-900">{po.product?.name} ({po.product?.code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Spec Card #:</span>
                <Link href={`/spec-cards/${po.product?.id}`} className="font-bold font-mono text-purple-700 hover:underline flex items-center gap-1">
                  <span>{po.product?.specCardNo}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Layers & Copper:</span>
                <span className="font-semibold text-slate-800">{po.product?.layers} Layer(s) • {po.product?.copperWeight || '1oz'} Copper</span>
              </div>
            </div>
          </div>

        </div>

        {po.notes && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
            <strong className="font-mono block text-[10px] text-amber-700 uppercase">PO Notes & Special Instructions:</strong>
            <p className="mt-0.5">{po.notes}</p>
          </div>
        )}
      </div>

      {/* Linked Job Cards Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Production Job Cards ({po.jobCards?.length || 0} Linked)</span>
        </h3>

        {(!po.jobCards || po.jobCards.length === 0) ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs space-y-2">
            <p>No production job card generated yet for this purchase order.</p>
            {po.status === 'OPEN' && (
              <button
                onClick={handleGenerateJobCard}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-2xs"
              >
                Generate Job Card Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {po.jobCards.map((jc) => (
              <div
                key={jc.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-amber-400 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold font-mono text-slate-900 text-xs">{jc.jobCardNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {jc.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch Qty:</span>
                    <span className="font-bold text-slate-900">{jc.totalQty.toLocaleString()} PCS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sub-Lot Batches:</span>
                    <span className="font-bold text-blue-700">{jc.subJobCards?.length || 0} Lots</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <Link
                    href={`/job-cards/${jc.id}`}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>View Job Card Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
