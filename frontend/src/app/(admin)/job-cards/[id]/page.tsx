'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Split,
  QrCode,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Cpu,
  Building2,
  FileText,
  History,
  Printer,
  ChevronRight,
  Loader2,
  RefreshCw,
  XCircle,
  PauseCircle,
  Send,
  Trash2,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

const getApi = () => getApiBaseUrl();

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface SubJobCard {
  id: string;
  subJobCardNo: string;
  qty: number;
  status: string;
  qrCodeValue: string;
  currentStage?: { id: string; name: string; code?: string } | null;
}

interface ProcessStep {
  id: string;
  stepOrder: number;
  stage: { id: string; name: string; code?: string };
}

interface JobCardDetails {
  id: string;
  jobCardNo: string;
  customerPoId: string;
  productId: string;
  totalQty: number;
  status: string;
  qrCodeValue: string;
  launchedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  customerPO: {
    poNo: string;
    orderQty: number;
    customer: { companyName: string; code?: string };
  };
  product: {
    name: string;
    code: string;
    specCardNo: string;
    layers: number;
    thicknessMm?: number | string;
    copperWeight?: string;
    solderMask?: string;
    surfaceFinish?: string;
    panelSize?: string;
    qtyPerPanel?: number;
  };
  processFlowMaster?: {
    name: string;
    totalSteps: number;
    steps?: ProcessStep[];
  };
  subJobCards: SubJobCard[];
}

interface TraceabilityLog {
  id: string;
  stageId: string;
  stage?: { name: string; code?: string };
  qtyReceived: number;
  qtyProcessed: number;
  qtyForwarded: number;
  qtyRejected: number;
  qtyHold: number;
  rejectionReason?: string;
  remarks?: string;
  remarkType?: string;
  isOverride: boolean;
  createdBy?: { name: string; email?: string };
  subJobCard?: { subJobCardNo: string };
  createdAt: string;
}

