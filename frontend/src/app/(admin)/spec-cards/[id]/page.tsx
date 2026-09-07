'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Building2,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  GitBranch,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const API = 'http://localhost:3001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface ProductSpec {
  id: string;
  specCardNo: string;
  revisionNo: string;
  isCurrentRevision: boolean;
  revisionReason?: string | null;
  name: string;
  code: string;
  pcbSize: string;
  layers: number;
  thicknessMm: number;
  copperWeight: string;
  solderMask: string;
  legend: string;
  surfaceFinish: string;
  materialType?: string | null;
  panelSize?: string | null;
  qtyPerPanel?: number | null;
  specialInstructions?: string | null;
  isActive: boolean;
  createdAt: string;
  customer?: {
    id: string;
    companyName: string;
    code?: string;
  } | null;
  processFlow?: {
    id: string;
    name: string;
    totalSteps: number;
    steps?: Array<{
      id: string;
      stepOrder: number;
      stage: { id: string; name: string; code?: string };
    }>;
  } | null;
  childRevisions?: Array<{
    id: string;
    specCardNo: string;
    revisionNo: string;
    isCurrentRevision: boolean;
    createdAt: string;
  }>;
}

export default function SpecCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<ProductSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductSpec = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/product-master/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Product Spec Card not found (${res.status})`);
      const data = await res.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Product Spec Card details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProductSpec();
  }, [id, fetchProductSpec]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading Product Specification Card details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/products" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Product Specification Master
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Spec Card Error</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Product specification record not found'}</p>
        </div>
      </div>
    );
  }

  const steps = product.processFlow?.steps || [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-slate-100 min-h-screen text-slate-900 font-sans pb-16">
      
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/products" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5 text-purple-600" /> Back to Product Master
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProductSpec}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{product.specCardNo}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                  {product.revisionNo}
                </span>
                {product.isCurrentRevision && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CURRENT ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Product Name: <strong className="text-slate-900">{product.name}</strong> • Code: <strong className="font-mono text-purple-700">{product.code}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">LAYERS</span>
              <span className="text-base font-bold text-slate-900">{product.layers} Layer PCB</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">BOARD THICKNESS</span>
              <span className="text-base font-bold text-purple-700">{product.thicknessMm} mm</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">CUSTOMER</span>
              <span className="text-xs font-bold text-slate-800">{product.customer?.companyName || 'Standard / Internal'}</span>
            </div>
          </div>
        </div>

        {/* Technical Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">PCB Unit Dimensions</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.pcbSize}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">Copper Weight</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.copperWeight}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">Surface Finish</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.surfaceFinish}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">Solder Mask Color</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.solderMask}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">Legend / Silkscreen</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.legend}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-slate-500 text-xs font-medium block">Base Material Type</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{product.materialType || 'FR4 Standard'}</span>
          </div>

        </div>

        {/* Panelization Info */}
        {(product.panelSize || product.qtyPerPanel) && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Production Panelization Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Panel Dimension:</span>
                <span className="font-bold text-slate-900 ml-2">{product.panelSize || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">PCBs per Array Panel:</span>
                <span className="font-bold text-purple-700 ml-2">{product.qtyPerPanel || 1} PCS / Panel</span>
              </div>
            </div>
          </div>
        )}

        {/* Special Gerber Instructions */}
        {product.specialInstructions && (
          <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 space-y-2 text-xs text-purple-950">
            <strong className="font-mono text-[10px] text-purple-700 uppercase block">Special Manufacturing & Gerber Instructions:</strong>
            <p className="whitespace-pre-wrap">{product.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* Associated Manufacturing Process Flow */}
      {product.processFlow && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Assigned Manufacturing Flow: {product.processFlow.name}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {product.processFlow.totalSteps || steps.length} Process Stages
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                    {step.stepOrder}
                  </span>
                  <span className="font-bold text-slate-900">{step.stage?.name}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Revision History Lineage */}
      {product.childRevisions && product.childRevisions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span>Product Revision History</span>
          </h3>

          <div className="space-y-2">
            {product.childRevisions.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{rev.specCardNo}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">{rev.revisionNo}</span>
                </div>
                <Link href={`/spec-cards/${rev.id}`} className="font-bold text-purple-700 hover:underline flex items-center gap-1">
                  <span>View Revision</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
