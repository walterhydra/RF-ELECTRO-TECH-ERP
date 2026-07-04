import React from 'react';

interface TraceLineProps {
  currentStageOrder: number;
  totalStages: number;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'REJECTED';
}

export const TraceLine: React.FC<TraceLineProps> = ({
  currentStageOrder,
  totalStages,
  status = 'IN_PROGRESS',
}) => {
  const percentage = Math.min(Math.round((currentStageOrder / totalStages) * 100), 100);

  const getTraceColor = () => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]';
      case 'ON_HOLD': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]';
      case 'REJECTED': return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]';
      default: return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]';
    }
  };

  return (
    <div className="w-full py-2">
      <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
        <span>STAGE {currentStageOrder} OF {totalStages}</span>
        <span className="font-bold text-slate-200">{percentage}% COMPLETED</span>
      </div>
      <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-pulse" />
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getTraceColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
