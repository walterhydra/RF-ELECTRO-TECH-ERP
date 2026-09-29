'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { BarChart3, ArrowDownWideNarrow, Sparkles } from 'lucide-react';
import { DeptBarChartItem } from '@/services/dashboardService';

interface DeptProductionBarChartProps {
  data: DeptBarChartItem[];
}

export const DeptProductionBarChart: React.FC<DeptProductionBarChartProps> = ({ data }) => {
  // Sort from highest to lowest
  const sortedData = [...data].sort((a, b) => b.sqm - a.sqm);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DeptBarChartItem;
      const percent = Math.round((item.sqm / item.target) * 100);
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.fullName}
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="text-slate-300 flex justify-between gap-4">
              <span>Today's Output:</span>
              <span className="font-bold text-white">{item.sqm} Sqm</span>
            </div>
            <div className="text-slate-400 flex justify-between gap-4">
              <span>Dept Target:</span>
              <span className="font-bold text-slate-200">{item.target} Sqm</span>
            </div>
            <div className="pt-1 border-t border-slate-800 flex justify-between gap-4 font-bold text-emerald-400">
              <span>Achievement:</span>
              <span>{percent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Dept-wise Production Output
            </h2>
            <p className="text-xs text-slate-400">Live floor sqm output by manufacturing stage</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-blue-400" />
          <span>Sorted High ➔ Low</span>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="w-full h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#94A3B8" 
              fontSize={11} 
              fontWeight={600}
              tickLine={false}
              dy={8}
            />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false}
              unit="m²"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
            <Bar dataKey="sqm" radius={[6, 6, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
