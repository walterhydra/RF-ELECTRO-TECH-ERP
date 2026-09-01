'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Split, 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Building2,
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Box,
  Workflow
} from 'lucide-react';

interface SubJobCard {
  id: string;
  subJobCardNo: string;
  qty: number;
  status: string;
  qrCodeValue: string;
  currentStage?: { id: string; name: string } | null;
}

interface JobCard {
  id: string;
  jobCardNo: string;
  customerPoId: string;
  productId: string;
  totalQty: number;
  status: string;
  qrCodeValue: string;
  launchedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  customerPO: {
    poNo: string;
    orderQty: number;
    customer: { companyName: string };
  };
  product: {
    name: string;
    code: string;
    specCardNo: string;
    layers: number;
    thickness: string;
    copper: string;
  };
  processFlowMaster?: {
    name: string;
    totalSteps: number;
  };
  subJobCards: SubJobCard[];
}

interface OpenPO {
  id: string;
  poNo: string;
  orderQty: number;
  expectedDeliveryDate: string;
  customer: { companyName: string };
  product: { name: string; code: string; specCardNo: string };
}

const INITIAL_JOB_CARDS: JobCard[] = [
  {
    id: 'jc-1',
    jobCardNo: 'JC-2026-001',
    customerPoId: 'po-1',
    productId: 'prod-1',
    totalQty: 2500,
    status: 'IN_PROGRESS',
    qrCodeValue: 'JC-2026-001-PARENT',
    createdAt: '2026-07-01T10:00:00Z',
    launchedAt: '2026-07-02T09:30:00Z',
    customerPO: {
      poNo: 'PO-2026-001',
      orderQty: 2500,
      customer: { companyName: 'Apex Electronics Ltd' },
    },
    product: {
      name: 'Main Motherboard V2',
      code: 'PCB-MB-V2',
      specCardNo: 'D001',
      layers: 4,
      thickness: '1.6mm',
      copper: '1oz',
    },
    subJobCards: [
      {
        id: 'sub-1',
        subJobCardNo: 'JC-2026-001-A',
        qty: 1500,
        status: 'IN_PROGRESS',
        qrCodeValue: 'JC-2026-001-A',
        currentStage: { id: 'stg-3', name: 'CNC Drilling & Routing' },
      },
      {
        id: 'sub-2',
        subJobCardNo: 'JC-2026-001-B',
        qty: 1000,
        status: 'IN_PROGRESS',
        qrCodeValue: 'JC-2026-001-B',
        currentStage: { id: 'stg-2', name: 'CNC Material Cutting' },
      },
    ],
  },
  {
    id: 'jc-2',
    jobCardNo: 'JC-2026-002',
    customerPoId: 'po-3',
    productId: 'prod-3',
    totalQty: 5000,
    status: 'UNLAUNCHED',
    qrCodeValue: 'JC-2026-002-PARENT',
    createdAt: '2026-07-03T11:20:00Z',
    customerPO: {
      poNo: 'PO-2026-003',
      orderQty: 5000,
      customer: { companyName: 'Orbit Medical Devices' },
    },
    product: {
      name: 'Power Supply PCB',
      code: 'PCB-PSU-10',
      specCardNo: 'D003',
      layers: 2,
      thickness: '1.2mm',
      copper: '2oz',
    },
    subJobCards: [
      {
        id: 'sub-3',
        subJobCardNo: 'JC-2026-002-A',
        qty: 5000,
        status: 'UNLAUNCHED',
        qrCodeValue: 'JC-2026-002-A',
        currentStage: { id: 'stg-1', name: 'CAM & Gerber Verification' },
      },
    ],
  },
];

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>(INITIAL_JOB_CARDS);
  const [openPos, setOpenPos] = useState<OpenPO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>('jc-1');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [generating, setGenerating] = useState(false);

  const [showSplitModal, setShowSplitModal] = useState<JobCard | null>(null);
  const [splitRows, setSplitRows] = useState<{ qty: string }[]>([{ qty: '' }, { qty: '' }]);
  const [splitting, setSplitting] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);

  const [showQrModal, setShowQrModal] = useState<{
    jobCard: JobCard;
    parentQrUrl?: string;
    subQrUrls?: { [id: string]: string };
  } | null>(null);

  useEffect(() => {
    fetchJobCards();
    fetchOpenPos();
  }, [statusFilter]);

  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  const fetchJobCards = async () => {
    try {
      const token = getAuthToken();
      let url = 'http://localhost:3001/api/v1/job-cards';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setJobCards(data);
      }
    } catch {}
  };

  const fetchOpenPos = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3001/api/v1/customer-pos?status=OPEN', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOpenPos(data);
      }
    } catch {}
  };

  const handleGenerateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;
    setGenerating(true);
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3001/api/v1/job-cards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerPoId: selectedPoId }),
      });
      if (res.ok) {
        setShowGenerateModal(false);
        fetchJobCards();
        fetchOpenPos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenSplitModal = (jc: JobCard) => {
    setShowSplitModal(jc);
    setSplitRows([{ qty: String(Math.floor(jc.totalQty / 2)) }, { qty: String(Math.ceil(jc.totalQty / 2)) }]);
    setSplitError(null);
  };

  const handleAddSplitRow = () => {
    setSplitRows([...splitRows, { qty: '' }]);
  };

  const handleRemoveSplitRow = (index: number) => {
    if (splitRows.length <= 2) return;
    setSplitRows(splitRows.filter((_, i) => i !== index));
  };

  const handleSaveSplit = async () => {
    if (!showSplitModal) return;
    setSplitError(null);
    const qtys = splitRows.map((r) => parseInt(r.qty, 10) || 0);
    const sum = qtys.reduce((a, b) => a + b, 0);

    if (sum !== showSplitModal.totalQty) {
      setSplitError(`Sum of split batch quantities (${sum.toLocaleString()} PCS) must equal total Job Card quantity (${showSplitModal.totalQty.toLocaleString()} PCS).`);
      return;
    }

    setSplitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/${showSplitModal.id}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantities: qtys }),
      });
      if (res.ok) {
        setShowSplitModal(null);
        fetchJobCards();
      } else {
        const errData = await res.json();
        setSplitError(errData.message || 'Failed to split job card');
      }
    } catch (err: any) {
      setSplitError('Offline preview mode active');
    } finally {
      setSplitting(false);
    }
  };

  const handleLaunchProduction = async (jobCardId: string, jobCardNo: string) => {
    if (!confirm(`Are you sure you want to launch Job Card ${jobCardNo} into shop floor production?`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/${jobCardId}/launch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchJobCards();
      }
    } catch (err) {
      setJobCards(jobCards.map(j => j.id === jobCardId ? { ...j, status: 'IN_PROGRESS' } : j));
    }
  };

  const handleOpenQrModal = async (jc: JobCard) => {
    setShowQrModal({ jobCard: jc });
  };

  const filteredCards = jobCards.filter((jc) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      jc.jobCardNo.toLowerCase().includes(query) ||
      jc.customerPO?.poNo?.toLowerCase().includes(query) ||
      jc.customerPO?.customer?.companyName?.toLowerCase().includes(query) ||
      jc.product?.code?.toLowerCase().includes(query) ||
      jc.product?.specCardNo?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || jc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNLAUNCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> UNLAUNCHED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> ON HOLD
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // KPI Calculations
  const totalMasterCards = jobCards.length;
  const unlaunchedCount = jobCards.filter((j) => j.status === 'UNLAUNCHED').length;
  const inProgressCount = jobCards.filter((j) => j.status === 'IN_PROGRESS').length;
  const totalSubBatches = jobCards.reduce((acc, curr) => acc + (curr.subJobCards?.length || 0), 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Cards & Lot Batch Split Master</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Shop Floor Lot Splitting
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate Master Job Cards, split into sub-job lot batches, print QR stickers & Traveler PDF sheets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Generate Job Card from PO</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Master Job Cards</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalMasterCards} Master Cards</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Unlaunched / Pending</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{unlaunchedCount} Pending Launch</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">In Stage Production</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{inProgressCount} Active Jobs</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Sub-Job Batches Split</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalSubBatches} Lot Batches</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Job Card # (e.g. JC-2026-001), PO No, Customer, Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap mr-1">Status:</span>
          {['ALL', 'UNLAUNCHED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].map((st) => {
            const count = st === 'ALL' ? jobCards.length : jobCards.filter(j => j.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{st === 'ALL' ? 'All Cards' : st.replace('_', ' ')}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Job Cards Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3">Job Card #</th>
                <th className="py-3 px-3">Customer & PO</th>
                <th className="py-3 px-3">Product & Gerber Specs</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3">Batches</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCards.map((jc) => {
                const isExpanded = expandedRow === jc.id;
                const isUnlaunched = jc.status === 'UNLAUNCHED';

                return (
                  <React.Fragment key={jc.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Job Card # */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : jc.id)}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 shadow-2xs whitespace-nowrap inline-block">
                            {jc.jobCardNo}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 pl-6">
                          {new Date(jc.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer & PO Link */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900 text-xs truncate max-w-[140px] inline-block">{jc.customerPO?.customer?.companyName || 'N/A'}</span>
                        </div>
                        <div className="mt-0.5 pl-5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold whitespace-nowrap inline-block">
                            PO: {jc.customerPO?.poNo}
                          </span>
                        </div>
                      </td>

                      {/* Product & Gerber Specs */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">{jc.product?.name || jc.product?.code}</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold whitespace-nowrap">
                              {jc.product?.specCardNo || 'D000'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-purple-700 font-semibold whitespace-nowrap">
                              {jc.product?.layers || 2}L
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 whitespace-nowrap text-[10px]">
                              {jc.product?.thickness || '1.6mm'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                        {jc.totalQty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                      </td>

                      {/* Lot Batches */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-blue-700 text-[11px]">
                          {jc.subJobCards?.length || 0} Batches
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(jc.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          <button
                            onClick={() => handleOpenQrModal(jc)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all inline-flex items-center gap-1 text-[11px] font-medium shadow-2xs"
                            title="Print / View QR Stickers & Traveler Sheet"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-600" />
                            <span>QR</span>
                          </button>

                          {isUnlaunched && (
                            <button
                              onClick={() => handleOpenSplitModal(jc)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 rounded-lg transition-all inline-flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                              title="Split into Sub-Job Cards"
                            >
                              <Split className="w-3.5 h-3.5" />
                              <span>Split</span>
                            </button>
                          )}

                          {isUnlaunched && (
                            <button
                              onClick={() => handleLaunchProduction(jc.id, jc.jobCardNo)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-sm inline-flex items-center gap-1 text-[11px]"
                              title="Launch into Stage 1 Production"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Launch</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>

                    {/* Expandable Sub-Job Cards Grid */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={7} className="p-5">
                          <div className="space-y-3 pl-4 border-l-2 border-amber-500">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Split className="w-4 h-4 text-amber-600" />
                                <span>Sub-Job Card Batch Hierarchy ({jc.subJobCards?.length || 0} Lots)</span>
                              </h4>
                              {isUnlaunched && (
                                <button
                                  onClick={() => handleOpenSplitModal(jc)}
                                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Configure / Edit Batch Splits</span>
                                </button>
                              )}
                            </div>

                            {(!jc.subJobCards || jc.subJobCards.length === 0) ? (
                              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-xs shadow-2xs">
                                No sub-job cards created yet. When launched, 1 primary sub-job card (<span className="font-mono font-bold text-blue-700">{jc.jobCardNo}-A</span>) will be generated automatically for full {jc.totalQty} PCS.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {jc.subJobCards.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 relative overflow-hidden group hover:border-amber-400 transition-all shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="font-bold font-mono text-slate-900 text-xs">{sub.subJobCardNo}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        {sub.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-medium">Batch Qty:</span>
                                      <span className="font-bold font-mono text-blue-700">{sub.qty.toLocaleString()} PCS</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-500 font-medium">Current Stage:</span>
                                      <span className="font-semibold text-slate-900">
                                        {sub.currentStage?.name || 'Pending Launch'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No master job cards found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Generate Job Card from PO */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Generate Production Job Card</h3>
                  <p className="text-xs text-slate-500">Select an open Customer PO to launch manufacturing</p>
                </div>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors">✕</button>
            </div>

            <form onSubmit={handleGenerateJobCard} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SELECT OPEN PURCHASE ORDER *</label>
                <select
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Choose an Open PO --</option>
                  {openPos.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNo} — {po.customer.companyName} ({po.product.code} / {po.orderQty.toLocaleString()} PCS)
                    </option>
                  ))}
                </select>
              </div>

              {selectedPoId && (() => {
                const po = openPos.find((p) => p.id === selectedPoId);
                if (!po) return null;
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-semibold text-slate-900">{po.customer.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Product Code:</span>
                      <span className="font-bold text-blue-700 font-mono">{po.product.code} ({po.product.specCardNo})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Total PO Quantity:</span>
                      <span className="font-bold font-mono text-slate-900">{po.orderQty.toLocaleString()} PCS</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-sm"
                >
                  {generating ? 'Generating...' : 'Generate Job Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Split Job Card */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Split Job Card #{showSplitModal.jobCardNo}</h3>
                  <p className="text-xs text-slate-500">Divide total {showSplitModal.totalQty.toLocaleString()} PCS into batch sub-job cards</p>
                </div>
              </div>
              <button onClick={() => setShowSplitModal(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors">✕</button>
            </div>

            {splitError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
                {splitError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                {splitRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold w-20">Batch {String.fromCharCode(65 + idx)}:</span>
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => {
                        const copy = [...splitRows];
                        copy[idx].qty = e.target.value;
                        setSplitRows(copy);
                      }}
                      placeholder="Qty in PCS"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                    {splitRows.length > 2 && (
                      <button onClick={() => handleRemoveSplitRow(idx)} className="text-rose-500 hover:text-rose-700 font-bold text-sm">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSplitRow}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Sub-Batch
              </button>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSplit}
                  disabled={splitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-sm"
                >
                  {splitting ? 'Splitting...' : 'Confirm Batch Split'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QR Sticker Sheet & Printable Viewer */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">QR Code & Traveler Sheet Preview</h3>
                  <p className="text-xs text-slate-500">{showQrModal.jobCard.jobCardNo}</p>
                </div>
              </div>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors">✕</button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="w-32 h-32 bg-white border border-slate-300 rounded-xl mx-auto flex items-center justify-center shadow-2xs p-2">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <p className="font-mono font-bold text-xs text-slate-900">{showQrModal.jobCard.qrCodeValue}</p>
              <p className="text-xs text-slate-500">Scan this QR on shop-floor PWA scanner for real-time stage progress log.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowQrModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