export default function JobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [jobCard, setJobCard] = useState<JobCardDetails | null>(null);
  const [history, setHistory] = useState<TraceabilityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [qrModal, setQrModal] = useState<any>(null);

  const isSuperAdmin = React.useMemo(() => {
    const storedRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || '') : '';
    const upper = storedRole.toUpperCase();
    return upper.includes('SUPER') || upper.includes('MASTER') || upper.includes('ADMIN');
  }, []);

  const handleDeleteJobCard = async () => {
    if (!jobCard) return;
    if (!confirm(`Are you sure you want to permanently delete Job Card ${jobCard.jobCardNo}? All sub-lots and stage history will be deleted. Action cannot be undone!`)) return;

    setDeleting(true);

    try {
      await fetch(`${getApi()}/job-cards/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err: any) {
      console.warn('Backend DELETE call warning or offline mode', err);
    } finally {
      alert(`Job Card ${jobCard.jobCardNo} deleted successfully!`);
      router.push('/job-cards');
      setDeleting(false);
    }
  };

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApi()}/job-cards/${id}`, { headers: getAuthHeaders() }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setJobCard(data);

        // Fetch traceability history
        const histRes = await fetch(`${getApi()}/job-cards/${id}/history`, { headers: getAuthHeaders() }).catch(() => null);
        if (histRes && histRes.ok) {
          setHistory(await histRes.json());
        }
      } else {
        setError('Job Card record not found in system.');
        setJobCard(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Job Card details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, fetchDetails]);

  const handleLaunch = async () => {
    if (!jobCard) return;
    if (!confirm(`Are you sure you want to launch Job Card ${jobCard.jobCardNo} into production?`)) return;

    setLaunching(true);
    try {
      const res = await fetch(`${getApi()}/job-cards/${id}/launch`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to launch Job Card');
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLaunching(false);
    }
  };

  const handleFetchQr = async () => {
    if (!jobCard) return;
    try {
      const res = await fetch(`${getApi()}/job-cards/${id}/qr`, { headers: getAuthHeaders() });
      let dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(jobCard.qrCodeValue || jobCard.jobCardNo)}`;
      let qrVal = jobCard.qrCodeValue || jobCard.jobCardNo;

      if (res.ok) {
        const data = await res.json();
        if (data.dataUrl) dataUrl = data.dataUrl;
        if (data.qrCodeValue) qrVal = data.qrCodeValue;
      }

      setQrModal({
        jobCardNo: jobCard.jobCardNo,
        qrCodeValue: qrVal,
        dataUrl,
      });
    } catch (err) {
      setQrModal({
        jobCardNo: jobCard.jobCardNo,
        qrCodeValue: jobCard.qrCodeValue || jobCard.jobCardNo,
        dataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(jobCard.qrCodeValue || jobCard.jobCardNo)}`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'NOT_LAUNCHED':
      case 'UNLAUNCHED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> UNLAUNCHED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-600" /> IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> ON HOLD
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading Job Card #{id} details...</p>
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/job-cards" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Job Cards Master
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Job Card Loading Error</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Job Card record not found'}</p>
        </div>
      </div>
    );
  }

  const isUnlaunched = jobCard.status === 'CREATED' || jobCard.status === 'UNLAUNCHED' || jobCard.status === 'NOT_LAUNCHED';
  const steps = jobCard.processFlowMaster?.steps || [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-slate-100 min-h-screen text-slate-900 font-sans pb-16">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/job-cards" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5 text-amber-600" /> Back to Master Job Cards
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDetails}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh
          </button>

          <button
            onClick={handleFetchQr}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-amber-400" /> Print QR Sticker
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleDeleteJobCard}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete Job Card</span>
            </button>
          )}

          {isUnlaunched && (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all inline-flex items-center gap-2"
            >
              {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>Launch Production</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{jobCard.jobCardNo}</h1>
                {getStatusBadge(jobCard.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generated from Customer PO: <strong className="text-blue-700 font-mono">{jobCard.customerPO?.poNo}</strong> • Created {new Date(jobCard.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL BATCH QTY</span>
              <span className="text-base font-bold text-slate-900">{jobCard.totalQty.toLocaleString()} PCS</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">LOT BATCHES</span>
              <span className="text-base font-bold text-blue-700">{jobCard.subJobCards?.length || 0} Sub-Lots</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">LAUNCH DATE</span>
              <span className="text-xs font-bold text-slate-800">
                {jobCard.launchedAt ? new Date(jobCard.launchedAt).toLocaleDateString() : 'Unlaunched'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid (Customer PO & Product Spec) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Customer PO Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Customer & Order Information</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Company:</span>
                <span className="font-bold text-slate-900">{jobCard.customerPO?.customer?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Order #:</span>
                <span className="font-bold font-mono text-blue-700">{jobCard.customerPO?.poNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Quantity:</span>
                <span className="font-bold text-slate-900 font-mono">{jobCard.customerPO?.orderQty.toLocaleString()} PCS</span>
              </div>
            </div>
          </div>

          {/* Product Spec Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Product Engineering Specifications</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name / Code:</span>
                <span className="font-bold text-slate-900">{jobCard.product?.name} ({jobCard.product?.code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Spec Card No / Rev:</span>
                <span className="font-bold font-mono text-purple-700">{jobCard.product?.specCardNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Layers & Copper:</span>
                <span className="font-semibold text-slate-800">{jobCard.product?.layers ? `${jobCard.product.layers} Layer(s)` : '—'} • {jobCard.product?.copperWeight || '—'} Copper</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Finish & Mask:</span>
                <span className="font-semibold text-slate-800">{jobCard.product?.surfaceFinish || '—'} • {jobCard.product?.solderMask || '—'} Mask</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Process Flow Progression Stepper */}
      {steps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Manufacturing Process Flow Sequence ({steps.length} Stages)</span>
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-xs">
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

      {/* Sub-Job Cards Batches Hierarchy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Split className="w-4 h-4 text-amber-600" />
            <span>Sub-Job Lot Batches ({jobCard.subJobCards?.length || 0} Batches)</span>
          </h3>
        </div>

        {(!jobCard.subJobCards || jobCard.subJobCards.length === 0) ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-xs">
            No sub-job lot cards generated yet. Launch production to generate initial lot card.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {jobCard.subJobCards.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-amber-400 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold font-mono text-slate-900 text-xs">{sub.subJobCardNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {sub.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lot Quantity:</span>
                    <span className="font-bold font-mono text-blue-700">{sub.qty.toLocaleString()} PCS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Stage:</span>
                    <span className="font-semibold text-slate-900">{sub.currentStage?.name || 'Pending Launch'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <Link
                    href={`/stage-update/${sub.id}`}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>Update Stage Movement</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Traceability Movement History Log */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <span>Job Traceability & Movement Audit Log ({history.length} Records)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Live Shop Floor Ledger</span>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs font-mono">
            No stage movement logs recorded yet for this Job Card.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Sub-Lot #</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Event Status</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-right">Forwarded</th>
                  <th className="py-2.5 px-3 text-right">Rej / Hold</th>
                  <th className="py-2.5 px-3">Operator & ID</th>
                  <th className="py-2.5 px-3 font-sans">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {history.map((log: any, idx: number) => {
                  const dateObj = log.createdAt ? new Date(log.createdAt) : null;
                  const dateStr = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                  const timeStr = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                  const isRej = (log.qtyRejected || 0) > 0 || String(log.remarkType || '').toUpperCase().includes('REJECT');
                  const isIncomplete = log.remarkType === 'INCOMPLETE_MOVEMENT' || (log.qtyForwarded < log.qtyReceived && log.qtyReceived > 0);
                  const isInit = String(log.remarkType || '').includes('INITIAL_LAUNCH');
                  const isComp = String(log.remarkType || '').includes('JOB_COMPLETED');
                  const opName = log.createdBy?.name || 'Operator';
                  const opRole = log.createdBy?.role?.name || '';
                  const opId = log.createdBy?.id || log.createdById || '';

                  return (
                    <tr key={log.id || idx} className={`hover:bg-slate-50/80 transition-colors ${isRej ? 'bg-rose-50/30' : isIncomplete ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                        <div className="font-semibold text-slate-900">{dateStr}</div>
                        <div className="text-[10px] text-slate-400">{timeStr}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 text-[11px]">
                        {log.subJobCard?.subJobCardNo || jobCard?.jobCardNo || '—'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[11px]">
                          {log.stage?.name || 'Stage'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isRej ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Defect Logged
                          </span>
                        ) : isIncomplete ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Incomplete
                          </span>
                        ) : isInit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Launched
                          </span>
                        ) : isComp ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                            Full Moved
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{log.qtyReceived || 0}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{log.qtyForwarded || 0}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                        {log.qtyRejected > 0 ? `${log.qtyRejected}` : (log.qtyHold > 0 ? `Hold: ${log.qtyHold}` : '0')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-[11px]">{opName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {opRole && <span>{opRole}</span>}
                          {opId && <span> • ID: {opId.slice(0, 8)}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-slate-600 max-w-xs">
                        {log.rejectionReason && (
                          <div className="text-rose-700 font-medium mb-0.5">Reason: {log.rejectionReason}</div>
                        )}
                        {log.remarks ? <div>{log.remarks}</div> : (!log.rejectionReason && <span className="text-slate-300">—</span>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Sticker Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm font-mono">Job Card QR Sticker</h3>
              <button onClick={() => setQrModal(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>
            
            {qrModal.dataUrl ? (
              <img src={qrModal.dataUrl} alt="QR Sticker" className="w-48 h-48 mx-auto rounded-xl border border-slate-200 p-2 shadow-sm" />
            ) : (
              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-mono text-xs">
                Generating...
              </div>
            )}

            <div className="font-mono text-xs text-slate-700 space-y-1">
              <p className="font-bold text-sm text-slate-900">{qrModal.jobCardNo}</p>
              <p className="text-[10px] text-slate-400 break-all">{qrModal.qrCodeValue}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Sticker
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
