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
  ShieldAlert
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

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [openPos, setOpenPos] = useState<OpenPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
  const [loadingQrs, setLoadingQrs] = useState(false);

  useEffect(() => {
    fetchJobCards();
    fetchOpenPos();
  }, [statusFilter]);

  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  const fetchJobCards = async () => {
    setLoading(true);
    setError(null);
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
      if (!res.ok) throw new Error('Failed to fetch Job Cards');
      const data = await res.json();
      setJobCards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching job cards:', err);
      setError('Unable to connect to production database. Make sure local backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenPos = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3001/api/v1/customer-pos?status=OPEN', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOpenPos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching open POs:', err);
    }
  };

  const handleGenerateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;
    setGenerating(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/from-po/${selectedPoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate Job Card');
      }
      setShowGenerateModal(false);
      setSelectedPoId('');
      fetchJobCards();
      fetchOpenPos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLaunchProduction = async (id: string, jobCardNo: string) => {
    if (!confirm(`Are you sure you want to launch Job Card "${jobCardNo}" into Stage 1? This will initiate shop floor tracking.`)) {
      return;
    }
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/${id}/launch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to launch Job Card');
      }
      fetchJobCards();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchJobCards();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenSplitModal = (jc: JobCard) => {
    setShowSplitModal(jc);
    setSplitError(null);
    // Default to 2 equal splits or existing splits if any
    if (jc.subJobCards.length > 0) {
      setSplitRows(jc.subJobCards.map((s) => ({ qty: s.qty.toString() })));
    } else {
      const half = Math.floor(jc.totalQty / 2);
      setSplitRows([{ qty: half.toString() }, { qty: (jc.totalQty - half).toString() }]);
    }
  };

  const addSplitRow = () => {
    setSplitRows([...splitRows, { qty: '' }]);
  };

  const removeSplitRow = (index: number) => {
    if (splitRows.length <= 1) return;
    setSplitRows(splitRows.filter((_, i) => i !== index));
  };

  const handleSplitRowChange = (index: number, val: string) => {
    const updated = [...splitRows];
    updated[index].qty = val;
    setSplitRows(updated);
  };

  const calculateSplitSum = () => {
    return splitRows.reduce((sum, r) => sum + (parseInt(r.qty, 10) || 0), 0);
  };

  const handleSubmitSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSplitModal) return;
    const sum = calculateSplitSum();
    if (sum !== showSplitModal.totalQty) {
      setSplitError(`Total split quantity (${sum}) must equal Job Card total quantity (${showSplitModal.totalQty})`);
      return;
    }
    setSplitting(true);
    setSplitError(null);
    try {
      const token = getAuthToken();
      const splits = splitRows.map((r) => ({ qty: parseInt(r.qty, 10) }));
      const res = await fetch(`http://localhost:3001/api/v1/job-cards/${showSplitModal.id}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ splits }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to split Job Card');
      }
      setShowSplitModal(null);
      fetchJobCards();
    } catch (err: any) {
      setSplitError(err.message);
    } finally {
      setSplitting(false);
    }
  };

  const handleOpenQrModal = async (jc: JobCard) => {
    setShowQrModal({ jobCard: jc });
    setLoadingQrs(true);
    try {
      const token = getAuthToken();
      // Fetch parent QR
      const parentRes = await fetch(`http://localhost:3001/api/v1/job-cards/${jc.id}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parentData = await parentRes.json();

      // Fetch sub card QRs
      const subQrUrls: { [id: string]: string } = {};
      for (const sub of jc.subJobCards) {
        const subRes = await fetch(`http://localhost:3001/api/v1/sub-job-cards/${sub.id}/qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          subQrUrls[sub.id] = subData.dataUrl;
        }
      }

      setShowQrModal({
        jobCard: jc,
        parentQrUrl: parentData.dataUrl,
        subQrUrls,
      });
    } catch (err) {
      console.error('Error loading QR codes:', err);
    } finally {
      setLoadingQrs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'NOT_LAUNCHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">Created / Unlaunched</span>;
      case 'LAUNCHED':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">In Production</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">On Hold</span>;
      case 'COMPLETED':
      case 'READY_FOR_DISPATCH':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Completed / Ready</span>;
      case 'DISPATCHED':
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Dispatched</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  // KPI calculations
  const totalCards = jobCards.length;
  const inProgressCards = jobCards.filter((c) => ['LAUNCHED', 'IN_PROGRESS'].includes(c.status)).length;
  const unlaunchedCards = jobCards.filter((c) => ['CREATED', 'NOT_LAUNCHED'].includes(c.status)).length;
  const completedCards = jobCards.filter((c) => ['COMPLETED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(c.status)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-600" />
            <span>Job Cards & Batch Panelization</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            MANAGE MASTER LOTS • SUB-JOB CARD SPLITTING • SERVER-SIDE QR CODE GENERATION
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Job Card from PO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 uppercase font-bold">Total Job Cards</p>
            <p className="text-2xl font-bold text-slate-900">{totalCards}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <Play className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 uppercase font-bold">In Production</p>
            <p className="text-2xl font-bold text-sky-600">{inProgressCards}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 uppercase font-bold">Pending Launch</p>
            <p className="text-2xl font-bold text-slate-900">{unlaunchedCards}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-500 uppercase font-bold">Completed Lots</p>
            <p className="text-2xl font-bold text-emerald-600">{completedCards}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Job Card No (JC001), PO No, or Product Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobCards()}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { label: 'All Statuses', val: 'ALL' },
            { label: 'Created / Unlaunched', val: 'CREATED' },
            { label: 'In Production', val: 'IN_PROGRESS' },
            { label: 'On Hold', val: 'ON_HOLD' },
            { label: 'Completed', val: 'COMPLETED' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.val
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchJobCards}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error / Loading / Table */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-12 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-mono font-bold">LOADING PRODUCTION JOB CARDS...</p>
        </div>
      ) : jobCards.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Job Cards Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No manufacturing job cards match your filter criteria. Click "Generate Job Card from PO" to launch new production orders.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 font-bold">
                  <th className="p-4">Job Card No</th>
                  <th className="p-4">Customer & PO</th>
                  <th className="p-4">Product & PCB Specs</th>
                  <th className="p-4 text-right">Total Qty</th>
                  <th className="p-4">Sub-Cards</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {jobCards.map((jc) => {
                  const isExpanded = expandedRow === jc.id;
                  const isUnlaunched = ['CREATED', 'NOT_LAUNCHED'].includes(jc.status);

                  return (
                    <React.Fragment key={jc.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold font-mono text-blue-600">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : jc.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <span>{jc.jobCardNo}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal pl-6">{new Date(jc.createdAt).toLocaleDateString()}</p>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-900">{jc.customerPO?.customer?.companyName || 'N/A'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 pl-6">PO: {jc.customerPO?.poNo}</p>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900">{jc.product?.code}</span>
                            <span className="text-slate-500">({jc.product?.specCardNo})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 pl-6">
                            {jc.product?.layers}L • {jc.product?.thickness} • {jc.product?.copper}
                          </p>
                        </td>

                        <td className="p-4 text-right font-bold font-mono text-slate-900">
                          {jc.totalQty.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">PCS</span>
                        </td>

                        <td className="p-4 font-mono text-slate-500 font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-600 font-bold mr-1">
                            {jc.subJobCards?.length || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">batches</span>
                        </td>

                        <td className="p-4">
                          {getStatusBadge(jc.status)}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenQrModal(jc)}
                              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 transition-all hover:text-blue-600 hover:border-blue-200"
                              title="Print / Download QR Stickers"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            {isUnlaunched && (
                              <button
                                onClick={() => handleOpenSplitModal(jc)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-bold transition-all flex items-center gap-1.5 text-xs"
                                title="Split into Sub-Job Cards"
                              >
                                <Split className="w-3.5 h-3.5" />
                                <span>Split</span>
                              </button>
                            )}

                            {isUnlaunched && (
                              <button
                                onClick={() => handleLaunchProduction(jc.id, jc.jobCardNo)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 text-xs"
                                title="Launch into Stage 1 Production"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Launch</span>
                              </button>
                            )}

                            {!isUnlaunched && (
                              <select
                                value={jc.status}
                                onChange={(e) => handleUpdateStatus(jc.id, e.target.value)}
                                className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                              >
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                                <option value="DISPATCHED">Dispatched</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-Job Card Grid */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={7} className="p-6">
                            <div className="space-y-3 pl-6 border-l-2 border-blue-300">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold font-mono text-blue-600 uppercase tracking-wider flex items-center gap-2">
                                  <Split className="w-4 h-4" />
                                  <span>Sub-Job Card Batch Hierarchy ({jc.subJobCards?.length || 0} Lots)</span>
                                </h4>
                                {isUnlaunched && (
                                  <button
                                    onClick={() => handleOpenSplitModal(jc)}
                                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Configure / Edit Batch Splits</span>
                                  </button>
                                )}
                              </div>

                              {(!jc.subJobCards || jc.subJobCards.length === 0) ? (
                                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs shadow-sm">
                                  No sub-job cards created yet. When launched, 1 primary sub-job card (<span className="font-mono font-bold text-blue-600">{jc.jobCardNo}-1</span>) will be generated automatically for the full {jc.totalQty} PCS.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {jc.subJobCards.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 relative overflow-hidden group hover:border-blue-300 transition-all shadow-sm"
                                    >
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold font-mono text-slate-900 text-xs">{sub.subJobCardNo}</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                          {sub.status}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-bold">Batch Qty:</span>
                                        <span className="font-bold font-mono text-blue-600">{sub.qty.toLocaleString()} PCS</span>
                                      </div>
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500 font-bold">Current Stage:</span>
                                        <span className="font-medium text-slate-900">
                                          {sub.currentStage?.name || 'Pending Launch'}
                                        </span>
                                      </div>
                                      <div className="pt-1 flex justify-end">
                                        <button
                                          onClick={() => handleOpenQrModal(jc)}
                                          className="text-[11px] text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1 transition-colors"
                                        >
                                          <QrCode className="w-3 h-3" />
                                          <span>View QR Sticker</span>
                                        </button>
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Generate Job Card from PO */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Generate Production Job Card</h3>
                  <p className="text-xs text-slate-500">Select an open Customer PO to launch manufacturing</p>
                </div>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-900 text-lg">✕</button>
            </div>

            <form onSubmit={handleGenerateJobCard} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 mb-1.5 font-bold">Select Open Purchase Order *</label>
                <select
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      <span className="text-slate-500 font-bold">Customer:</span>
                      <span className="font-bold text-slate-900">{po.customer.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Product Code:</span>
                      <span className="font-bold text-blue-600 font-mono">{po.product.code} ({po.product.specCardNo})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Total PO Quantity:</span>
                      <span className="font-bold font-mono text-slate-900">{po.orderQty.toLocaleString()} PCS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Required Delivery Date:</span>
                      <span className="text-slate-600 font-mono font-bold">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-[#965216] text-[11px] font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Generating a Job Card will assign a sequential Master Lot Number (<span className="font-mono font-bold">JC00X</span>), generate a unique barcode/QR payload, and set the PO status to <span className="font-mono">IN_PRODUCTION</span>.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPoId || generating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2"
                >
                  {generating && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  <span>{generating ? 'Generating...' : 'Generate Job Card'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Split Job Card */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Split Job Card into Sub-Cards</h3>
                  <p className="text-xs font-mono text-blue-600 font-bold">{showSplitModal.jobCardNo} • Total: {showSplitModal.totalQty.toLocaleString()} PCS</p>
                </div>
              </div>
              <button onClick={() => setShowSplitModal(null)} className="text-slate-400 hover:text-slate-900 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitSplit} className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {splitRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-xs font-mono font-bold text-blue-600 w-24">
                      {showSplitModal.jobCardNo}-{index + 1}
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter batch quantity..."
                      value={row.qty}
                      onChange={(e) => handleSplitRowChange(index, e.target.value)}
                      required
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 font-bold">PCS</span>
                    {splitRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSplitRow(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={addSplitRow}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Batch</span>
                </button>

                {(() => {
                  const sum = calculateSplitSum();
                  const diff = showSplitModal.totalQty - sum;
                  const isMatch = sum === showSplitModal.totalQty;
                  return (
                    <div className={`text-xs font-mono font-bold ${isMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Sum: {sum.toLocaleString()} / {showSplitModal.totalQty.toLocaleString()} PCS
                      {!isMatch && ` (${diff > 0 ? `${diff} left` : `+${Math.abs(diff)} over`})`}
                    </div>
                  );
                })()}
              </div>

              {splitError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-600 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{splitError}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 font-bold">
                Per AC-3.2: The sum of all sub-card quantities must strictly equal the parent job card's total quantity before production launch.
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={splitting || calculateSplitSum() !== showSplitModal.totalQty}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2"
                >
                  {splitting && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  <span>{splitting ? 'Splitting...' : 'Save Sub-Card Splits'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable QR Sticker Sheet */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Printable QR Code Barcode Stickers</h3>
                  <p className="text-xs font-mono text-slate-500">Lot Tracking Labels for Shop Floor Lots & Panels</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sticker Sheet</span>
                </button>
                <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-slate-900 text-lg px-2">✕</button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
              {loadingQrs ? (
                <div className="py-20 text-center text-slate-500">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs font-mono font-bold">GENERATING HIGH-RESOLUTION QR CODES...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Master Job Card Sticker */}
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-3">Master Lot Container Sticker</h4>
                    <div className="bg-white text-slate-950 rounded-xl p-4 max-w-sm border-2 border-slate-300 flex items-center gap-4 shadow-lg">
                      {showQrModal.parentQrUrl ? (
                        <img src={showQrModal.parentQrUrl} alt="Parent QR" className="w-28 h-28 shrink-0 border border-slate-200 rounded" />
                      ) : (
                        <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">No QR</div>
                      )}
                      <div className="space-y-1 overflow-hidden">
                        <div className="text-[10px] font-bold font-mono uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded inline-block">MASTER LOT</div>
                        <h5 className="font-black text-base font-mono leading-none">{showQrModal.jobCard.jobCardNo}</h5>
                        <p className="text-xs font-bold text-slate-800 truncate">{showQrModal.jobCard.product?.code}</p>
                        <p className="text-[11px] font-mono font-semibold text-amber-700">QTY: {showQrModal.jobCard.totalQty.toLocaleString()} PCS</p>
                        <p className="text-[9px] text-slate-500 font-mono">PO: {showQrModal.jobCard.customerPO?.poNo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Job Card Stickers Grid */}
                  {showQrModal.jobCard.subJobCards && showQrModal.jobCard.subJobCards.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-3">
                        Sub-Job Card Batch Stickers ({showQrModal.jobCard.subJobCards.length} Labels)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {showQrModal.jobCard.subJobCards.map((sub) => {
                          const qrUrl = showQrModal.subQrUrls?.[sub.id];
                          return (
                            <div key={sub.id} className="bg-white text-slate-950 rounded-xl p-3 border-2 border-slate-300 flex items-center gap-3 shadow">
                              {qrUrl ? (
                                <img src={qrUrl} alt="Sub QR" className="w-24 h-24 shrink-0 border border-slate-200 rounded" />
                              ) : (
                                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">No QR</div>
                              )}
                              <div className="space-y-1 overflow-hidden">
                                <div className="text-[9px] font-bold font-mono uppercase bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded inline-block">SUB BATCH</div>
                                <h5 className="font-black text-sm font-mono leading-none">{sub.subJobCardNo}</h5>
                                <p className="text-[11px] font-bold text-slate-800 truncate">{showQrModal.jobCard.product?.code}</p>
                                <p className="text-xs font-mono font-black text-amber-700">QTY: {sub.qty.toLocaleString()} PCS</p>
                                <p className="text-[9px] text-slate-500 font-mono truncate">Ref: {showQrModal.jobCard.jobCardNo}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
