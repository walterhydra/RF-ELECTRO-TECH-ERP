'use client';

import React, { useState, useEffect } from 'react';
import { TraceLineTracker } from '@/components/ui/TraceLineTracker';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  BarChart2, 
  Layers, 
  TrendingUp, 
  Eye,
  Activity,
  Cpu,
  Clock,
  Settings,
  Loader2,
  PackageMinus,
  CalendarClock,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const movementData = [
  { name: 'Dec', Launched: 400, Completed: 240, Rejected: 20 },
  { name: 'Jan', Launched: 300, Completed: 139, Rejected: 10 },
  { name: 'Feb', Launched: 200, Completed: 980, Rejected: 30 },
  { name: 'Mar', Launched: 278, Completed: 390, Rejected: 40 },
  { name: 'Apr', Launched: 189, Completed: 480, Rejected: 10 },
  { name: 'May', Launched: 239, Completed: 380, Rejected: 5 },
];

const qualityData = [
  { name: 'Plating', Rejections: 12 },
  { name: 'Solder Mask', Rejections: 8 },
  { name: 'Routing', Rejections: 5 },
  { name: 'FQC', Rejections: 2 },
];

const mockJobs = [
  { 
    id: 'JC-2026-0089', 
    priority: 'Urgent', 
    priorityDisplay: 'High',
    title: 'RF-CTRL-V4 (4-Layer FR4 ENIG) - 500 PCS', 
    stage: 'Plating', 
    activeIndex: 3, 
    customer: 'RF Tech',
    productClass: 'Multilayer (4+)'
  },
  { 
    id: 'JC-2026-0091', 
    priority: 'Normal', 
    priorityDisplay: 'Normal',
    title: 'PWR-INV-2KW (2-Layer 2oz) - 1,200 PCS', 
    stage: 'Solder Mask', 
    activeIndex: 4, 
    customer: 'Solar Solutions',
    productClass: 'Double Sided PTH'
  },
  { 
    id: 'JC-2026-0082', 
    priority: 'Normal', 
    priorityDisplay: 'Normal',
    title: 'LED-DRV-MINI (1-Layer CEM-1) - 3,000 PCS', 
    stage: 'FQC', 
    activeIndex: 5, 
    customer: 'RF Tech',
    productClass: 'Single Sided'
  },
  {
    id: 'JC-2026-0095',
    priority: 'Urgent',
    priorityDisplay: 'High',
    title: 'CTRL-BRD (2-Layer) - 200 PCS',
    stage: 'CNC Drilling',
    activeIndex: 1,
    customer: 'Solar Solutions',
    productClass: 'Double Sided PTH'
  }
];

