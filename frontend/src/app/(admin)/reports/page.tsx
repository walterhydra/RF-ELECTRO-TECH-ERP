import React from "react";
import { BarChart3, Download, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Production Analytics & Export Reports
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            EXCEL & PDF EXPORTS FOR OEE, WIP, YIELD & REJECT ANALYSIS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel</span>
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all">
            <Download className="w-4 h-4 text-rose-500" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/reports/rejections" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-amber-300 hover:bg-amber-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-amber-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Rejection Summary
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Analyze process-wise rejection metrics and QC disposition totals.
            </p>
          </div>
        </a>
        <a href="/reports/rework" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-indigo-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Rework Status
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Track active rework lots, traceability back to parent lots, and
              WIP.
            </p>
          </div>
        </a>
        <a href="/reports/daily-production" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-emerald-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Daily Production
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Analyze daily production output and productivity per process.
            </p>
          </div>
        </a>
        <a href="/reports/wip" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-cyan-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
              Pending WIP
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time work-in-progress quantity at each manufacturing stage.
            </p>
          </div>
        </a>
        <a href="/reports/job-cards" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-pink-300 hover:bg-pink-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-pink-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
              Job Card Status
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Job launch status, lead time, and overall completion times.
            </p>
          </div>
        </a>
        <a href="/reports/orders" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-blue-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Order Status
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Customer-wise and PO-wise production statuses.
            </p>
          </div>
        </a>
        <a href="/reports/dispatch" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-purple-300 hover:bg-purple-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-purple-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Dispatch Status
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Track dispatches, delivery statuses, and job completion.
            </p>
          </div>
        </a>
        <a href="/reports/traceability" className="block group">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 hover:border-orange-300 hover:bg-orange-50/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-center">
            <BarChart3 className="w-10 h-10 text-orange-500 mx-auto group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
              Traceability
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              End-to-end movement history for any specific Job Card.
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
