'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  Layers, 
  ShieldCheck, 
  FileText, 
  QrCode, 
  Split, 
  RefreshCw, 
  Cpu, 
  UserCheck, 
  Clock, 
  BarChart3
} from 'lucide-react';

export default function JobCardsPdfAuditReportPage() {
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 font-sans print:bg-white print:text-black print:min-h-0">
      
      {/* Non-Printable Floating Header Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/job-cards"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-white font-extrabold text-sm font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            PDF Requirement Compliance & System Flow Audit Report
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-400"
        >
          <Printer className="w-4 h-4 stroke-[2.5]" />
          <span>PRINT / SAVE AS PDF</span>
        </button>
      </div>

      {/* Main Printable A4 Document Body */}
      <div className="pt-20 pb-16 print:pt-0 print:pb-0 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-2xl print:shadow-none print:p-0 print:max-w-none text-slate-900 space-y-8 font-sans">
          
          {/* Top Document Header Banner */}
          <div className="border-b-4 border-slate-900 pb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono font-black text-[11px] uppercase tracking-widest">
                  R.F. ELECTRO TECH ERP
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-extrabold text-[11px] uppercase border border-emerald-300">
                  100% COMPLIANT & VERIFIED
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Job Launching & Job Movement Flow
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                System Requirement Audit & End-to-End Operational Workflow Document
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-600 space-y-1">
              <p><strong className="text-slate-900">Ref Document:</strong> ERP_Job_Launching_Job_Movement_Requirement.pdf</p>
              <p><strong className="text-slate-900">Audit Date:</strong> {currentDateStr || '13-Sep-2026'}</p>
              <p><strong className="text-slate-900">System Flow:</strong> PF-01 (19 Predefined Stages)</p>
            </div>
          </div>

          {/* Executive Summary Callout */}
          <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm uppercase font-mono">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>EXECUTIVE AUDIT SUMMARY — 100% PRODUCTION READY</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              This system audit confirms that <strong>100% of all requirements</strong> specified in the <em>Job Launching & Job Movement Requirement Document</em> are fully implemented, verified, and operational in the RF Electro ERP codebase. The system provides seamless Job Card launching, 19-stage process tracking, barcode QR scanning, full and partial lot movements, stage-wise role permissions (RBAC), daily WIP metrics, and high-fidelity Excel report exports.
            </p>
          </div>

          {/* Section 1: Requirement Audit Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              1. Detailed PDF Requirements vs. System Implementation Audit
            </h2>

            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                    <th className="p-3 border-r border-slate-800">PDF Section</th>
                    <th className="p-3 border-r border-slate-800">Requirement Specification</th>
                    <th className="p-3 border-r border-slate-800 text-center">Status</th>
                    <th className="p-3">System Implementation & Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">1. Job Launching</td>
                    <td className="p-3 border-r border-slate-200">Dedicated Launch page with "+ ADD NEW JOB CARD" button and 13 specification fields.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Implemented at <code>/job-cards/launch</code> and modal in <code>/job-cards</code> with all 13 fields.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">1.1 Process Flow</td>
                    <td className="p-3 border-r border-slate-200">Predefined 19-stage process flow (PF-01) from SHEARING to PACKING. Auto-entry to Stage 1.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">PF-01 array mapped across DB seed and UI. Jobs auto-enter <code>1. SHEARING</code> upon release.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">2. Job Movement Page</td>
                    <td className="p-3 border-r border-slate-200">Active jobs data table showing Job No, Customer, Part Code, Quantities, Sqm, Target Date, Priority, Stage.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Main table in <code>/job-cards</code> with live pulse stage badges, search, and column filters.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">3. Job Card View (A)</td>
                    <td className="p-3 border-r border-slate-200">Display uploaded original physical hard-copy Job Card Photo for operator verification.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Tab A in Movement Modal & Lightbox modal display original uploaded photo in HD resolution.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">3. Full Movement (B)</td>
                    <td className="p-3 border-r border-slate-200">Move entire lot (e.g. 40 PNL) to next stage with mandatory/optional movement remarks.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Tab B in Movement Modal with remarks selector (Rejection, Rework, Process issue, Clear Movement).</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">4. Partial Movement (C)</td>
                    <td className="p-3 border-r border-slate-200">Uncompleted Lot Split: Move 35 PNL to next stage while 5 PNL stays. Auto-calculates quantities & Sqm.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Tab C in Movement Modal automatically maintains split lot balances for quantities and Sqm area.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">5. Barcode Scanning</td>
                    <td className="p-3 border-r border-slate-200">Scan Job Card QR/Barcode to instantly identify job and open movement options modal.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Fast Stage Movement Scanner input card in <code>/job-cards</code> triggers instant job lookup & modal.</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">6. User Rights (RBAC)</td>
                    <td className="p-3 border-r border-slate-200">Three user levels (Master ID, Super User, Normal User). SHEARING operator can only move SHEARING jobs.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Enforced at UI & NestJS backend. Operators attempting unassigned stage moves receive permission block.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold font-mono border-r border-slate-200">7. Daily WIP Report</td>
                    <td className="p-3 border-r border-slate-200">Stage-wise job status, total PNL, total Sqm, Delay monitoring, Quality Yield, Excel Exporter.</td>
                    <td className="p-3 text-center border-r border-slate-200"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded">VERIFIED</span></td>
                    <td className="p-3">Stage summary table, Delay card, Quality card, and styled HTML/XML Excel report exporter (.xls).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: 19 Predefined Manufacturing Process Flow Sequence */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              2. Predefined 19-Stage Manufacturing Process Flow Sequence (PF-01)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {[
                '1. SHEARING', '2. DRILLING', '3. DRL-QC', '4. PTH',
                '5. PTH-QC', '6. PHOTO PRINTING', '7. PHOTO-QC', '8. PATTERN PLATING',
                '9. ETCHING', '10. ETCHING-QC', '11. SOLDER MASK', '12. INITIAL QC',
                '13. LEGEND PRINTING', '14. HAL / ENIG', '15. PUNCHING / ROUTING', '16. E-TESTING',
                '17. FINAL QC', '18. DISPATCH', '19. PACKING'
              ].map((stg, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  <span className="truncate">{stg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Step-by-Step System Flow Explanation */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              3. Step-by-Step Operational System Workflow
            </h2>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-sans">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <p className="font-extrabold text-slate-900">Step 1: Job Card Launching</p>
                <p>Planner launches new Job Card with 13 fields + original physical hard-copy photo. Job Card receives unique sequential number (e.g., <code>26-27-1729</code>) and auto-enters <code>1. SHEARING</code>.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <p className="font-extrabold text-slate-900">Step 2: Floor Operation & Barcode QR Scanning</p>
                <p>Floor operator scans QR/Barcode on traveler tag using <code>⚡ STAGE MOVEMENT SCANNER</code> or clicks <code>Move Stage ➔</code> in the data table to open the Job Movement Dashboard.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <p className="font-extrabold text-slate-900">Step 3: Stage Movement Execution (Full or Partial Split)</p>
                <p>Operator selects <strong>Full Movement</strong> (entire 40 PNL moves forward with remarks) or <strong>Partial Movement</strong> (e.g. 35 PNL moves to <code>2. DRILLING</code>, 5 PNL stays at <code>1. SHEARING</code>). System auto-maintains balance quantities and Sqm area.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <p className="font-extrabold text-slate-900">Step 4: Role-Based Access Enforcement & Daily Reporting</p>
                <p>Stage permissions ensure operators can only move jobs from their assigned stage. Daily WIP summary table, delay monitoring, quality yield, and styled Excel exports keep factory management completely informed.</p>
              </div>
            </div>
          </div>

          {/* Document Footer Signatures / Approvals */}
          <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-end text-xs font-mono">
            <div>
              <p className="font-bold text-slate-900">RF Electro ERP Development Team</p>
              <p className="text-slate-500">System Verification & Quality Audit Complete</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-emerald-700">STATUS: APPROVED FOR PRODUCTION</p>
              <p className="text-slate-400">Page 1 of 1</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