export default function DashboardPage() {
  const [customer, setCustomer] = useState('');
  const [productClass, setProductClass] = useState('');
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('');
  const [timeline, setTimeline] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('Super Admin');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) setUserRole(role);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [customer, productClass, stage, priority, timeline]);

  const clearFilters = () => {
    setCustomer('');
    setProductClass('');
    setStage('');
    setPriority('');
    setTimeline('');
  };

  const activeFilters = [customer, productClass, stage, priority, timeline].filter(Boolean);
  const filterLabel = activeFilters.length > 0 
    ? `${activeFilters.length} Active Filter${activeFilters.length > 1 ? 's' : ''}` 
    : 'Active Global View';

  const filteredJobs = mockJobs.filter(job => {
    if (customer && job.customer !== customer) return false;
    if (productClass && job.productClass !== productClass) return false;
    if (stage && job.stage !== stage) return false;
    if (priority && job.priority !== priority) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-blue-600">
          {userRole === 'Production Manager' ? 'Production Overview & WIP Monitor' : 
           userRole === 'Quality Inspector' ? 'Quality Control Dashboard' : 
           userRole === 'Dispatch Manager' ? 'Dispatch & Delivery Dashboard' : 
           'Factory Overview Dashboard'}
        </h3>
        <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">
          {userRole} • FACTORY REAL-TIME METRICS • SHIFT: MORNING (A)
        </p>
      </div>

      {/* BEGIN: Filters Section */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6" data-purpose="filter-bar">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            className="form-select border-slate-200 rounded text-sm focus:ring-blue-500 w-full p-2 border bg-white"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">Select Customer</option>
            <option value="RF Tech">RF Tech</option>
            <option value="Solar Solutions">Solar Solutions</option>
          </select>
          <select 
            className="form-select border-slate-200 rounded text-sm focus:ring-blue-500 w-full p-2 border bg-white"
            value={productClass}
            onChange={(e) => setProductClass(e.target.value)}
          >
            <option value="">Select Product Class</option>
            <option value="Single Sided">Single Sided</option>
            <option value="Double Sided PTH">Double Sided PTH</option>
            <option value="Multilayer (4+)">Multilayer (4+)</option>
          </select>
          <select 
            className="form-select border-slate-200 rounded text-sm focus:ring-blue-500 w-full p-2 border bg-white"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">Select Stage</option>
            <option value="CNC Drilling">CNC Drilling</option>
            <option value="Plating">Plating</option>
            <option value="Solder Mask">Solder Mask</option>
          </select>
          <select 
            className="form-select border-slate-200 rounded text-sm focus:ring-blue-500 w-full p-2 border bg-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select Priority</option>
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select 
            className="form-select border-slate-200 rounded text-sm focus:ring-blue-500 w-full p-2 border bg-white"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
          >
            <option value="">Select Timeline</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={clearFilters}
            className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${activeFilters.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            {filterLabel}
          </span>
        </div>
      </section>
      {/* END: Filters Section */}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-50/50 backdrop-blur-[2px] transition-all duration-300">
            <div className="sticky top-[50vh] -translate-y-1/2 w-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600 tracking-wide">
                Loading Dashboard...
              </p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>

      {/* BEGIN: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Total WIP Card */}
        {['Super Admin', 'Production Manager', 'Dispatch Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total WIP Volume</p>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2">
            <h4 className="text-3xl font-bold text-slate-800">14,850</h4>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Square Meters</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-emerald-50 p-2 rounded">
              <p className="text-[10px] text-slate-500 uppercase">On Track</p>
              <p className="text-lg font-bold text-emerald-600">13,200</p>
            </div>
            <div className="bg-amber-50 p-2 rounded">
              <p className="text-[10px] text-slate-500 uppercase">Delayed</p>
              <p className="text-lg font-bold text-amber-500">1,650</p>
            </div>
          </div>
        </div>
        )}

        {/* Active Job Cards Card */}
        {['Super Admin', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Active Job Cards</p>
            <Layers className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-bold text-slate-800">24</h4>
          </div>
          <div className="mt-auto pt-4">
            <span className="text-[10px] text-emerald-600 font-semibold">↑ 4 launched today</span>
          </div>
        </div>
        )}

        {/* Quality Alerts Card */}
        {['Super Admin', 'Quality Inspector', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Quality Alerts</p>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-4 mb-4">
            <h4 className="text-3xl font-bold text-slate-800">0.82%</h4>
            <span className="text-xs text-slate-400 mt-1 uppercase">Rejection Rate</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 text-xs font-semibold">Warning (OOT)</span>
              <span className="font-bold text-amber-600 text-xs">2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 text-xs font-semibold">Critical Scrap</span>
              <span className="font-bold text-red-500 text-xs">0</span>
            </div>
          </div>
        </div>
        )}

        {/* On-Time Delivery Card */}
        {['Super Admin', 'Dispatch Manager', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-blue-400 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">On-Time Delivery</p>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-bold text-slate-800">98.4%</h4>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Rolling 30 Days</p>
          </div>
          <div className="mt-auto pt-4">
            <span className="text-[10px] text-slate-500 font-semibold">3 orders pending dispatch</span>
          </div>
        </div>
        )}
      </div>
      {/* END: Metric Cards */}

      {/* BEGIN: Tables and Secondary Info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        
        {/* Stage Load Summary */}
        {['Super Admin', 'Production Manager'].includes(userRole) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-800">Stage Load Summary</h4>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Production Stage</th>
                  <th className="px-4 py-3">Active Jobs</th>
                  <th className="px-4 py-3">Volume (SQM)</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-4 py-4 font-medium">CNC Drilling</td>
                  <td className="px-4 py-4">4</td>
                  <td className="px-4 py-4">2,500</td>
                  <td className="px-4 py-4">60%</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">Optimal</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">PTH / Plating</td>
                  <td className="px-4 py-4">8</td>
                  <td className="px-4 py-4">6,100</td>
                  <td className="px-4 py-4">95%</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold">High Load</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">Solder Mask</td>
                  <td className="px-4 py-4">3</td>
                  <td className="px-4 py-4">1,800</td>
                  <td className="px-4 py-4">45%</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">Optimal</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">Routing</td>
                  <td className="px-4 py-4">6</td>
                  <td className="px-4 py-4">3,200</td>
                  <td className="px-4 py-4">80%</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">Optimal</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium">FQC & Packing</td>
                  <td className="px-4 py-4">3</td>
                  <td className="px-4 py-4">1,250</td>
                  <td className="px-4 py-4">30%</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold">Low Load</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Active Job Cards Feed */}
        {['Super Admin', 'Production Manager', 'Quality Inspector', 'Dispatch Manager'].includes(userRole) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              <h4 className="font-bold text-slate-800">Live Active Job Cards</h4>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">{filteredJobs.length} ACTIVE</span>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No active jobs match your filters.
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-slate-800 font-mono text-sm">{job.id}</h5>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${job.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      Priority: {job.priorityDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-4">{job.title}</p>
                  <div className="pb-8 pt-2">
                    <TraceLineTracker 
                      stages={Array.from({ length: 6 }).map((_, i) => ({
                        name: i === job.activeIndex ? job.stage : `S${i + 1}`,
                        status: i < job.activeIndex ? 'COMPLETED' : i === job.activeIndex ? 'ACTIVE' : 'PENDING'
                      }))} 
                    />
                  </div>
                </div>
              ))
            )}

          </div>
        </div>
        )}
      </div>
      {/* END: Tables and Secondary Info */}

      {/* BEGIN: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Inventory Movement Chart */}
        {['Super Admin', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-800">WIP Movement (Last 6 Months)</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Launched" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Rejected" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Quality Analytics Chart */}
        {['Super Admin', 'Quality Inspector', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-800">Quality Rejections by Stage</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Rejections" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

      </div>
      {/* END: Charts Section */}

      {/* BEGIN: Extra Sections (Machine Status & Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Machine Status */}
        {['Super Admin', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-800">Live Machine Telemetry</h4>
          </div>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h5 className="font-semibold text-sm text-slate-800">Schmoll CNC Drill Line 1</h5>
                  <p className="text-xs text-slate-500">Running Job: JC-2026-0089</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-600">92%</span>
                <p className="text-[10px] text-slate-400 uppercase">Efficiency</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h5 className="font-semibold text-sm text-slate-800">PAL Automatic Plating Line</h5>
                  <p className="text-xs text-slate-500">Running Job: JC-2026-0091</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-600">88%</span>
                <p className="text-[10px] text-slate-400 uppercase">Efficiency</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <div>
                  <h5 className="font-semibold text-sm text-slate-800">LDI Exposure Unit</h5>
                  <p className="text-xs text-slate-500">Maintenance Window</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-500">Idle</span>
                <p className="text-[10px] text-slate-400 uppercase">Status</p>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* Recent Activity */}
        {['Super Admin', 'Quality Inspector', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-800">Recent System Activity</h4>
          </div>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-800 text-xs">Priority Override</div>
                  <time className="text-[10px] text-slate-500">10 mins ago</time>
                </div>
                <div className="text-slate-600 text-xs">Production Manager updated priority for JC-2026-0089 to URGENT.</div>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-amber-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-800 text-xs">Quality Alert</div>
                  <time className="text-[10px] text-slate-500">1 hr ago</time>
                </div>
                <div className="text-slate-600 text-xs">Minor defect detected at Solder Mask inspection for batch #4402.</div>
              </div>
            </div>
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-emerald-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-800 text-xs">Batch Completed</div>
                  <time className="text-[10px] text-slate-500">2 hrs ago</time>
                </div>
                <div className="text-slate-600 text-xs">JC-2026-0080 fully dispatched to inventory.</div>
              </div>
            </div>

          </div>
        </div>
        )}

      </div>
      {/* END: Extra Sections */}

      {/* BEGIN: Operational Alerts & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Material Stock Alerts */}
        {['Super Admin', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PackageMinus className="w-5 h-5 text-rose-500" />
              <h4 className="font-bold text-slate-800">Critical Material Alerts</h4>
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded">3 ITEMS LOW</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div>
                <h5 className="font-semibold text-sm text-slate-800">FR4 1.6mm 1oz 18x24"</h5>
                <p className="text-xs text-slate-500">Supplier: Isola • Lead time: 5 days</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-rose-600">45 Panels</span>
                <p className="text-[10px] text-slate-400">Min: 100</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div>
                <h5 className="font-semibold text-sm text-slate-800">Dry Film Photoresist (Dupont)</h5>
                <p className="text-xs text-slate-500">Supplier: Dupont • Lead time: 2 days</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-500">2 Rolls</span>
                <p className="text-[10px] text-slate-400">Min: 3</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div>
                <h5 className="font-semibold text-sm text-slate-800">0.3mm Carbide Drill Bits</h5>
                <p className="text-xs text-slate-500">Supplier: Union Tool • Lead time: 10 days</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-rose-600">120 PCS</span>
                <p className="text-[10px] text-slate-400">Min: 500</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors">
            View All Inventory <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        )}

        {/* Upcoming Deadlines */}
        {['Super Admin', 'Dispatch Manager', 'Production Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-500" />
              <h4 className="font-bold text-slate-800">Upcoming Dispatches (48h)</h4>
            </div>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">4 ORDERS</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-rose-100 text-rose-700 rounded p-2 min-w-[50px]">
                <span className="text-xs font-bold uppercase">TODAY</span>
                <span className="text-lg font-bold">14:00</span>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  JC-2026-0082 <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded uppercase">FQC Pending</span>
                </h5>
                <p className="text-xs text-slate-500">Customer: RF Tech • 3,000 PCS</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-amber-100 text-amber-700 rounded p-2 min-w-[50px]">
                <span className="text-xs font-bold uppercase">TODAY</span>
                <span className="text-lg font-bold">18:30</span>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  JC-2026-0080 <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Ready</span>
                </h5>
                <p className="text-xs text-slate-500">Customer: AutoCorp • 500 PCS</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-700 rounded p-2 min-w-[50px]">
                <span className="text-xs font-bold uppercase">TMW</span>
                <span className="text-lg font-bold">10:00</span>
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  JC-2026-0085 <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Routing</span>
                </h5>
                <p className="text-xs text-slate-500">Customer: IoT Systems • 1,500 PCS</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors">
            View Dispatch Schedule <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        )}
        
      </div>
      </div>
      </div>

      {/* Style for Custom Scrollbar matching the requested design */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
