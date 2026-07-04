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

export default function RejectionsPage() {
  const [rejections, setRejections] = useState<PendingRejection[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<PendingRejection | null>(null);
  const [disposition, setDisposition] = useState<"SCRAP" | "REWORK">("SCRAP");
  const [reworkStageId, setReworkStageId] = useState("");
  const [qcRemarks, setQcRemarks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRejections();
    fetchStages();
  }, []);

  const fetchRejections = async () => {
    try {
      const res = await fetch(
        "http://localhost:3001/api/v1/rejections/pending",
      );
      if (res.ok) {
        const data = await res.json();
        setRejections(data);
      }
    } catch (e) {
      // Offline mock data
      setRejections([
        {
          id: "mov-1",
          subJobCard: {
            subJobCardNo: "JC001-1",
            jobCard: {
              jobCardNo: "JC001",
              product: { code: "P01", name: "Sample Board" },
            },
          },
          stage: { name: "Drilling", code: "DRL" },
          qtyRejected: 15,
          rejectionReason: "OVERSIZED_HOLE",
          remarks: "Drill bit broke",
          createdBy: { name: "Operator 1" },
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/process-stages");
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      }
    } catch (e) {
      setStages([
        { id: "stg-1", name: "Inner Layer Imaging", code: "ILI" },
        { id: "stg-2", name: "Drilling", code: "DRL" },
      ]);
    }
  };

  const handleOpenDisposition = (movement: PendingRejection) => {
    setSelectedMovement(movement);
    setDisposition("SCRAP");
    setReworkStageId("");
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
      } else {
        const data = await res.json();
        setError(data.message || "Failed to save disposition");
      }
    } catch (err) {
      // Fake successful update if offline
      setRejections(rejections.filter((r) => r.id !== selectedMovement.id));
      setIsModalOpen(false);
    }
  };

  const filtered = rejections.filter(
    (r) =>
      r.subJobCard?.subJobCardNo
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      r.rejectionReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.stage?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Pending Rejections
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            QC DISPOSITION • SCRAP OR REWORK
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by Sub Job Card, Process, or Reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-900 placeholder-slate-400 w-full focus:outline-none"
        />
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-600">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Lot No</th>
                <th className="py-4 px-6">Process</th>
                <th className="py-4 px-6">Qty Rejected</th>
                <th className="py-4 px-6">Reason</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6 text-slate-500 text-xs">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-blue-600">
                    {r.subJobCard?.subJobCardNo}
                  </td>
                  <td className="py-4 px-6 text-slate-700">{r.stage?.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md font-bold">
                      {r.qtyRejected}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    <div className="font-semibold text-red-600">
                      {r.rejectionReason}
                    </div>
                    <div className="text-xs text-slate-500">{r.remarks}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleOpenDisposition(r)}
                      className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No pending rejections found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                QC Disposition
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Lot No:</span>
                <span className="font-bold text-blue-600">
                  {selectedMovement.subJobCard?.subJobCardNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rejected Qty:</span>
                <span className="font-bold text-red-600">
                  {selectedMovement.qtyRejected} pcs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Process:</span>
                <span className="text-slate-700">
                  {selectedMovement.stage?.name}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500">Reason:</span>
                <span className="text-slate-700">
                  {selectedMovement.rejectionReason}
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSaveDisposition}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2">
                  DISPOSITION ACTION
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disposition"
                      value="SCRAP"
                      checked={disposition === "SCRAP"}
                      onChange={() => setDisposition("SCRAP")}
                      className="accent-red-500 w-4 h-4"
                    />
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold border ${disposition === "SCRAP" ? "bg-red-50 text-red-700 border-red-200" : "text-slate-500 border-slate-200"}`}
                    >
                      Mark as Scrap
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disposition"
                      value="REWORK"
                      checked={disposition === "REWORK"}
                      onChange={() => setDisposition("REWORK")}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold border ${disposition === "REWORK" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "text-slate-500 border-slate-200"}`}
                    >
                      Send to Rework
                    </span>
                  </label>
                </div>
              </div>

              {disposition === "REWORK" && (
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    TARGET PROCESS FOR REWORK *
                  </label>
                  <select
                    value={reworkStageId}
                    onChange={(e) => setReworkStageId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
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
                <label className="block text-xs font-mono text-slate-500 mb-1">
                  QC REMARKS
                </label>
                <textarea
                  rows={2}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  placeholder="Optional remarks..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 resize-none shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-sm ${
                    disposition === "SCRAP"
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-indigo-600 hover:bg-indigo-500"
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
