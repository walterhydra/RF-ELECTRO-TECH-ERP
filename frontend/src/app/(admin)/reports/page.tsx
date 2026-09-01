'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Layers, 
  ShoppingCart, 
  Truck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  FileText,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ReportCardItem {
  id: string;
  title: string;
  categoryGroup: 'QC' | 'FLOOR' | 'COMMERCIAL';
  categoryLabel: string;
  description: string;
  href: string;
  icon: any;
  colorTheme: 'amber' | 'blue' | 'emerald' | 'purple' | 'cyan' | 'rose' | 'orange' | 'indigo';
  liveStat: string;
  statLabel: string;
  trend: string;
  isPositive: boolean;
}

const REPORT_MODULES: ReportCardItem[] = [
  {
    id: 'rejections',
    title: 'Rejection & Scrap Summary',
    categoryGroup: 'QC',
    categoryLabel: 'QUALITY ASSURANCE',
    description: 'Process-wise PCB rejection metrics, defect Pareto breakdown, and QC scrap disposition logs.',
    href: '/reports/rejections',
    icon: PieChart,
    colorTheme: 'rose',
    liveStat: '2.2%',
    statLabel: 'Scrap Defect Rate',
    trend: '-0.4% Reduction',
    isPositive: true,
  },
  {
    id: 'rework',
    title: 'Rework Lot Traceability',
    categoryGroup: 'FLOOR',
    categoryLabel: 'SHOP FLOOR RECOVERY',
    description: 'Active rework loop tracking, parent-child lot lineage, and stage-wise recovery rates.',
    href: '/reports/rework',
    icon: Activity,
    colorTheme: 'indigo',
    liveStat: '450 PCS',
    statLabel: 'In Rework Queue',
    trend: '94% Recovered',
    isPositive: true,
  },
  {
    id: 'daily-production',
    title: 'Daily Production Output',
    categoryGroup: 'FLOOR',
    categoryLabel: 'PLANT THROUGHPUT',
    description: 'Shift panel output volume, operator productivity, and daily manufacturing target variance.',
    href: '/reports/daily-production',
    icon: TrendingUp,
    colorTheme: 'emerald',
    liveStat: '3,200',
    statLabel: 'PCBs Today',
    trend: '+12% vs Target',
    isPositive: true,
  },
  {
    id: 'wip',
    title: 'Pending Stage WIP Monitor',
    categoryGroup: 'FLOOR',
    categoryLabel: 'INVENTORY & FLOW',
    description: 'Real-time work-in-progress quantity at each stage, queue density & bottleneck alerts.',
    href: '/reports/wip',
    icon: Layers,
    colorTheme: 'cyan',
    liveStat: '8,500',
    statLabel: 'WIP Panels',
    trend: '1 Stage Bottleneck',
    isPositive: false,
  },
  {
    id: 'job-cards',
    title: 'Job Card Completion & Lead Time',
    categoryGroup: 'FLOOR',
    categoryLabel: 'MANUFACTURING JOBS',
    description: 'Job Card launch status, stage lead times, cycle time analysis, and completion milestones.',
    href: '/reports/job-cards',
    icon: Cpu,
    colorTheme: 'purple',
    liveStat: '4.2 Days',
    statLabel: 'Avg Cycle Time',
    trend: '-0.5 Days',
    isPositive: true,
  },
  {
    id: 'orders',
    title: 'Customer PO Production Status',
    categoryGroup: 'COMMERCIAL',
    categoryLabel: 'COMMERCIAL FULFILLMENT',
    description: 'PO-wise production progress, client fulfillment metrics, and unlaunched backlog tracking.',
    href: '/reports/orders',
    icon: ShoppingCart,
    colorTheme: 'blue',
    liveStat: '98.5%',
    statLabel: 'On-Time Fulfillment',
    trend: '+2.1%',
    isPositive: true,
  },
  {
    id: 'dispatch',
    title: 'Dispatch & Delivery Summary',
    categoryGroup: 'COMMERCIAL',
    categoryLabel: 'LOGISTICS & GATE PASS',
    description: 'Challan history, gate pass compliance, carrier tracking, and delivered volume reports.',
    href: '/reports/dispatch',
    icon: Truck,
    colorTheme: 'amber',
    liveStat: '12 Shipments',
    statLabel: 'This Week',
    trend: '100% Verified',
    isPositive: true,
  },
  {
    id: 'traceability',
    title: 'Full Traveler Lot Traceability',
    categoryGroup: 'QC',
    categoryLabel: 'COMPLIANCE AUDIT',
    description: 'End-to-end audit trail for any Job Card including operator signatures, chemical logs & AOI scans.',
    href: '/reports/traceability',
    icon: Search,
    colorTheme: 'orange',
    liveStat: '100%',
    statLabel: 'Audit Compliant',
    trend: 'Full History',
    isPositive: true,
  },
];

