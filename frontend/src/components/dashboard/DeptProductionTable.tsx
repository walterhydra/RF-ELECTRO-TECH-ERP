'use client';

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  PlayCircle, 
  PauseCircle, 
  Hourglass,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Search,
  CheckCircle2,
  Clock,
  User,
  Filter
} from 'lucide-react';
import { DeptProductionRow, DeptOutJobItem } from '@/services/dashboardService';

interface DeptProductionTableProps {
  data: DeptProductionRow[];
}

export const DeptProductionTable: React.FC<DeptProductionTableProps> = ({ data }) => {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);
  const [showAllOutModal, setShowAllOutModal] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');

  const toggleExpand = (deptName: string) => {
    setExpandedDept(prev => prev === deptName ? null : deptName);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black flex items-center justify-center text-[10.5px] border border-amber-300 shadow-2xs shrink-0 font-mono">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 font-black flex items-center justify-center text-[10.5px] border border-slate-300 shadow-2xs shrink-0 font-mono">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-800 font-black flex items-center justify-center text-[10.5px] border border-amber-200 shadow-2xs shrink-0 font-mono">
          3
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10.5px] border border-slate-200 shrink-0 font-mono">
        {index + 1}
      </span>
    );
  };

  const getAchPillClass = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (percent >= 80) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (percent > 0) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // Filtered rows for table
  const displayedRows = useMemo(() => {
    if (!filterActiveOnly) return data;
    return data.filter(d => (d.todayProductionSqm > 0 || (d.outJobsCount && d.outJobsCount > 0) || d.runningJobs > 0));
  }, [data, filterActiveOnly]);

  // Aggregate all out jobs across all departments for the full log modal
  const allTodayOutJobs = useMemo(() => {
    const list: Array<DeptOutJobItem & { department: string; color: string }> = [];
    data.forEach(dept => {
      if (dept.outJobs && dept.outJobs.length > 0) {
        dept.outJobs.forEach(job => {
          list.push({
            ...job,
            department: dept.department,
            color: dept.color
          });
        });
      }
    });
    return list;
  }, [data]);

  const filteredModalJobs = useMemo(() => {
    if (!modalSearch.trim()) return allTodayOutJobs;
    const q = modalSearch.toLowerCase().trim();
    return allTodayOutJobs.filter(j => 
      j.jobCardNo.toLowerCase().includes(q) ||
      (j.subJobCardNo && j.subJobCardNo.toLowerCase().includes(q)) ||
      j.department.toLowerCase().includes(q) ||
      j.productName.toLowerCase().includes(q) ||
      j.customerName.toLowerCase().includes(q) ||
      j.operatorName.toLowerCase().includes(q)
    );
  }, [allTodayOutJobs, modalSearch]);

  const totalOutJobsCount = allTodayOutJobs.length;
  const activeStagesCount = data.filter(d => d.todayProductionSqm > 0 || (d.outJobsCount && d.outJobsCount > 0)).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 lg:p-5 shadow-sm flex flex-col h-full relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Dept Live Production
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {data.length} Stages • {activeStagesCount} active today • Click row to view out jobs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Filter Toggle */}
          <button
            onClick={() => setFilterActiveOnly(prev => !prev)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
              filterActiveOnly 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle between All Stages and Active Stages today"
          >
            <Filter className="w-3 h-3" />
            <span>{filterActiveOnly ? `Active (${displayedRows.length})` : 'Active Only'}</span>
          </button>

          {/* View All Out Jobs Modal Button */}
          {totalOutJobsCount > 0 && (
            <button
              onClick={() => setShowAllOutModal(true)}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1 shadow-2xs transition-colors"
              title="View complete list of jobs out today across all departments"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{totalOutJobsCount} Jobs Out Today</span>
            </button>
          )}

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {data.length} Stages
          </span>
        </div>
      </div>

      {/* MOBILE VIEW (< md): Clean Modern Department Cards */}
      <div className="block md:hidden flex-1 max-h-[460px] overflow-y-auto space-y-2 pr-0.5">
        {displayedRows.map((dept, index) => {
          const rankBadge = getRankBadge(index);
          const achPillClass = getAchPillClass(dept.achievementPercent);
          const progressPercent = Math.min(100, Math.max(0, dept.achievementPercent));
          const isExpanded = expandedDept === dept.department;
          const hasOutJobs = (dept.outJobs && dept.outJobs.length > 0) || (dept.outJobsCount && dept.outJobsCount > 0);

          return (
            <div 
              key={dept.department} 
              className={`bg-slate-50/70 border p-3 rounded-xl space-y-2 shadow-2xs transition-all ${
                isExpanded ? 'border-indigo-300 ring-1 ring-indigo-200 bg-white' : 'border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {/* Row 1: Rank Badge + Department Name + Achievement Pill */}
              <div 
                className="flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => toggleExpand(dept.department)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {rankBadge}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: dept.color }} 
                    />
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {dept.department}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${achPillClass}`}>
                    {dept.achievementPercent}%
                  </span>
                  {hasOutJobs && (
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Progress Line */}
              <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: dept.achievementPercent >= 90 ? '#10b981' : dept.achievementPercent >= 80 ? '#f59e0b' : dept.achievementPercent > 0 ? '#3b82f6' : 'transparent'
                  }}
                />
              </div>

              {/* Row 3: Output Metrics & Live Queue Status */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-baseline gap-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-400">Output:</span>
                  <strong className="text-slate-900 font-mono font-bold">{dept.todayProductionSqm}</strong>
                  <span className="text-slate-400 font-mono text-[10.5px]">/ {dept.targetSqm} m²</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    <PlayCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{dept.runningJobs} run</span>
                  </span>
                  <span className="text-amber-700 font-medium flex items-center gap-0.5">
                    <Hourglass className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{dept.waitingJobs} wait</span>
                  </span>
                  {dept.holdJobs > 0 && (
                    <span className="text-rose-600 font-bold flex items-center gap-0.5">
                      <PauseCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{dept.holdJobs} hold</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable Button on Mobile */}
              {hasOutJobs && (
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(dept.department)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide' : 'View'} {dept.outJobs?.length || dept.outJobsCount} jobs out today</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dept.todayProductionSqm} m² total
                  </span>
                </div>
              )}

              {/* Expanded Out Jobs List on Mobile */}
              {isExpanded && dept.outJobs && dept.outJobs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-100 space-y-1.5 bg-indigo-50/40 p-2 rounded-lg">
                  <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Today's Out Jobs ({dept.outJobs.length})</span>
                    <span>{dept.todayProductionSqm} m²</span>
                  </div>
                  {dept.outJobs.map((job, jIdx) => (
                    <div key={job.id || jIdx} className="bg-white p-2 rounded-md border border-slate-200 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                        <span className="text-indigo-700">{job.jobCardNo}</span>
                        <span className="text-emerald-700">{job.areaSqm} m²</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="truncate max-w-[170px]">{job.customerName || job.productName}</span>
                        <span className="font-semibold text-slate-700">{job.qtyPcb} pcs ({job.qtyPnl} pnl)</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {job.time}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" /> {job.operatorName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (>= md): Full Data Table with Accordion Breakdown */}
      <div className="hidden md:block overflow-x-auto flex-1 max-h-[440px] scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3 text-right">Today Output</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-center">Ach %</th>
              <th className="py-2.5 px-3 text-center">Active Jobs (R / W / H)</th>
              <th className="py-2.5 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedRows.map((dept, index) => {
              const rankBadge = getRankBadge(index);
              const achPillClass = getAchPillClass(dept.achievementPercent);
              const isExpanded = expandedDept === dept.department;
              const hasOutJobs = (dept.outJobs && dept.outJobs.length > 0) || (dept.outJobsCount && dept.outJobsCount > 0);

              return (
                <React.Fragment key={dept.department}>
                  <tr 
                    onClick={() => hasOutJobs && toggleExpand(dept.department)}
                    className={`transition-colors ${
                      hasOutJobs ? 'cursor-pointer hover:bg-indigo-50/40' : 'hover:bg-slate-50/80'
                    } ${isExpanded ? 'bg-indigo-50/60 font-semibold' : ''}`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3 whitespace-nowrap">{rankBadge}</td>

                    {/* Dept Name */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                        <span>{dept.department}</span>
                        {hasOutJobs && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {dept.outJobs?.length || dept.outJobsCount} Out
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Today Sqm */}
                    <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {dept.todayProductionSqm} <span className="text-[10px] text-slate-500 font-normal">m²</span>
                      </div>
                      {hasOutJobs && (
                        <div className="text-[10px] text-indigo-600 font-sans font-medium">
                          {dept.outJobs?.length || dept.outJobsCount} jobs completed
                        </div>
                      )}
                    </td>

                    {/* Target Sqm */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                      {dept.targetSqm} <span className="text-[10px] font-normal">m²</span>
                    </td>

                    {/* Achievement % */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${achPillClass}`}>
                        {dept.achievementPercent}%
                      </span>
                    </td>

                    {/* Active Jobs (Running / Waiting / Hold) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5" title="Running">
                          <PlayCircle className="w-3 h-3 text-emerald-600" /> {dept.runningJobs}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-700 font-medium flex items-center gap-0.5" title="Waiting">
                          <Hourglass className="w-3 h-3 text-amber-600" /> {dept.waitingJobs}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={`font-bold flex items-center gap-0.5 ${dept.holdJobs > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}`} title="Hold">
                          <PauseCircle className="w-3 h-3" /> {dept.holdJobs}
                        </span>
                      </div>
                    </td>

                    {/* Expand Toggle Chevron */}
                    <td className="py-2.5 px-2 text-center text-slate-400">
                      {hasOutJobs ? (
                        isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />
                      ) : null}
                    </td>
                  </tr>

                  {/* Expanded Sub-Table showing all Out Jobs for this Department */}
                  {isExpanded && (
                    <tr className="bg-indigo-50/30">
                      <td colSpan={7} className="p-3 border-y border-indigo-100">
                        <div className="bg-white rounded-lg border border-indigo-200/80 p-3 shadow-xs space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                              <span className="font-bold text-slate-900 text-xs">
                                Today's Out / Forwarded Jobs: {dept.department}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {dept.outJobs?.length || 0} Jobs • {dept.todayProductionSqm} m²
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Real-time shop floor movements
                            </span>
                          </div>

                          {dept.outJobs && dept.outJobs.length > 0 ? (
                            <div className="overflow-x-auto max-h-56 scrollbar-thin scrollbar-thumb-slate-300">
                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80">
                                    <th className="py-1.5 px-2.5">Time</th>
                                    <th className="py-1.5 px-2.5">Job Card No</th>
                                    <th className="py-1.5 px-2.5">Customer / Product</th>
                                    <th className="py-1.5 px-2.5 text-right">Qty (Pcs / Pnl)</th>
                                    <th className="py-1.5 px-2.5 text-right">Output Area</th>
                                    <th className="py-1.5 px-2.5">Operator</th>
                                    <th className="py-1.5 px-2.5">Remarks</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                  {dept.outJobs.map((job, jIdx) => (
                                    <tr key={job.id || jIdx} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="py-1.5 px-2.5 text-slate-600 whitespace-nowrap">{job.time}</td>
                                      <td className="py-1.5 px-2.5 font-bold text-indigo-700 whitespace-nowrap">{job.jobCardNo}</td>
                                      <td className="py-1.5 px-2.5 font-sans text-slate-700 truncate max-w-[180px]">
                                        <div className="font-medium truncate">{job.customerName}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{job.productName}</div>
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                        {job.qtyPcb} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                                        <span className="text-[10px] text-slate-500 font-normal ml-1">({job.qtyPnl} pnl)</span>
                                      </td>
                                      <td className="py-1.5 px-2.5 text-right font-black text-emerald-700 whitespace-nowrap">
                                        {job.areaSqm} <span className="text-[10px] text-slate-400 font-normal">m²</span>
                                      </td>
                                      <td className="py-1.5 px-2.5 font-sans text-slate-600 whitespace-nowrap">{job.operatorName}</td>
                                      <td className="py-1.5 px-2.5 font-sans text-[10px] text-slate-500 truncate max-w-[140px]">
                                        {job.remarks || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-3 text-center text-xs text-slate-400 font-sans">
                              No jobs were forwarded out from this stage today yet.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FULL MODAL: Today's All Factory Out Movements */}
      {showAllOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Today's Shop Floor Out Movements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total {totalOutJobsCount} movements recorded across all manufacturing departments today
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllOutModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter Bar */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search by Job Card #, Department, Product, Customer or Operator..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredModalJobs.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Job Card No</th>
                        <th className="py-2 px-3">Customer / Product</th>
                        <th className="py-2 px-3 text-right">Qty Out</th>
                        <th className="py-2 px-3 text-right">Output Area</th>
                        <th className="py-2 px-3">Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {filteredModalJobs.map((job, idx) => (
                        <tr key={job.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{job.time}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 font-sans">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
                              {job.department}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-indigo-700 whitespace-nowrap">{job.jobCardNo}</td>
                          <td className="py-2 px-3 font-sans text-slate-700">
                            <div className="font-semibold text-xs">{job.customerName}</div>
                            <div className="text-[11px] text-slate-400">{job.productName}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {job.qtyPcb} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                            <div className="text-[10px] text-slate-500 font-normal">({job.qtyPnl} pnl)</div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                            {job.areaSqm} <span className="text-[10px] text-slate-400 font-normal">m²</span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-600 whitespace-nowrap">{job.operatorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No matching out movements found today.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredModalJobs.length} of {totalOutJobsCount} recorded movements</span>
              <button
                onClick={() => setShowAllOutModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
