import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatus = 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';

interface StatusBadgeProps {
  label: string;
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ label, status, className }: StatusBadgeProps) {
  let colorClasses = '';

  switch (status) {
    case 'SUCCESS':
      // Confirm Green: #3F8354
      colorClasses = 'bg-emerald-50 text-emerald-600 border-emerald-200';
      break;
    case 'WARNING':
      // Warning Amber: #C68A1E
      colorClasses = 'bg-warning-amber/10 text-warning-amber border-warning-amber/20';
      break;
    case 'DANGER':
      // Alert Rust: #B23A2E
      colorClasses = 'bg-rose-50 text-rose-600 border-rose-200';
      break;
    case 'NEUTRAL':
    default:
      // Graphite Ink at low opacity
      colorClasses = 'bg-slate-200 text-slate-600 border-slate-300';
      break;
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colorClasses, className)}>
      {label}
    </span>
  );
}
