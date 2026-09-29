'use client';

import React from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  PauseCircle, 
  TrendingDown, 
  ShieldAlert, 
  PackageX, 
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ManagementAlertItem } from '@/services/dashboardService';

interface ManagementAlertsCardProps {
  alerts: ManagementAlertItem[];
}

export const ManagementAlertsCard: React.FC<ManagementAlertsCardProps> = ({ alerts }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'BREAKDOWN':
        return AlertTriangle;
      case 'JOB_HOLD':
        return PauseCircle;
      case 'BELOW_TARGET':
        return TrendingDown;
      case 'QA_HOLD':
        return ShieldAlert;
      case 'MAT_SHORTAGE':
        return PackageX;
      case 'CUST_APPROVAL':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getStyle = (severity: string) => {
    switch (severity) {
      case 'red':
        return {
          bg: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-600',
          badge: 'bg-rose-500 text-white shadow-rose-500/30 shadow-md',
          text: 'text-rose-200',
          iconColor: 'text-rose-400',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-600',
          badge: 'bg-amber-500 text-slate-950 shadow-amber-500/30 shadow-md',
          text: 'text-amber-200',
          iconColor: 'text-amber-400',
        };
      case 'blue':
        return {
          bg: 'bg-blue-950/40 border-blue-800/60 hover:border-blue-600',
          badge: 'bg-blue-500 text-white shadow-blue-500/30 shadow-md',
          text: 'text-blue-200',
          iconColor: 'text-blue-400',
        };
      case 'purple':
        return {
          bg: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-600',
          badge: 'bg-purple-500 text-white shadow-purple-500/30 shadow-md',
          text: 'text-purple-200',
          iconColor: 'text-purple-400',
        };
      case 'pink':
        return {
          bg: 'bg-pink-950/40 border-pink-800/60 hover:border-pink-600',
          badge: 'bg-pink-500 text-white shadow-pink-500/30 shadow-md',
          text: 'text-pink-200',
          iconColor: 'text-pink-400',
        };
      default:
        return {
          bg: 'bg-slate-800/60 border-slate-700',
          badge: 'bg-slate-600 text-white',
          text: 'text-slate-200',
          iconColor: 'text-slate-400',
        };
    }
  };

  const totalAlerts = alerts.reduce((acc, a) => acc + a.count, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Management Alerts
              </h2>
              <p className="text-xs text-slate-400">Critical plant notifications</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            {totalAlerts} Active
          </span>
        </div>

        {/* Alert Items List */}
        <div className="space-y-2.5">
          {alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            const style = getStyle(alert.severity);

            return (
              <div
                key={alert.label}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-sm ${style.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
                  <span className={`text-xs font-semibold ${style.text}`}>
                    {alert.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${style.badge}`}>
                    {alert.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plant Safety Note */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Safety & Quality Protocol Active
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Auto-notifying Lead</span>
      </div>
    </div>
  );
};
