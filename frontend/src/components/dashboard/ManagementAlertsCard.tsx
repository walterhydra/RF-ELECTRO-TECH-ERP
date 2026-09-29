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
          bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100/70',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-800',
          iconColor: 'text-rose-600',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100/70',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-800',
          iconColor: 'text-amber-600',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100/70',
          badge: 'bg-blue-600 text-white',
          text: 'text-blue-800',
          iconColor: 'text-blue-600',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100/70',
          badge: 'bg-purple-600 text-white',
          text: 'text-purple-800',
          iconColor: 'text-purple-600',
        };
      case 'pink':
        return {
          bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100/70',
          badge: 'bg-pink-600 text-white',
          text: 'text-pink-800',
          iconColor: 'text-pink-600',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          badge: 'bg-slate-600 text-white',
          text: 'text-slate-800',
          iconColor: 'text-slate-600',
        };
    }
  };

  const totalAlerts = alerts.reduce((acc, a) => acc + a.count, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs lg:text-sm font-bold text-slate-900 flex items-center gap-2">
                Management Alerts
              </h2>
              <p className="text-[11px] text-slate-500">Critical plant notifications</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {totalAlerts} Active
          </span>
        </div>

        {/* Alert Items List */}
        <div className="space-y-2">
          {alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            const style = getStyle(alert.severity);

            return (
              <div
                key={alert.label}
                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${style.bg}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${style.iconColor}`} />
                  <span className={`text-xs font-semibold ${style.text}`}>
                    {alert.label}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${style.badge}`}>
                    {alert.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Safety Note */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Plant Protocols Active
        </span>
        <span className="text-[10px] text-slate-400 font-mono">Auto-notifying</span>
      </div>
    </div>
  );
};
