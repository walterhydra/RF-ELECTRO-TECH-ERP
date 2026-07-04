"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Radio,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Package,
  XCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";

const API = "http://localhost:3001/api/v1";

interface ProcessStage {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  defaultOrder: number | null;
}

interface SubJobCardWip {
  id: string;
  subJobCardNo: string;
  qty: number;
  qtyReceived: number;
  qtyProcessed: number;
  qtyHold: number;
  qtyRejected: number;
  status: string;
  jobCard?: { jobCardNo: string; product?: { code: string; name: string } };
}

interface StageMetrics {
  stage: ProcessStage;
  wipTotal: number;
  subJobCards: SubJobCardWip[];
  holdQty: number;
  rejectedQty: number;
  status: "NORMAL" | "BUSY" | "BOTTLENECK" | "IDLE";
}

export default function FloorMonitorPage() {
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const loadFloorData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch stages
      const stagesRes = await fetch(`${API}/process-stages`, { headers });
      const stages: ProcessStage[] = stagesRes.ok ? await stagesRes.json() : [];

      // Fetch all job cards to get sub-job-cards with WIP
      const jobCardsRes = await fetch(`${API}/job-cards`, { headers });
      let allSubJobCards: SubJobCardWip[] = [];

      if (jobCardsRes.ok) {
        const jobCards = await jobCardsRes.json();
        const items = Array.isArray(jobCards) ? jobCards : jobCards.data || [];
        items.forEach((jc: any) => {
          if (jc.subJobCards) {
            jc.subJobCards.forEach((sjc: any) => {
              allSubJobCards.push({
                ...sjc,
                jobCard: { jobCardNo: jc.jobCardNo, product: jc.product },
              });
            });
          }
        });
      }

      // Build metrics per stage
      const activeStages = stages
        .filter((s) => s.isActive)
        .sort((a, b) => (a.defaultOrder || 0) - (b.defaultOrder || 0));

      const metrics: StageMetrics[] = activeStages.map((stage) => {
        const sjcsAtStage = allSubJobCards.filter(
          (sjc) =>
            (sjc as any).currentStageId === stage.id ||
            (sjc as any).currentStage?.id === stage.id,
        );

        const wipTotal = sjcsAtStage.reduce((sum, s) => sum + s.qty, 0);
        const holdQty = sjcsAtStage.reduce(
          (sum, s) => sum + (s.qtyHold || 0),
          0,
        );
        const rejectedQty = sjcsAtStage.reduce(
          (sum, s) => sum + (s.qtyRejected || 0),
          0,
        );

        let status: StageMetrics["status"] = "NORMAL";
        if (wipTotal === 0) status = "IDLE";
        else if (wipTotal > 3000) status = "BOTTLENECK";
        else if (wipTotal > 1500) status = "BUSY";

        return {
          stage,
          wipTotal,
          subJobCards: sjcsAtStage,
          holdQty,
          rejectedQty,
          status,
        };
      });

      setStageMetrics(metrics);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Floor data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFloorData();
    const interval = setInterval(loadFloorData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [loadFloorData]);

  const getStatusStyle = (status: StageMetrics["status"]) => {
    switch (status) {
      case "BOTTLENECK":
        return "bg-red-50 text-red-600 border-red-200 animate-pulse";
      case "BUSY":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "IDLE":
        return "bg-slate-50 text-slate-500 border-slate-200";
      default:
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    }
  };

  const getCardBorder = (status: StageMetrics["status"]) => {
    switch (status) {
      case "BOTTLENECK":
        return "border-red-200 bg-red-50/30";
      case "BUSY":
        return "border-amber-200 bg-amber-50/30";
      default:
        return "border-slate-200 bg-white";
    }
  };

  const totalWip = stageMetrics.reduce((sum, m) => sum + m.wipTotal, 0);
  const totalHold = stageMetrics.reduce((sum, m) => sum + m.holdQty, 0);
  const totalRejected = stageMetrics.reduce((sum, m) => sum + m.rejectedQty, 0);
  const bottlenecks = stageMetrics.filter(
    (m) => m.status === "BOTTLENECK",
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shop Floor WIP & Bottleneck Monitor
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            REAL-TIME FLOOR TRACKING • {stageMetrics.length} MANUFACTURING
            STAGES
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadFloorData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-mono font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            REFRESH
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 shadow-sm rounded-full text-emerald-700 text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE • {lastRefresh || "..."}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-slate-500 mb-1">
            TOTAL WIP
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {totalWip.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            PCS ACROSS ALL STAGES
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-amber-600 mb-1">
            ON HOLD
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">
            {totalHold.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-slate-500">PCS WAITING</div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-red-600 mb-1">
            REJECTED
          </div>
          <div className="text-xl font-bold font-mono text-red-700">
            {totalRejected.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-slate-500">PCS SCRAP</div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-red-600 mb-1">
            BOTTLENECKS
          </div>
          <div className="text-xl font-bold font-mono text-red-700">
            {bottlenecks}
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            STAGES OVER CAPACITY
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      )}

      {/* Stage Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageMetrics.map((metric) => (
            <div
              key={metric.stage.id}
              className={`border shadow-sm ${getCardBorder(metric.status)} p-5 rounded-xl space-y-3 transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600">
                  {metric.stage.code}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusStyle(metric.status)}`}
                >
                  {metric.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {metric.stage.name}
              </h3>

              {/* WIP Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">CURRENT WIP:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {metric.wipTotal.toLocaleString()} PCS
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.status === "BOTTLENECK"
                        ? "bg-red-500"
                        : metric.status === "BUSY"
                          ? "bg-amber-500"
                          : metric.status === "IDLE"
                            ? "bg-slate-300"
                            : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.wipTotal / Math.max(totalWip, 1)) * 300)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3 text-[10px] font-mono border-t border-slate-100 pt-2">
                <span className="text-slate-500">
                  Lots:{" "}
                  <span className="text-slate-900 font-bold">
                    {metric.subJobCards.length}
                  </span>
                </span>
                {metric.holdQty > 0 && (
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <PauseCircle className="w-3 h-3" /> {metric.holdQty}
                  </span>
                )}
                {metric.rejectedQty > 0 && (
                  <span className="text-red-600 flex items-center gap-0.5">
                    <XCircle className="w-3 h-3" /> {metric.rejectedQty}
                  </span>
                )}
              </div>

              {/* Expandable Lot List */}
              {metric.subJobCards.length > 0 && (
                <button
                  onClick={() =>
                    setExpandedStage(
                      expandedStage === metric.stage.id
                        ? null
                        : metric.stage.id,
                    )
                  }
                  className="w-full text-left text-[10px] font-mono text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors font-bold"
                >
                  {expandedStage === metric.stage.id ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  {expandedStage === metric.stage.id ? "Hide" : "Show"} lots
                </button>
              )}

              {expandedStage === metric.stage.id &&
                metric.subJobCards.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto space-y-1.5 border-t border-slate-100 pt-2">
                    {metric.subJobCards.map((sjc) => (
                      <div
                        key={sjc.id}
                        className="bg-slate-50 border border-slate-200 shadow-sm rounded-lg p-2 text-[10px] font-mono space-y-0.5"
                      >
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-bold">
                            {sjc.subJobCardNo}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              sjc.status === "ON_HOLD"
                                ? "bg-amber-100 text-amber-800"
                                : sjc.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sjc.status}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          {sjc.jobCard?.product?.code || "—"} • JC:{" "}
                          {sjc.jobCard?.jobCardNo || "—"}
                        </p>
                        <p className="text-slate-600">
                          Qty: {sjc.qty} | R:{sjc.qtyReceived || 0} P:
                          {sjc.qtyProcessed || 0} H:{sjc.qtyHold || 0} X:
                          {sjc.qtyRejected || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && stageMetrics.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 font-mono">
            No active process stages found. Set up stages in Process Master.
          </p>
        </div>
      )}
    </div>
  );
}
