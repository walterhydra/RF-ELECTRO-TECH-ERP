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
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Flame,
  ShieldAlert,
  Sliders,
  Box
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

const MOCK_STAGE_METRICS: StageMetrics[] = [
  {
    stage: { id: 'stg-1', name: 'CAM & Gerber Verification', code: 'ENG-01', isActive: true, defaultOrder: 1 },
    wipTotal: 2500,
    status: 'NORMAL',
    holdQty: 0,
    rejectedQty: 0,
    subJobCards: [
      { id: 's1', subJobCardNo: 'JC-2026-002-A', qty: 2500, qtyReceived: 2500, qtyProcessed: 0, qtyHold: 0, qtyRejected: 0, status: 'UNLAUNCHED', jobCard: { jobCardNo: 'JC-2026-002', product: { code: 'PCB-PSU-10', name: 'Power Supply PCB' } } }
    ]
  },
  {
    stage: { id: 'stg-2', name: 'CNC Material Cutting', code: 'CNC-01', isActive: true, defaultOrder: 2 },
    wipTotal: 1000,
    status: 'NORMAL',
    holdQty: 0,
    rejectedQty: 0,
    subJobCards: [
      { id: 's2', subJobCardNo: 'JC-2026-001-B', qty: 1000, qtyReceived: 1000, qtyProcessed: 0, qtyHold: 0, qtyRejected: 0, status: 'IN_PROGRESS', jobCard: { jobCardNo: 'JC-2026-001', product: { code: 'PCB-MB-V2', name: 'Main Motherboard V2' } } }
    ]
  },
  {
    stage: { id: 'stg-3', name: 'CNC Drilling & Routing', code: 'CNC-02', isActive: true, defaultOrder: 3 },
    wipTotal: 1500,
    status: 'BUSY',
    holdQty: 200,
    rejectedQty: 10,
    subJobCards: [
      { id: 's3', subJobCardNo: 'JC-2026-001-A', qty: 1500, qtyReceived: 1500, qtyProcessed: 1300, qtyHold: 200, qtyRejected: 10, status: 'IN_PROGRESS', jobCard: { jobCardNo: 'JC-2026-001', product: { code: 'PCB-MB-V2', name: 'Main Motherboard V2' } } }
    ]
  },
  {
    stage: { id: 'stg-4', name: 'PTH Copper Plating', code: 'WET-01', isActive: true, defaultOrder: 4 },
    wipTotal: 3500,
    status: 'BOTTLENECK',
    holdQty: 300,
    rejectedQty: 25,
    subJobCards: [
      { id: 's4', subJobCardNo: 'JC-2026-003-A', qty: 3500, qtyReceived: 3500, qtyProcessed: 3200, qtyHold: 300, qtyRejected: 25, status: 'IN_PROGRESS', jobCard: { jobCardNo: 'JC-2026-003', product: { code: 'PCB-RF-01', name: 'RF Transceiver Board' } } }
    ]
  },
  {
    stage: { id: 'stg-5', name: 'AOI Optical Inspection', code: 'QC-01', isActive: true, defaultOrder: 5 },
    wipTotal: 0,
    status: 'IDLE',
    holdQty: 0,
    rejectedQty: 0,
    subJobCards: []
  },
];

