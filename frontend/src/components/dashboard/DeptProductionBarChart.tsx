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
import { BarChart3, ArrowDownWideNarrow } from 'lucide-react';
import { DeptBarChartItem } from '@/services/dashboardService';

interface DeptProductionBarChartProps {
  data: DeptBarChartItem[];
}

export const DeptProductionBarChart: React.FC<DeptProductionBarChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.sqm - a.sqm);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DeptBarChartItem;
      const percent = Math.round((item.sqm / item.target) * 100);
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.fullName}
          </div>
          <div className="mt-1.5 space-y-1 text-xs">
            <div className="text-slate-600 flex justify-between gap-3">
              <span>Today's Output:</span>
              <span className="font-bold text-slate-900">{item.sqm} Sqm</span>
            </div>
            <div className="text-slate-500 flex justify-between gap-3">
              <span>Target:</span>
              <span className="font-medium text-slate-700">{item.target} Sqm</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex justify-between gap-3 font-bold text-emerald-600">
              <span>Achieved:</span>
              <span>{percent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
              Dept-wise Production Output
            </h2>
            <p className="text-xs text-slate-500">Live floor sqm output by manufacturing stage</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-blue-600" />
          <span>High ➔ Low</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 12, right: 10, left: -15, bottom: 45 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="fullName" 
              stroke="#64748b" 
              fontSize={11} 
              fontWeight={600}
              tickLine={false}
              interval={0}
              angle={-38}
              textAnchor="end"
              height={60}
              dy={4}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              unit="m²"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sqm" radius={[4, 4, 0, 0]}>
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
