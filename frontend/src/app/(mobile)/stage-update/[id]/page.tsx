'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { TraceLineTracker, TraceStage } from '@/components/ui/TraceLineTracker';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { getApiBaseUrl } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Package,
  RefreshCw,
  XCircle,
  PauseCircle,
  Send,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API = getApiBaseUrl();

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface StageInfo {
  subJobCardId: string;
  subJobCardNo: string;
  jobCardNo: string;
  productCode: string;
  status: string;
  currentStage: { id: string; name: string; code?: string } | null;
  stepOrder: number;
  totalSteps: number;
  wip: {
    qtyTotal: number;
    qtyReceived: number;
    qtyProcessed: number;
    qtyHold: number;
    qtyRejected: number;
    qtyAvailableToForward: number;
  };
}

interface MovementLog {
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
  isOverride: boolean;
  createdBy?: { id?: string; name: string; email?: string; role?: { name?: string } };
  createdAt: string;
}

export default function StageUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [stageInfo, setStageInfo] = useState<StageInfo | null>(null);
  const [history, setHistory] = useState<MovementLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  // Form state
  const [qtyReceived, setQtyReceived] = useState(0);
  const [qtyProcessed, setQtyProcessed] = useState(0);
  const [qtyForwarded, setQtyForwarded] = useState(0);
  const [qtyRejected, setQtyRejected] = useState(0);
  const [qtyHold, setQtyHold] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pendingWorkReason, setPendingWorkReason] = useState('Drilling & Hole Check Pending');
  const [customPendingReason, setCustomPendingReason] = useState('');

  const loadStageInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/sub-job-cards/${id}/current-stage`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Failed to load stage info (${res.status})`);
      const data: StageInfo = await res.json();
      setStageInfo(data);
      // Pre-fill received, processed, and forwarded from WIP lot quantity
      setQtyReceived(data.wip.qtyTotal);
      setQtyProcessed(data.wip.qtyTotal);
      setQtyForwarded(data.wip.qtyTotal);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sub-job-cards/${id}/history`, { headers: getAuthHeaders() });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {
      // Silent fail for history
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadStageInfo();
      loadHistory();
    }
  }, [id, loadStageInfo, loadHistory]);

  // Validation logic
  const totalOut = qtyForwarded + qtyRejected + qtyHold;
  const isValid =
    qtyReceived > 0 &&
    qtyProcessed <= qtyReceived &&
    totalOut <= qtyProcessed &&
    (qtyRejected === 0 || rejectionReason.trim().length > 0);

  const validationIssues: string[] = [];
  if (qtyProcessed > qtyReceived) validationIssues.push('Processed cannot exceed received');
  if (totalOut > qtyProcessed) validationIssues.push('Forward + Reject + Hold cannot exceed processed');
  if (qtyRejected > 0 && !rejectionReason.trim()) validationIssues.push('Rejection reason is mandatory');
  if (stageInfo && qtyReceived > stageInfo.wip.qtyTotal) validationIssues.push('Received cannot exceed lot total');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const effectivePendingReason = pendingWorkReason === 'Other / Custom Pending Reason' ? (customPendingReason || 'Pending PCB Work') : pendingWorkReason;
      const isIncomplete = qtyForwarded < qtyReceived;
      const clientRequestId = `mobile-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch(`${API}/sub-job-cards/${id}/stage-update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          qtyReceived,
          qtyProcessed,
          qtyForwarded,
          qtyRejected,
          qtyHold,
          rejectionReason: qtyRejected > 0 ? rejectionReason : (isIncomplete ? effectivePendingReason : undefined),
          remarks: remarks.trim() || undefined,
          remarkType: isIncomplete ? 'INCOMPLETE_MOVEMENT' : 'NONE',
          clientRequestId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Stage update failed (${res.status})`);
      }

      const result = await res.json();
      setSuccess(result);
      // Refresh stage info and history
      await loadStageInfo();
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to submit stage update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading stage data...</p>
      </div>
    );
  }

  if (error && !stageInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center space-y-3">
          <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">{error}</p>
          <Link href="/scan" className="text-amber-400 text-xs font-mono hover:text-amber-300">
            ← Back to Scanner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-copper-signal">
            {stageInfo?.subJobCardNo || id}
          </span>
          <span className="px-2 py-0.5 rounded bg-circuit-blue/10 text-circuit-blue border border-circuit-blue/30 font-mono text-[10px]">
            {stageInfo?.currentStage?.name || 'Unknown Stage'}
          </span>
        </div>
        <h2 className="text-lg font-display font-bold text-graphite-ink">
          {stageInfo?.productCode || 'Loading...'} — {stageInfo?.jobCardNo}
        </h2>
        
        {stageInfo && (
          <TraceLineTracker
            stages={Array.from({ length: stageInfo.totalSteps }).map((_, i) => ({
              name: i + 1 === stageInfo.stepOrder ? stageInfo.currentStage?.name || `Stage ${i+1}` : `Stage ${i+1}`,
              status: i + 1 < stageInfo.stepOrder ? 'COMPLETED' : i + 1 === stageInfo.stepOrder ? 'ACTIVE' : 'PENDING'
            }))}
            className="my-4"
          />
        )}
        
        {/* WIP Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
            <div className="text-[10px] font-mono text-slate-500">LOT QTY</div>
            <div className="text-sm font-bold text-graphite-ink font-mono">{stageInfo?.wip.qtyTotal || 0}</div>
          </div>
          <div className="bg-alert-rust/5 border border-alert-rust/20 rounded-lg p-2">
            <div className="text-[10px] font-mono text-alert-rust">REJECTED</div>
            <div className="text-sm font-bold text-alert-rust font-mono">{stageInfo?.wip.qtyRejected || 0}</div>
          </div>
          <div className="bg-warning-amber/5 border border-warning-amber/20 rounded-lg p-2">
            <div className="text-[10px] font-mono text-warning-amber">ON HOLD</div>
            <div className="text-sm font-bold text-warning-amber font-mono">{stageInfo?.wip.qtyHold || 0}</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold font-mono">MOVEMENT RECORDED</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <p>Movement ID: <span className="text-white">{success.movementId}</span></p>
            {success.splitOccurred && (
              <p className="text-amber-300">⚡ Lot split occurred — new child sub-job-card created</p>
            )}
            {success.newSubJobCard && (
              <p>New Card: <span className="text-amber-400">{success.newSubJobCard.subJobCardNo}</span> ({success.newSubJobCard.qty} qty)</p>
            )}
            <p>Remaining: <span className="text-white">{success.remainingAtCurrentStage?.qty || 0}</span> at current stage</p>
          </div>
          <button
            onClick={() => { setSuccess(null); loadStageInfo(); }}
            className="mt-2 w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Record Another Movement
          </button>
        </div>
      )}

      {/* Movement Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-6 shadow-sm">
          <h3 className="text-xs font-mono font-bold text-slate-500 border-b border-slate-200 pb-2">
            QUANTITY MOVEMENT & INTEGRITY CHECK
          </h3>

          <div className="space-y-4">
            {/* Received */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-500 mb-2">RECEIVED QUANTITY</label>
              <QuantityStepper
                value={qtyReceived}
                onChange={setQtyReceived}
                className="w-full justify-center"
              />
            </div>

            {/* Processed */}
            <div>
              <label className="block text-xs font-mono font-bold text-circuit-blue mb-2">PROCESSED QUANTITY</label>
              <QuantityStepper
                value={qtyProcessed}
                onChange={setQtyProcessed}
                className="w-full justify-center"
              />
            </div>

            {/* Forwarded */}
            <div>
              <label className="block text-xs font-mono font-bold text-confirm-green mb-2 flex items-center justify-center">
                <Send className="w-4 h-4 mr-1" />
                FORWARDED QUANTITY (PASS)
              </label>
              <QuantityStepper
                value={qtyForwarded}
                onChange={setQtyForwarded}
                className="w-full justify-center"
              />
              {qtyForwarded < qtyReceived && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Uncompleted / Partial Job Movement</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">Incomplete</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-amber-300 mb-1">REASON FOR PENDING WORK *</label>
                    <select
                      value={pendingWorkReason}
                      onChange={(e) => setPendingWorkReason(e.target.value)}
                      className="w-full h-11 bg-slate-900 border border-amber-500/50 rounded-lg px-3 text-xs text-amber-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                    >
                      <option value="Drilling & Hole Check Pending">Drilling & Hole Check Pending</option>
                      <option value="Solder Mask Touch-Up Required">Solder Mask Touch-Up Required</option>
                      <option value="Legend Reprint Pending">Legend Reprint Pending</option>
                      <option value="V-Cut / Edge Chamfer Pending">V-Cut / Edge Chamfer Pending</option>
                      <option value="FQC AI Re-Inspection Required">FQC AI Re-Inspection Required</option>
                      <option value="Copper Plating Thickness Check Pending">Copper Plating Thickness Check Pending</option>
                      <option value="Etching / Track Touch-up Pending">Etching / Track Touch-up Pending</option>
                      <option value="Other / Custom Pending Reason">Other / Custom Pending Reason</option>
                    </select>
                  </div>
                  {pendingWorkReason === 'Other / Custom Pending Reason' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Specify exact custom pending reason..."
                        value={customPendingReason}
                        onChange={(e) => setCustomPendingReason(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-amber-500/50 rounded-lg px-3 text-xs text-amber-100 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rejected */}
            <div>
              <label className="block text-xs font-mono font-bold text-alert-rust mb-2 flex items-center justify-center">
                <XCircle className="w-4 h-4 mr-1" />
                REJECTED QUANTITY (SCRAP)
              </label>
              <QuantityStepper
                value={qtyRejected}
                onChange={setQtyRejected}
                className="w-full justify-center"
              />
              {qtyRejected > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-mono font-bold text-alert-rust mb-2">REJECTION REASON (MANDATORY)</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full h-12 bg-white border border-alert-rust/40 rounded-lg px-3 text-base text-graphite-ink font-mono focus:outline-none focus:ring-2 focus:ring-alert-rust"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Copper damage">Copper damage</option>
                    <option value="Over-etching">Over-etching</option>
                    <option value="Registration error">Registration error</option>
                    <option value="Solder mask peeling">Solder mask peeling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Hold */}
            <div>
              <label className="block text-xs font-mono font-bold text-warning-amber mb-2 flex items-center justify-center">
                <PauseCircle className="w-4 h-4 mr-1" />
                HOLD QUANTITY
              </label>
              <QuantityStepper
                value={qtyHold}
                onChange={setQtyHold}
                className="w-full justify-center"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">REMARKS (OPTIONAL)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-graphite-ink focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-slate-400 resize-none"
                placeholder="Any additional observations..."
              />
            </div>
          </div>

          {/* Validation Bar */}
          <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${
            isValid
              ? 'bg-confirm-green/10 border-confirm-green/30 text-confirm-green'
              : 'bg-warning-amber/10 border-warning-amber/30 text-warning-amber'
          }`}>
            {isValid ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div className="space-y-0.5">
              {isValid ? (
                <span>Forwarded ({qtyForwarded}) + Rejected ({qtyRejected}) + Hold ({qtyHold}) = {totalOut} ≤ Processed ({qtyProcessed}). Integrity confirmed.</span>
              ) : (
                validationIssues.map((issue, i) => <p key={i}>• {issue}</p>)
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-alert-rust/10 border border-alert-rust/30 text-xs text-alert-rust flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full h-14 bg-confirm-green hover:bg-[#326943] disabled:opacity-50 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Stage Movement</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Movement History Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-200">MOVEMENT HISTORY ({history.length} entries)</span>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showHistory && (
          <div className="border-t border-slate-800 divide-y divide-slate-800 max-h-[340px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-slate-500 font-mono">
                No movement history yet
              </div>
            ) : (
              history.map((log) => {
                const isIncomplete = (log as any).remarkType === 'INCOMPLETE_MOVEMENT' || (log.qtyForwarded < log.qtyReceived && log.qtyReceived > 0);
                const isRejection = log.qtyRejected > 0 || (log as any).remarkType === 'REJECTION';
                const dateObj = log.createdAt ? new Date(log.createdAt) : null;
                const formattedDate = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-';
                const formattedTime = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                
                return (
                  <div key={log.id} className={`p-3 space-y-1.5 ${isRejection ? 'bg-rose-950/20' : isIncomplete ? 'bg-amber-950/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-200 font-bold">
                          {log.stage?.name || 'Stage'}
                        </span>
                        {isIncomplete && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                            INCOMPLETE
                          </span>
                        )}
                        {isRejection && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                            DEFECT
                          </span>
                        )}
                        {log.isOverride && <span className="text-purple-300 text-[9px] font-mono">[OVERRIDE]</span>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formattedDate} {formattedTime}
                      </span>
                    </div>

                    <div className="flex gap-3 text-[11px] font-mono text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
                      <span>Recv: <strong className="text-slate-100">{log.qtyReceived}</strong></span>
                      <span>Fwd: <strong className="text-emerald-400">{log.qtyForwarded}</strong></span>
                      {log.qtyRejected > 0 && <span>Rej: <strong className="text-rose-400">{log.qtyRejected}</strong></span>}
                      {log.qtyHold > 0 && <span>Hold: <strong className="text-amber-400">{log.qtyHold}</strong></span>}
                    </div>

                    {log.rejectionReason && (
                      <p className={`text-[10px] font-mono ${isRejection ? 'text-rose-300' : 'text-amber-300'}`}>
                        Reason: {log.rejectionReason}
                      </p>
                    )}
                    {log.remarks && (
                      <p className="text-[10px] text-slate-400 font-mono">Remarks: {log.remarks}</p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                      <span>By: <strong className="text-slate-300">{log.createdBy?.name || 'Operator'}</strong> ({log.createdBy?.role?.name || 'Staff'})</span>
                      {log.createdBy?.id && <span>ID: {log.createdBy.id.slice(0, 8)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