export default function FloorMonitorPage() {
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>(MOCK_STAGE_METRICS);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [expandedStage, setExpandedStage] = useState<string | null>('stg-4');

  const loadFloorData = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch stages
      const stagesRes = await fetch(`${API}/process-stages`, { headers });
      const stages: ProcessStage[] = stagesRes.ok ? await stagesRes.json() : [];

      // Fetch all job cards
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

      if (stages.length > 0) {
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
          const holdQty = sjcsAtStage.reduce((sum, s) => sum + (s.qtyHold || 0), 0);
          const rejectedQty = sjcsAtStage.reduce((sum, s) => sum + (s.qtyRejected || 0), 0);

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

        if (metrics.length > 0) setStageMetrics(metrics);
      }
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Floor data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFloorData();
    const interval = setInterval(loadFloorData, 30000);
    return () => clearInterval(interval);
  }, [loadFloorData]);

  const getStatusBadge = (status: StageMetrics["status"]) => {
    switch (status) {
      case "BOTTLENECK":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 border border-rose-200 text-rose-700 inline-flex items-center gap-1.5 animate-pulse shadow-2xs">
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-600" /> BOTTLENECK
          </span>
        );
      case "BUSY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 inline-flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> BUSY
          </span>
        );
      case "IDLE":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-500 inline-flex items-center gap-1.5">
            <PauseCircle className="w-3.5 h-3.5 text-slate-400" /> IDLE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 inline-flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> NORMAL
          </span>
        );
    }
  };

  const totalWip = stageMetrics.reduce((sum, m) => sum + m.wipTotal, 0);
  const totalHold = stageMetrics.reduce((sum, m) => sum + m.holdQty, 0);
  const totalRejected = stageMetrics.reduce((sum, m) => sum + m.rejectedQty, 0);
  const bottlenecks = stageMetrics.filter((m) => m.status === "BOTTLENECK").length;

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Live Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shop Floor Real-Time WIP & Bottleneck Monitor</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                PWA Shop Floor Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live manufacturing stage queue density, bottleneck stage alerts, active lot WIP & scrap/hold logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadFloorData}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-mono font-bold shadow-2xs">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>LIVE • {lastRefresh || "Active"}</span>
          </div>
        </div>
      </div>

      {/* Top Metrics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total WIP */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Shop Floor WIP</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalWip.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span></p>
          </div>
        </div>

        {/* On Hold */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <PauseCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">On Hold Queue</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{totalHold.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS Waiting</span></p>
          </div>
        </div>

        {/* Rejected Scrap */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rejected Scrap</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{totalRejected.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS Scrap</span></p>
          </div>
        </div>

        {/* Bottleneck Stages */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Bottleneck Stages</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{bottlenecks} <span className="text-xs font-normal text-slate-500">Over Capacity</span></p>
          </div>
        </div>

      </div>

      {/* Stage Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stageMetrics.map((metric) => {
          const isExpanded = expandedStage === metric.stage.id;
          const maxCapacity = Math.max(totalWip, 3000);
          const percent = Math.min(100, Math.round((metric.wipTotal / maxCapacity) * 100));

          return (
            <div
              key={metric.stage.id}
              className={`bg-white border ${
                metric.status === 'BOTTLENECK' 
                  ? 'border-rose-300 ring-2 ring-rose-200/50' 
                  : metric.status === 'BUSY'
                    ? 'border-amber-300'
                    : 'border-slate-200'
              } p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all`}
            >
              {/* Stage Top Bar */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-900">
                  {metric.stage.code}
                </span>
                {getStatusBadge(metric.status)}
              </div>

              {/* Stage Name */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{metric.stage.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Stage Order #{metric.stage.defaultOrder || 1}</p>
              </div>

              {/* WIP Meter Bar */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">CURRENT STAGE WIP:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {metric.wipTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.status === "BOTTLENECK"
                        ? "bg-rose-500"
                        : metric.status === "BUSY"
                          ? "bg-amber-500"
                          : metric.status === "IDLE"
                            ? "bg-slate-300"
                            : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.max(percent, 8)}%` }}
                  />
                </div>
              </div>

              {/* Quick Lots & Hold/Scrap Summary */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-semibold">
                  Active Lots: <span className="text-slate-900 font-bold">{metric.subJobCards.length}</span>
                </span>

                <div className="flex items-center gap-3">
                  {metric.holdQty > 0 && (
                    <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <PauseCircle className="w-3 h-3 text-amber-600" /> {metric.holdQty} H
                    </span>
                  )}
                  {metric.rejectedQty > 0 && (
                    <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <XCircle className="w-3 h-3 text-rose-600" /> {metric.rejectedQty} R
                    </span>
                  )}
                </div>
              </div>

              {/* Expand Lots Accordion Toggle */}
              {metric.subJobCards.length > 0 && (
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : metric.stage.id)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{isExpanded ? "Hide Lot Cards Queue" : `View ${metric.subJobCards.length} Active Lot Batches`}</span>
                </button>
              )}

              {/* Expanded Sub-Job Card Lot Queue */}
              {isExpanded && metric.subJobCards.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3 max-h-[240px] overflow-y-auto pr-1">
                  {metric.subJobCards.map((sjc) => (
                    <div
                      key={sjc.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{sjc.subJobCardNo}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {sjc.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Product: <span className="font-bold text-slate-800">{sjc.jobCard?.product?.code || "—"}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Batch Qty: <strong className="text-slate-900">{sjc.qty}</strong></span>
                        <span>Hold: <strong className="text-amber-800">{sjc.qtyHold || 0}</strong></span>
                        <span>Scrap: <strong className="text-rose-700">{sjc.qtyRejected || 0}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