const STAGE_PERFORMANCE = [
  { code: 'ENG-01', name: 'CAM & Gerber Verification', input: 5000, output: 4980, scrap: 20, yield: 99.6, status: 'OPTIMAL' },
  { code: 'CNC-01', name: 'CNC Material Cutting', input: 4980, output: 4950, scrap: 30, yield: 99.4, status: 'OPTIMAL' },
  { code: 'CNC-02', name: 'CNC Drilling & Routing', input: 4950, output: 4880, scrap: 70, yield: 98.6, status: 'NORMAL' },
  { code: 'WET-01', name: 'PTH Copper Plating', input: 4880, output: 4760, scrap: 120, yield: 97.5, status: 'ATTENTION' },
  { code: 'QC-01', name: 'AOI Optical Inspection', input: 4760, output: 4740, scrap: 20, yield: 99.5, status: 'OPTIMAL' },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'QC' | 'FLOOR' | 'COMMERCIAL'>('ALL');
  const [timeRange, setTimeRange] = useState('THIS_MONTH');

  const filteredModules = selectedCategory === 'ALL' 
    ? REPORT_MODULES 
    : REPORT_MODULES.filter((m) => m.categoryGroup === selectedCategory);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'amber':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hoverBorder: 'hover:border-amber-400' };
      case 'blue':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hoverBorder: 'hover:border-blue-400' };
      case 'emerald':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-400' };
      case 'purple':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', hoverBorder: 'hover:border-purple-400' };
      case 'cyan':
        return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', hoverBorder: 'hover:border-cyan-400' };
      case 'rose':
        return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', hoverBorder: 'hover:border-rose-400' };
      case 'orange':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hoverBorder: 'hover:border-orange-400' };
      case 'indigo':
      default:
        return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-400' };
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Production Analytics & Intelligence Reports Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                OEE, Yield & Traceability Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Factory-wide OEE metrics, stage throughput, rejection scrap analysis & automated PDF/Excel exports.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel Sheet</span>
          </button>

          <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm">
            <Printer className="w-4 h-4" />
            <span>Export PDF Analytics</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">First Pass Yield (FPY)</p>
            <p className="text-xl font-bold text-slate-900">97.8%</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +1.2% vs last month
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Overall OEE Rating</p>
            <p className="text-xl font-bold text-slate-900">89.4%</p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Plant Efficiency
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Total Monthly Output</p>
            <p className="text-xl font-bold text-slate-900">48,500 PCBs</p>
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> On Target (+5%)
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Scrap Rejection Rate</p>
            <p className="text-xl font-bold text-rose-700">2.2%</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> -0.4% Reduction
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Chips Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Modules:
          </span>
          {[
            { id: 'ALL', label: 'All Reports (8)' },
            { id: 'QC', label: 'Quality & Yield (2)' },
            { id: 'FLOOR', label: 'Shop Floor & WIP (4)' },
            { id: 'COMMERCIAL', label: 'Commercial & Dispatch (2)' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="TODAY">Today's Shift</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month (Q3)</option>
            <option value="YEAR">Year 2026</option>
          </select>
        </div>

      </div>

      {/* Main Report Modules Grid (8 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredModules.map((mod) => {
          const IconComp = mod.icon;
          const style = getThemeClasses(mod.colorTheme);

          return (
            <a
              key={mod.id}
              href={mod.href}
              className={`block bg-white border border-slate-200 ${style.hoverBorder} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    {mod.categoryLabel}
                  </span>
                  <div className={`w-9 h-9 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center ${style.text} group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                    <span>{mod.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors group-hover:translate-x-0.5" />
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* Bottom Stat Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-medium block">{mod.statLabel}</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{mod.liveStat}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  mod.isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {mod.trend}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Stage Yield Performance Summary Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stage-Wise Throughput & Yield Efficiency</h2>
              <p className="text-xs text-slate-500">Live panel output, scrap counts, and yield percentages across manufacturing stages.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Summary Audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Stage Code</th>
                <th className="py-3 px-4">Manufacturing Stage</th>
                <th className="py-3 px-4 text-right">Input Panels</th>
                <th className="py-3 px-4 text-right">Output Panels</th>
                <th className="py-3 px-4 text-right">Scrap Loss</th>
                <th className="py-3 px-4">Yield % Efficiency</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {STAGE_PERFORMANCE.map((stg) => (
                <tr key={stg.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{stg.code}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{stg.name}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">{stg.input.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{stg.output.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 font-bold">{stg.scrap} pcs</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stg.yield >= 99 ? 'bg-emerald-500' : stg.yield >= 98 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${stg.yield}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900">{stg.yield}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      stg.status === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {stg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
