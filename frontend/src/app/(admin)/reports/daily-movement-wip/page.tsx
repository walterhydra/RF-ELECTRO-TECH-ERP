'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/utils';
import {
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Download,
  Printer,
  ArrowLeft,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  BarChart3,
  Search,
} from 'lucide-react';

interface StageStatusRow {
  stageId: string;
  stageName: string;
  totalJobs: number;
  totalPnlQty: number;
  totalSqm: number;
  currentWipSqm: number;
}

interface OverdueJobItem {
  id: string;
  jobCardNo: string;
  customerPartNo: string;
  rfePartCode: string;
  customerCode: string;
  stage: string;
  targetDate: string;
  daysOverdue: number;
  priority: string;
  prodPnlQty: number;
  prodPnlAreaSqm: number;
}

interface ReportData {
  selectedDate: string;
  overdelayDaysConfigured: number;
  section1_stageStatusTable: StageStatusRow[];
  section2_delayMonitoring: {
    overdueJobsCount: number;
    overdelayedJobsCount: number;
    jobsExceedingTargetDate: OverdueJobItem[];
  };
  section3_qualityLossMonitoring: {
    totalReworkCount: number;
    totalReworkQty: number;
    totalRejectionCount: number;
    totalRejectionQty: number;
    totalProcessIssueCount: number;
    totalOtherCount: number;
    totalMovementsOnDate: number;
  };
}

export default function DailyJobMovementWipReportPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [overdelayDays, setOverdelayDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchReportData = () => {
    setLoading(true);
    fetch(
      `${getApiBaseUrl()}/reports/daily-movement-wip?date=${selectedDate}&overdelayDays=${overdelayDays}`
    )
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Daily Movement & WIP report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedDate, overdelayDays]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!report) return;
    let csv = 'Stage-Wise Job Status\n';
    csv += 'Stage,Total Jobs at Stage,Total PNL Qty,Total Sqm,Current WIP Sqm\n';
    report.section1_stageStatusTable.forEach((row) => {
      csv += `"${row.stageName}",${row.totalJobs},${row.totalPnlQty},${row.totalSqm},${row.currentWipSqm}\n`;
    });

    csv += '\nQuality & Loss Monitoring for Date: ' + report.selectedDate + '\n';
    csv += `Total Rework Movements,${report.section3_qualityLossMonitoring.totalReworkCount},Qty,${report.section3_qualityLossMonitoring.totalReworkQty}\n`;
    csv += `Total Rejection Movements,${report.section3_qualityLossMonitoring.totalRejectionCount},Qty,${report.section3_qualityLossMonitoring.totalRejectionQty}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Movement_WIP_Report_${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-400" />
              Daily Job Movement & WIP Report
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live Stage-Wise WIP Aggregation, Delay Monitoring & Quality Loss Tracking
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs font-mono">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-bold">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs font-mono">
            <Clock className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400 font-bold">Over-delay Days:</span>
            <input
              type="number"
              min={1}
              max={30}
              value={overdelayDays}
              onChange={(e) => setOverdelayDays(Number(e.target.value))}
              className="w-12 bg-slate-950 border border-slate-700 text-center text-amber-300 font-bold rounded-lg py-0.5 outline-none"
            />
          </div>

          <button
            onClick={fetchReportData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-2xl border border-slate-800 transition-all cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
            CURRENT TOTAL WIP SQM
          </span>
          <h3 className="text-2xl font-black text-emerald-400 font-mono">
            {report?.section1_stageStatusTable
              .reduce((acc, r) => acc + r.currentWipSqm, 0)
              .toFixed(2)}{' '}
            Sqm
          </h3>
          <p className="text-[11px] text-slate-500 font-mono">
            Across {report?.section1_stageStatusTable.length || 19} Stages
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
            OVERDUE JOBS (&gt; TARGET DATE)
          </span>
          <h3 className="text-2xl font-black text-rose-400 font-mono flex items-center gap-2">
            <span>{report?.section2_delayMonitoring.overdueJobsCount || 0}</span>
            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
          </h3>
          <p className="text-[11px] text-rose-400/80 font-mono font-bold">
            {report?.section2_delayMonitoring.overdelayedJobsCount || 0} Over-delayed (&gt;{' '}
            {overdelayDays} Days)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
            TODAY'S REWORK MOVEMENTS
          </span>
          <h3 className="text-2xl font-black text-amber-400 font-mono">
            {report?.section3_qualityLossMonitoring.totalReworkCount || 0} Logs
          </h3>
          <p className="text-[11px] text-amber-300/80 font-mono">
            Total Qty Tagged: {report?.section3_qualityLossMonitoring.totalReworkQty || 0} PNL
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
            TODAY'S REJECTION LOSS
          </span>
          <h3 className="text-2xl font-black text-rose-500 font-mono">
            {report?.section3_qualityLossMonitoring.totalRejectionCount || 0} Logs
          </h3>
          <p className="text-[11px] text-rose-400/80 font-mono">
            Total Rejected: {report?.section3_qualityLossMonitoring.totalRejectionQty || 0} PNL
          </p>
        </div>
      </div>

      {/* SECTION 1: STAGE-WISE JOB STATUS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-amber-400 font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            SECTION 1: STAGE-WISE JOB STATUS
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Live WIP inventory at each stage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider bg-slate-950/60">
                <th className="p-3">STAGE</th>
                <th className="p-3 text-center">TOTAL JOBS AT STAGE</th>
                <th className="p-3 text-center">TOTAL PNL QTY</th>
                <th className="p-3 text-center">TOTAL SQM</th>
                <th className="p-3 text-center">CURRENT WIP SQM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono font-bold">
              {report?.section1_stageStatusTable.map((row) => (
                <tr key={row.stageId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-amber-300">{row.stageName}</td>
                  <td className="p-3 text-center text-slate-200">{row.totalJobs}</td>
                  <td className="p-3 text-center text-amber-400">{row.totalPnlQty} PNL</td>
                  <td className="p-3 text-center text-emerald-400">{row.totalSqm} Sqm</td>
                  <td className="p-3 text-center text-emerald-300 font-black">
                    {row.currentWipSqm} Sqm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DELAY MONITORING */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-rose-400 font-mono flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-400" />
            SECTION 2: DELAY MONITORING
          </h2>
          <span className="text-xs text-rose-400/80 font-mono font-bold">
            Threshold: Over-delayed &gt; {overdelayDays} Days
          </span>
        </div>

        {report?.section2_delayMonitoring.jobsExceedingTargetDate.length === 0 ? (
          <div className="py-8 text-center text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl font-mono text-xs font-bold">
            ✅ No overdue jobs! All production jobs are on schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider bg-slate-950/60">
                  <th className="p-3">JOB CARD NO</th>
                  <th className="p-3">PART CODE / CUSTOMER</th>
                  <th className="p-3">CURRENT STAGE</th>
                  <th className="p-3">QTY & AREA</th>
                  <th className="p-3">TARGET DATE</th>
                  <th className="p-3 text-center">DAYS OVERDUE</th>
                  <th className="p-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono font-bold">
                {report?.section2_delayMonitoring.jobsExceedingTargetDate.map((job) => {
                  const isSevere = job.daysOverdue > overdelayDays;
                  return (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-amber-400 font-black">{job.jobCardNo}</td>
                      <td className="p-3">
                        <span className="block text-white font-bold">{job.rfePartCode}</span>
                        <span className="block text-[10px] text-slate-400">{job.customerCode}</span>
                      </td>
                      <td className="p-3 text-blue-400">{job.stage}</td>
                      <td className="p-3 text-amber-300">
                        {job.prodPnlQty} PNL ({job.prodPnlAreaSqm} Sqm)
                      </td>
                      <td className="p-3 text-slate-300">{job.targetDate}</td>
                      <td className="p-3 text-center text-rose-400 font-black">
                        +{job.daysOverdue} Days
                      </td>
                      <td className="p-3 text-center">
                        {isSevere ? (
                          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-[10px] font-black uppercase">
                            OVER-DELAYED (&gt;{overdelayDays}D)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-[10px] font-black uppercase">
                            OVERDUE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: QUALITY & LOSS MONITORING */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-emerald-400 font-mono flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            SECTION 3: QUALITY / LOSS MONITORING FOR {selectedDate}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Tagged Movement Logs for Selected Date
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">REWORK MOVEMENTS</span>
            <p className="text-lg font-black text-amber-400">
              {report?.section3_qualityLossMonitoring.totalReworkCount} Logs
            </p>
            <p className="text-[11px] text-amber-300/80">
              Total Qty: {report?.section3_qualityLossMonitoring.totalReworkQty} PNL
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">REJECTION MOVEMENTS</span>
            <p className="text-lg font-black text-rose-400">
              {report?.section3_qualityLossMonitoring.totalRejectionCount} Logs
            </p>
            <p className="text-[11px] text-rose-300/80">
              Total Qty: {report?.section3_qualityLossMonitoring.totalRejectionQty} PNL
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">PROCESS ISSUES</span>
            <p className="text-lg font-black text-blue-400">
              {report?.section3_qualityLossMonitoring.totalProcessIssueCount} Logs
            </p>
            <p className="text-[11px] text-slate-400">Tagged Process Issues</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">CLEAR MOVEMENTS</span>
            <p className="text-lg font-black text-emerald-400">
              {report?.section3_qualityLossMonitoring.totalOtherCount} Logs
            </p>
            <p className="text-[11px] text-emerald-300/80">Standard Flow Movements</p>
          </div>
        </div>
      </div>
    </div>
  );
}
