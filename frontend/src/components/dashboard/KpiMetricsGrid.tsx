'use client';

import React from 'react';
import { 
  Percent, 
  Layers, 
  Truck, 
  Flame, 
  Clock, 
  AlertOctagon, 
  Wrench,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { KpiMetrics } from '@/services/dashboardService';

interface KpiMetricsGridProps {
  kpis: KpiMetrics;
  onSelectHoldDetails?: () => void;
  onSelectBreakdownDetails?: () => void;
}

export const KpiMetricsGrid: React.FC<KpiMetricsGridProps> = ({
  kpis,
  onSelectHoldDetails,
  onSelectBreakdownDetails,
}) => {
  const cards = [
    {
      id: 'rejection',
      title: 'Current Month Rejection %',
      value: `${kpis.monthRejectionPercent.toFixed(2)}%`,
      subtitle: `Target < ${kpis.monthRejectionTarget.toFixed(2)}%`,
      badge: 'Well Controlled',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Percent,
      trendIcon: TrendingDown,
      // Dark Navy theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-slate-800 text-white',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      textColor: 'text-indigo-300',
    },
    {
      id: 'month_prod',
      title: 'Current Month Production',
      value: `${kpis.monthProductionSqm.toLocaleString()} Sqm`,
      subtitle: `Target ${kpis.monthProductionTarget.toLocaleString()} Sqm`,
      badge: `${Math.round((kpis.monthProductionSqm / kpis.monthProductionTarget) * 100)}% of Target`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Layers,
      trendIcon: TrendingUp,
      // Forest Green theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-emerald-950/40 to-emerald-900/60 border-emerald-800/50 text-white',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      textColor: 'text-emerald-300',
    },
    {
      id: 'month_dispatch',
      title: 'Dispatched Sqm (Month)',
      value: `${kpis.monthDispatchedSqm.toLocaleString()} Sqm`,
      subtitle: `Pending ${kpis.monthPendingDispatchSqm.toLocaleString()} Sqm`,
      badge: '91% Invoiced',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: Truck,
      trendIcon: TrendingUp,
      // Royal Blue theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-blue-950/50 to-blue-900/60 border-blue-800/50 text-white',
      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      textColor: 'text-blue-300',
    },
    {
      id: 'today_prod',
      title: "Today's Production",
      value: `${kpis.todayProductionSqm} Sqm`,
      subtitle: `Target ${kpis.todayTargetMin} - ${kpis.todayTargetMax} Sqm`,
      badge: `${Math.round((kpis.todayProductionSqm / kpis.todayTargetMin) * 100)}% Speed`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Flame,
      trendIcon: Flame,
      // Vibrant Orange theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-amber-950/40 to-amber-900/50 border-amber-800/50 text-white',
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      textColor: 'text-amber-300',
    },
    {
      id: 'pending_wip',
      title: 'Total Pending WIP',
      value: `${kpis.totalPendingWipSqm} Sqm`,
      subtitle: `Active Jobs: ${kpis.totalPendingWipJobs}`,
      badge: 'In Progress',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: Clock,
      trendIcon: Layers,
      // Purple / Violet theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-purple-950/40 to-purple-900/50 border-purple-800/50 text-white',
      iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      textColor: 'text-purple-300',
    },
    {
      id: 'jobs_hold',
      title: 'Jobs on Hold',
      value: `${kpis.jobsOnHoldCount}`,
      subtitle: 'Click to Inspect',
      actionText: 'View Details >',
      onClick: onSelectHoldDetails,
      badge: 'Needs Action',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse',
      icon: AlertOctagon,
      trendIcon: AlertOctagon,
      // Crimson Red theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-rose-950/50 to-rose-900/60 border-rose-800/60 text-white cursor-pointer hover:border-rose-500 transition-all',
      iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      textColor: 'text-rose-300',
    },
    {
      id: 'breakdowns',
      title: 'Machines Breakdown',
      value: `${kpis.machinesBreakdownCount}`,
      subtitle: 'Click to Inspect',
      actionText: 'View Details >',
      onClick: onSelectBreakdownDetails,
      badge: 'Under Repair',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse',
      icon: Wrench,
      trendIcon: Wrench,
      // Teal / Cyan theme
      bgClass: 'bg-gradient-to-br from-slate-900 via-cyan-950/40 to-teal-900/50 border-cyan-800/60 text-white cursor-pointer hover:border-cyan-500 transition-all',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      textColor: 'text-cyan-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`p-4 rounded-2xl border shadow-lg relative overflow-hidden flex flex-col justify-between group ${card.bgClass}`}
          >
            {/* Ambient header line */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            {/* Main Value & Title */}
            <div>
              <div className="text-2xl font-black tracking-tight text-white group-hover:scale-105 transition-transform duration-200 origin-left">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-slate-300 line-clamp-1 mt-0.5">
                {card.title}
              </div>
            </div>

            {/* Bottom Subtitle / Action */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-medium text-slate-400">
              <span className="truncate">{card.subtitle}</span>
              {card.actionText && (
                <span className={`font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${card.textColor}`}>
                  {card.actionText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
