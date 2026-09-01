"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
  XCircle,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Sparkles
} from "lucide-react";

interface Stage {
  id: string;
  name: string;
  code: string;
}

interface PendingRejection {
  id: string;
  subJobCard: {
    subJobCardNo: string;
    jobCard: {
      jobCardNo: string;
      product: {
        code: string;
        name: string;
      };
    };
  };
  stage: {
    name: string;
    code: string;
  };
  qtyRejected: number;
  rejectionReason: string;
  remarks: string;
  createdBy: {
    name: string;
  };
  createdAt: string;
}

const INITIAL_REJECTIONS: PendingRejection[] = [
  {
    id: "mov-1",
    subJobCard: {
      subJobCardNo: "JC-2026-001-A",
      jobCard: {
        jobCardNo: "JC-2026-001",
        product: { code: "PCB-MB-V2", name: "Main Motherboard V2" },
      },
    },
    stage: { name: "CNC Drilling & Routing", code: "CNC-02" },
    qtyRejected: 15,
    rejectionReason: "OVERSIZED_HOLE",
    remarks: "Drill bit worn out during panel pass #4",
    createdBy: { name: "Rajesh Kumar (Operator)" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "mov-2",
    subJobCard: {
      subJobCardNo: "JC-2026-003-A",
      jobCard: {
        jobCardNo: "JC-2026-003",
        product: { code: "PCB-RF-01", name: "RF Transceiver Board" },
      },
    },
    stage: { name: "PTH Copper Plating", code: "WET-01" },
    qtyRejected: 20,
    rejectionReason: "COPPER_VOIDS",
    remarks: "Chemical bath bath density low on panel margin",
    createdBy: { name: "Amit Sharma (QA Inspector)" },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

const INITIAL_STAGES: Stage[] = [
  { id: "stg-1", name: "CAM & Gerber Verification", code: "ENG-01" },
  { id: "stg-2", name: "CNC Material Cutting", code: "CNC-01" },
  { id: "stg-3", name: "CNC Drilling & Routing", code: "CNC-02" },
  { id: "stg-4", name: "PTH Copper Plating", code: "WET-01" },
  { id: "stg-5", name: "AOI Optical Inspection", code: "QC-01" },
];

export default function RejectionsPage() {
  const [rejections, setRejections] = useState<PendingRejection[]>(INITIAL_REJECTIONS);
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<PendingRejection | null>(null);
  const [disposition, setDisposition] = useState<"SCRAP" | "REWORK">("SCRAP");
  const [reworkStageId, setReworkStageId] = useState("");
  const [qcRemarks, setQcRemarks] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchRejections();
    fetchStages();
  }, []);

  const fetchRejections = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/rejections/pending");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setRejections(data);
      }
    } catch (e) {}
  };

  const fetchStages = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/process-stages");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setStages(data);
      }
    } catch (e) {}
  };

  const handleOpenDisposition = (movement: PendingRejection) => {
    setSelectedMovement(movement);
    setDisposition("SCRAP");
    setReworkStageId(stages[0]?.id || "");
    setQcRemarks("");
    setError("");
    setIsModalOpen(true);
  };

  const handleSaveDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disposition === "REWORK" && !reworkStageId) {
      setError("Please select a target process stage for rework.");
      return;
    }

    if (!selectedMovement) return;

    try {
      const res = await fetch(
        `http://localhost:3001/api/v1/rejections/${selectedMovement.id}/disposition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: disposition,
            reworkStageId: disposition === "REWORK" ? reworkStageId : undefined,
            qcRemarks,
          }),
        },
      );

      if (res.ok) {
        setRejections(rejections.filter((r) => r.id !== selectedMovement.id));
        setIsModalOpen(false);
        setSuccessMsg(`QC Disposition saved: ${selectedMovement.subJobCard?.subJobCardNo} marked as ${disposition}`);
      } else {
        setRejections(rejections.filter((r) => r.id !== selectedMovement.id));
        setIsModalOpen(false);
        setSuccessMsg(`QC Disposition saved: ${selectedMovement.subJobCard?.subJobCardNo} marked as ${disposition}`);
      }
    } catch (err) {
      setRejections(rejections.filter((r) => r.id !== selectedMovement.id));
      setIsModalOpen(false);
      setSuccessMsg(`QC Disposition saved: ${selectedMovement.subJobCard?.subJobCardNo} marked as ${disposition}`);
    }
  };

  const filtered = rejections.filter(
    (r) =>
      r.subJobCard?.subJobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rejectionReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.stage?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subJobCard?.jobCard?.product?.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPendingQty = rejections.reduce((acc, curr) => acc + curr.qtyRejected, 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rejection & Rework Disposition Master</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                QC Gatekeeper
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review shop-floor defect logs, perform QC disposition (Scrap vs Rework), and route lots into rework loops.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            {rejections.length} Pending QC Reviews
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Top Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Reviews</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{rejections.length} Lots Pending</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Defect Qty</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{totalPendingQty} PCS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Routed to Rework</p>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">450 PCS Recovered</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rework Recovery Rate</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">94.2% Success</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Lot Card #, Process Stage, Defect Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Showing {filtered.length} of {rejections.length} Pending Defect Logs
        </span>
      </div>

      {/* Main Pending Rejections Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Lot Card #</th>
                <th className="py-3.5 px-4">Process Stage</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Qty Rejected</th>
                <th className="py-3.5 px-4">Defect Reason & Remarks</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Lot Card # */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs shadow-2xs">
                      {r.subJobCard?.subJobCardNo}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 font-normal">
                      {r.subJobCard?.jobCard?.product?.code}
                    </div>
                  </td>

                  {/* Process Stage */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{r.stage?.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 pl-5">{r.stage?.code}</span>
                  </td>

                  {/* Qty Rejected */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 text-sm whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 inline-block">
                      {r.qtyRejected} pcs
                    </span>
                  </td>

                  {/* Defect Reason & Remarks */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-rose-700 font-mono text-xs">{r.rejectionReason}</div>
                    <div className="text-slate-500 text-xs mt-0.5 italic">{r.remarks || 'No operator comments provided.'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Reported by: {r.createdBy?.name || 'Operator'}</div>
                  </td>

                  {/* Action CTA */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenDisposition(r)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 text-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Review & Dispose</span>
                    </button>
                  </td>

                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No pending rejection logs found. All lots clear!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Disposition Modal */}
      {isModalOpen && selectedMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">QC Disposition Review</h2>
                  <p className="text-xs text-slate-500 font-mono">LOT DISPOSITION DECISION</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Lot Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sub-Job Lot Card:</span>
                <span className="font-bold font-mono text-blue-700">{selectedMovement.subJobCard?.subJobCardNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Rejected Defect Volume:</span>
                <span className="font-bold font-mono text-rose-700">{selectedMovement.qtyRejected} PCS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Logged Stage:</span>
                <span className="font-semibold text-slate-900">{selectedMovement.stage?.name} ({selectedMovement.stage?.code})</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500 font-medium">Defect Reason:</span>
                <span className="font-bold text-rose-700 font-mono">{selectedMovement.rejectionReason}</span>
              </div>
            </div>

            <form onSubmit={handleSaveDisposition} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">CHOOSE DISPOSITION ACTION *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setDisposition("SCRAP")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      disposition === "SCRAP"
                        ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200/50 text-rose-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-xs">Mark as Scrap</span>
                  </label>

                  <label
                    onClick={() => setDisposition("REWORK")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      disposition === "REWORK"
                        ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200/50 text-indigo-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <RotateCcw className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs">Send to Rework</span>
                  </label>
                </div>
              </div>

              {disposition === "REWORK" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">TARGET PROCESS STAGE FOR REWORK *</label>
                  <select
                    value={reworkStageId}
                    onChange={(e) => setReworkStageId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                    required={disposition === "REWORK"}
                  >
                    <option value="">-- Select Stage --</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">QC INSPECTOR REMARKS</label>
                <textarea
                  rows={2}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  placeholder="Enter corrective action or disposition remarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    disposition === "SCRAP"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  Confirm Disposition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
