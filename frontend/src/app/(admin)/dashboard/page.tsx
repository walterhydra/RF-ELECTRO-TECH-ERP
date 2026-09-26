'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TraceLineTracker } from '@/components/ui/TraceLineTracker';
import { getApiBaseUrl } from '@/lib/utils';
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
  const router = useRouter();
  const [customer, setCustomer] = useState('');
  const [productClass, setProductClass] = useState('');
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('');
  const [timeline, setTimeline] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('Super Admin');
  const [assignedStage, setAssignedStage] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [operatorJobCards, setOperatorJobCards] = useState<any[]>([]);

  const isOperator = userRole.toLowerCase().includes('operator') || Boolean(assignedStage) || userRole === 'NORMAL' || userRole === 'PROCESS_OPERATOR';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.replace('/job-cards');
      return;
    }
    const role = localStorage.getItem('userRole');
    const stageVal = localStorage.getItem('assignedStage');
    if (role) setUserRole(role);
    if (stageVal) setAssignedStage(stageVal);
  }, [router]);

  const fetchLiveDashboard = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      };

      // 1. Fetch Executive / General Dashboard Summary
      try {
        const res = await fetch(`${getApiBaseUrl()}/reports/dashboard-summary`, { headers });
        if (res.ok) {
          const data = await res.json();
          setApiData(data);
        }
      } catch (err) {
        console.warn('Dashboard summary fetch failed:', err);
      }

      // 2. If Stage Operator or regular user, fetch Stage Scoped Job Cards
      try {
        const jcRes = await fetch(`${getApiBaseUrl()}/job-cards`, { headers });
        if (jcRes.ok) {
          const jcData = await jcRes.json();
          if (Array.isArray(jcData)) {
            // Unpack subJobCards if present or use top-level
            const unpacked: any[] = [];
            jcData.forEach((jc: any) => {
              if (Array.isArray(jc.subJobCards) && jc.subJobCards.length > 0) {
                jc.subJobCards.forEach((sub: any) => {
                  unpacked.push({
                    ...jc,
                    id: sub.id || jc.id,
                    jobCardNo: jc.jobCardNo,
                    subJobCardNo: sub.subJobCardNo || jc.jobCardNo,
                    totalPcbQty: sub.totalPcbQty || sub.qty || jc.totalPcbQty || 160,
                    custPnlQty: sub.totalPcbQty || sub.qty || jc.custPnlQty || 80,
                    custPnlAreaSqm: sub.custPnlAreaSqm || jc.custPnlAreaSqm || 45,
                    currentStageName: sub.currentStage?.name || jc.currentStageName || jc.currentStage?.name || '1. SHEARING',
                    stageStatus: sub.status || jc.status || 'IN_PROGRESS',
                    status: sub.status || jc.status,
                  });
                });
              } else {
                unpacked.push({
                  ...jc,
                  subJobCardNo: jc.jobCardNo,
                  currentStageName: jc.currentStageName || jc.currentStage?.name || '1. SHEARING',
                  stageStatus: jc.status || 'IN_PROGRESS',
                });
              }
            });
            setOperatorJobCards(unpacked);
          }
        }
      } catch (err) {
        console.warn('Job cards fetch failed:', err);
      }
    } catch (err) {
      console.error('Failed to load live dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, [customer, productClass, stage, priority, timeline, userRole, assignedStage]);

  const clearFilters = () => {
    setCustomer('');
    setProductClass('');
    setStage('');
    setPriority('');
    setTimeline('');
    setSearchQuery('');
  };

  const activeFilters = [customer, productClass, stage, priority, timeline, searchQuery].filter(Boolean);
  const filterLabel = activeFilters.length > 0 
    ? `${activeFilters.length} Active Filter${activeFilters.length > 1 ? 's' : ''}` 
    : 'Active Global View';

  // For Admin / Managers
  const jobsList = apiData?.liveJobCards && apiData.liveJobCards.length > 0 ? apiData.liveJobCards : mockJobs;
  const filteredJobs = jobsList.filter((job: any) => {
    if (customer && job.customer !== customer) return false;
    if (productClass && job.productClass !== productClass) return false;
    if (stage && job.stage !== stage) return false;
    if (priority && job.priority !== priority) return false;
    return true;
  });

  // For Stage Operators
  const filteredOperatorJobs = operatorJobCards.filter((job: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNo = (job.jobCardNo || '').toLowerCase().includes(q);
      const matchSub = (job.subJobCardNo || '').toLowerCase().includes(q);
      const matchCust = (job.customerPO?.customer?.companyName || job.customerCode || '').toLowerCase().includes(q);
      const matchPart = (job.customerPartNo || job.rfePartCode || '').toLowerCase().includes(q);
      if (!matchNo && !matchSub && !matchCust && !matchPart) return false;
    }
    if (customer) {
      const cName = job.customerPO?.customer?.companyName || job.customerCode || '';
      if (!cName.toLowerCase().includes(customer.toLowerCase())) return false;
    }
    if (priority) {
      const p = (job.priority || '').toUpperCase();
      if (priority.toUpperCase() === 'URGENT' && !['URGENT', 'MOST URGENT', 'HIGH'].includes(p)) return false;
      if (priority.toUpperCase() === 'NORMAL' && p !== 'NORMAL') return false;
    }
    return true;
  });

  // Operator Stage Stats calculation
  const stagePcbTotal = filteredOperatorJobs.reduce((acc, j) => acc + (Number(j.totalPcbQty) || Number(j.custPnlQty) || 0), 0);
  const stageAreaTotal = filteredOperatorJobs.reduce((acc, j) => acc + (Number(j.custPnlAreaSqm) || Number(j.prodPnlAreaSqm) || 0), 0);
  const stageUrgentCount = filteredOperatorJobs.filter(j => ['MOST URGENT', 'HIGH', 'URGENT'].includes((j.priority || '').toUpperCase())).length;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Title & Stage Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {isOperator 
                ? (assignedStage ? `⚙️ Stage Work-Queue: ${assignedStage}` : `⚙️ ${userRole} Workbench`)
                : userRole === 'Production Manager' ? '🏭 Production Overview & WIP Monitor'
                : userRole === 'Quality Inspector' ? '🔍 Quality Control Dashboard'
                : userRole === 'Dispatch Manager' ? '🚚 Dispatch & Delivery Dashboard'
                : '🏭 Factory Overview Dashboard'}
            </h3>
            {isOperator && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Stage Isolation Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-bold tracking-wide uppercase mt-1 flex items-center gap-2">
            <span>{userRole}</span>
            <span>•</span>
            <span className="text-emerald-600 font-mono">LIVE STATION METRICS</span>
            <span>•</span>
            <span>SHIFT: MORNING (A)</span>
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLiveDashboard()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
          {isOperator && (
            <a
              href="/job-cards/movement"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-sm transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Job Movement</span>
            </a>
          )}
        </div>
      </div>

      {/* BEGIN: Filters Section */}
      <section className="bg-white p-4 rounded-xl shadow-xs border border-slate-200" data-purpose="filter-bar">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {isOperator && (
            <div className="md:col-span-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Job Card No, WIP Lot, Part..."
                className="w-full border-slate-200 rounded-lg text-xs focus:ring-blue-500 p-2.5 border bg-slate-50/50 font-medium"
              />
            </div>
          )}
          <select 
            className="form-select border-slate-200 rounded-lg text-xs focus:ring-blue-500 w-full p-2.5 border bg-white font-medium"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">All Customers</option>
            <option value="RF Tech">RF Tech</option>
            <option value="Solar Solutions">Solar Solutions</option>
          </select>
          {!isOperator && (
            <>
              <select 
                className="form-select border-slate-200 rounded-lg text-xs focus:ring-blue-500 w-full p-2.5 border bg-white font-medium"
                value={productClass}
                onChange={(e) => setProductClass(e.target.value)}
              >
                <option value="">All Product Classes</option>
                <option value="Single Sided">Single Sided</option>
                <option value="Double Sided PTH">Double Sided PTH</option>
                <option value="Multilayer (4+)">Multilayer (4+)</option>
              </select>
              <select 
                className="form-select border-slate-200 rounded-lg text-xs focus:ring-blue-500 w-full p-2.5 border bg-white font-medium"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="">All Stages</option>
                <option value="CNC Drilling">CNC Drilling</option>
                <option value="Plating">Plating</option>
                <option value="Solder Mask">Solder Mask</option>
              </select>
            </>
          )}
          <select 
            className="form-select border-slate-200 rounded-lg text-xs focus:ring-blue-500 w-full p-2.5 border bg-white font-medium"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent / High</option>
          </select>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={clearFilters}
            className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-semibold border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${activeFilters.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
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

      {/* BEGIN: STAGE OPERATOR WORKBENCH SECTION */}
      {isOperator && (
        <div className="space-y-8 mb-8 animate-in fade-in duration-300">
          {/* Stage Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Active Stage Lots */}
            <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-blue-600 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Stage Active Jobs</p>
                  <h4 className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {filteredOperatorJobs.length}
                  </h4>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-4">
                Lots currently waiting or in process at this stage
              </p>
            </div>

            {/* Pending WIP PCBs */}
            <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-indigo-600 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Pending PCB Qty</p>
                  <h4 className="text-3xl font-black text-indigo-700 mt-2 font-mono">
                    {stagePcbTotal.toLocaleString()}
                  </h4>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-4">
                Total PCB boards in stage queue
              </p>
            </div>

            {/* WIP Area SQM */}
            <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-emerald-600 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Stage Area Load</p>
                  <h4 className="text-3xl font-black text-emerald-700 mt-2 font-mono">
                    {stageAreaTotal.toFixed(2)} <span className="text-sm font-sans font-bold text-slate-500">SQM</span>
                  </h4>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-4">
                Total panel surface area in work-queue
              </p>
            </div>

            {/* Urgent / Priority Jobs */}
            <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-amber-500 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Priority / Urgent</p>
                  <h4 className="text-3xl font-black text-amber-600 mt-2 font-mono">
                    {stageUrgentCount}
                  </h4>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-4">
                High-priority job cards requiring fast turnaround
              </p>
            </div>
          </div>

          {/* Live Stage Work Queue Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Active Job Cards at Stage: <span className="text-blue-600">{assignedStage || userRole}</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Process incoming lots, verify specifications, and move to next manufacturing stage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                  {filteredOperatorJobs.length} Lots in Queue
                </span>
                <a
                  href="/job-cards"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                >
                  View Full Job Cards List →
                </a>
              </div>
            </div>

            {filteredOperatorJobs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h5 className="text-lg font-black text-slate-800 mb-1">
                  No Pending Job Cards at Stage: {assignedStage || userRole}
                </h5>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  All job card batches for this stage have been completed and advanced forward. When upstream stages pass lots to {assignedStage || 'your stage'}, they will appear here in real-time.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchLiveDashboard()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    Refresh Work-Queue
                  </button>
                  <a
                    href="/floor"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-colors"
                  >
                    Check Factory Floor View
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/75 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Job Card / WIP No</th>
                      <th className="px-4 py-3.5">Customer & PO</th>
                      <th className="px-4 py-3.5">Part & Specs</th>
                      <th className="px-4 py-3.5">Priority</th>
                      <th className="px-4 py-3.5">Stage WIP Volume</th>
                      <th className="px-4 py-3.5">Stage Status</th>
                      <th className="px-5 py-3.5 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {filteredOperatorJobs.map((job: any, idx: number) => {
                      const pcbQty = job.totalPcbQty || job.custPnlQty || 160;
                      const areaSqm = job.custPnlAreaSqm || job.prodPnlAreaSqm || 45;
                      const priorityStr = (job.priority || 'NORMAL').toUpperCase();
                      const isUrgent = ['MOST URGENT', 'URGENT', 'HIGH'].includes(priorityStr);
                      const activeJobNo = job.subJobCardNo || job.jobCardNo;

                      return (
                        <tr key={job.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Job Card No */}
                          <td className="px-5 py-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-xs">
                                {activeJobNo}
                              </span>
                            </div>
                            {job.subJobCardNo && job.subJobCardNo !== job.jobCardNo && (
                              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                Master: {job.jobCardNo}
                              </span>
                            )}
                          </td>

                          {/* Customer & PO */}
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-800 text-xs">
                              {job.customerPO?.customer?.companyName || job.customerCode || 'RF Client'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              PO: {job.customerPO?.poNo || 'PO-2026-LIVE'}
                            </p>
                          </td>

                          {/* Part & Specs */}
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[200px]">
                              {job.customerPartNo || job.product?.name || 'Standard PCB'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {job.rfePartCode || job.product?.specCardNo || 'RFE-SPEC'} • {job.product?.layers ? `${job.product.layers}L` : '2L'} • {job.product?.thickness || '1.6mm'}
                            </p>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isUrgent 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>}
                              {priorityStr}
                            </span>
                          </td>

                          {/* Volume */}
                          <td className="px-4 py-4 font-mono">
                            <p className="font-black text-slate-900 text-xs">{pcbQty} PCBs</p>
                            <p className="text-[10px] text-slate-500">{areaSqm} SQM</p>
                          </td>

                          {/* Stage Status */}
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {job.stageStatus || 'IN STAGE'}
                            </span>
                          </td>

                          {/* Quick Action */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/job-cards/movement?search=${encodeURIComponent(activeJobNo)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all hover:shadow-xs"
                              >
                                <span>Move Stage</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href="/job-cards"
                                title="View Traveler Card"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Stage Shortcuts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/job-cards"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h6 className="font-extrabold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                  Job Cards & Lot Splits
                </h6>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View traveler cards and lot details for {assignedStage}
                </p>
              </div>
            </a>

            <a
              href="/job-cards/movement"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h6 className="font-extrabold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">
                  Process Movement & Logs
                </h6>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record completion, stage params & scrap rejections
                </p>
              </div>
            </a>

            <a
              href="/floor"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h6 className="font-extrabold text-slate-800 text-xs group-hover:text-emerald-600 transition-colors">
                  Live Factory Floor Monitor
                </h6>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View full factory WIP pipeline and stage queues
                </p>
              </div>
            </a>
          </div>
        </div>
      )}
      {/* END: STAGE OPERATOR WORKBENCH SECTION */}

      {/* BEGIN: EXECUTIVE MANAGEMENT METRIC CARDS */}
      {!isOperator && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Total WIP Card */}
        {['Super Admin', 'Production Manager', 'Dispatch Manager'].includes(userRole) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total WIP Volume</p>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2">
            <h4 className="text-3xl font-bold text-slate-800">
              {apiData?.totalWipQty ? apiData.totalWipQty.toLocaleString() : '14,850'}
            </h4>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Panels / SQM</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-emerald-50 p-2 rounded">
              <p className="text-[10px] text-slate-500 uppercase">On Track</p>
              <p className="text-lg font-bold text-emerald-600">
                {apiData?.totalWipQty ? Math.round(apiData.totalWipQty * 0.9).toLocaleString() : '13,200'}
              </p>
            </div>
            <div className="bg-amber-50 p-2 rounded">
              <p className="text-[10px] text-slate-500 uppercase">Delayed</p>
              <p className="text-lg font-bold text-amber-500">
                {apiData?.totalWipQty ? Math.round(apiData.totalWipQty * 0.1).toLocaleString() : '1,650'}
              </p>
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
            <h4 className="text-3xl font-bold text-slate-800">
              {apiData?.activeJobCardsCount !== undefined ? apiData.activeJobCardsCount : 24}
            </h4>
          </div>
          <div className="mt-auto pt-4">
            <span className="text-[10px] text-emerald-600 font-semibold">
              ↑ {apiData?.launchedTodayCount !== undefined ? apiData.launchedTodayCount : 4} launched today
            </span>
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
            <h4 className="text-3xl font-bold text-slate-800">
              {apiData?.rejectionRatePercent ? `${apiData.rejectionRatePercent}%` : '0.82%'}
            </h4>
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
      )}
      {/* END: EXECUTIVE MANAGEMENT METRIC CARDS */}

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
                {(apiData?.stageLoadSummary && apiData.stageLoadSummary.length > 0) ? (
                  apiData.stageLoadSummary.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-4 font-medium">{item.stageName}</td>
                      <td className="px-4 py-4">{item.activeJobs}</td>
                      <td className="px-4 py-4">{item.volume?.toLocaleString() || 0}</td>
                      <td className="px-4 py-4">{item.capacity}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'High Load' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'Low Load' ? 'bg-slate-100 text-slate-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
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
                  </>
                )}
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
