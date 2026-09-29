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
      title: 'Month Rejection %',
      value: `${kpis.monthRejectionPercent.toFixed(2)}%`,
      subtitle: `Target < ${kpis.monthRejectionTarget.toFixed(2)}%`,
      badge: 'Good',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Percent,
      iconBg: 'bg-slate-100 text-slate-700',
      borderAccent: 'hover:border-slate-400',
    },
    {
      id: 'month_prod',
      title: 'Month Production',
      value: `${kpis.monthProductionSqm.toLocaleString()} Sqm`,
      subtitle: `Target ${kpis.monthProductionTarget.toLocaleString()} Sqm`,
      badge: `${Math.round((kpis.monthProductionSqm / kpis.monthProductionTarget) * 100)}%`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Layers,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'hover:border-emerald-300',
    },
    {
      id: 'month_dispatch',
      title: 'Dispatched (Month)',
      value: `${kpis.monthDispatchedSqm.toLocaleString()} Sqm`,
      subtitle: `Pending ${kpis.monthPendingDispatchSqm.toLocaleString()} Sqm`,
      badge: '91% Done',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Truck,
      iconBg: 'bg-blue-50 text-blue-600',
      borderAccent: 'hover:border-blue-300',
    },
    {
      id: 'today_prod',
      title: "Today's Production",
      value: `${kpis.todayProductionSqm} Sqm`,
      subtitle: `Target ${kpis.todayTargetMin} - ${kpis.todayTargetMax} Sqm`,
      badge: `${Math.round((kpis.todayProductionSqm / kpis.todayTargetMin) * 100)}% Speed`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Flame,
      iconBg: 'bg-amber-50 text-amber-600',
      borderAccent: 'hover:border-amber-300',
    },
    {
      id: 'pending_wip',
      title: 'Total Pending WIP',
      value: `${kpis.totalPendingWipSqm} Sqm`,
      subtitle: `Active Jobs: ${kpis.totalPendingWipJobs}`,
      badge: '18 Batches',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Clock,
      iconBg: 'bg-purple-50 text-purple-600',
      borderAccent: 'hover:border-purple-300',
    },
    {
      id: 'jobs_hold',
      title: 'Jobs on Hold',
      value: `${kpis.jobsOnHoldCount}`,
      subtitle: 'Click to Inspect',
      actionText: 'View Details',
      onClick: onSelectHoldDetails,
      badge: 'Action Req.',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      icon: AlertOctagon,
      iconBg: 'bg-rose-50 text-rose-600',
      borderAccent: 'border-rose-200 hover:border-rose-400 bg-rose-50/30',
      isAlert: true,
    },
    {
      id: 'breakdowns',
      title: 'Machine Breakdowns',
      value: `${kpis.machinesBreakdownCount}`,
      subtitle: 'Click to Inspect',
      actionText: 'View Details',
      onClick: onSelectBreakdownDetails,
      badge: 'Under Repair',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold',
      icon: Wrench,
      iconBg: 'bg-cyan-50 text-cyan-600',
      borderAccent: 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/30',
      isAlert: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between transition-all duration-150 ${
              card.onClick ? 'cursor-pointer hover:shadow-md' : ''
            } ${card.borderAccent}`}
          >
            {/* Top row: Icon & Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            {/* Main Value & Label */}
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-slate-600 line-clamp-1 mt-0.5">
                {card.title}
              </div>
            </div>

            {/* Footer / Subtitle */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="truncate">{card.subtitle}</span>
              {card.actionText && (
                <span className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                  {card.actionText} <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
