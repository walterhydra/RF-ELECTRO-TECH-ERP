'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Scan, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  RefreshCw, 
  Layers, 
  Eye, 
  Sparkles,
  ChevronRight,
  Filter,
  UserCheck,
  Building2,
  Box,
  BarChart3,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { getApiBaseUrl } from '@/lib/utils';

// Process Flow PF-01 20 Predefined Stages (PDF Spec 14-09-2026)
const PF01_STAGES = [
  '1. SHEARING',
  '2. DRILLING',
  '3. DRL-QC',
  '4. DML',
  '5. PIT',
  '6. PIT-QC',
  '7. PLATING',
  '8. ETCHING',
  '9. PREMASK-QC/AOI',
  '10. PISM',
  '11. PISM-QC',
  '12. HASL',
  '13. HASL-QC',
  '14. LEGEND PRINT',
  '15. ROUTING',
  '16. VG',
  '17. BBT',
  '18. FQC (AI)',
  '19. PDI-AQL',
  '20. PACKING',
];

interface JobCard {
  id: string;
  jobCardNo: string;
  customerPartNo: string;
  rfePartCode: string;
  customerCode: string;
  targetDate: string;
  priority: 'MOST URGENT' | 'HIGH' | 'NORMAL';
  prodPnlQty: number;
  custPnlQty: number;
  totalPcbQty: number;
  prodPnlAreaSqm: number;
  custPnlAreaSqm: number;
  currentStageIndex: number;
  currentStageName: string;
  status: 'UNLAUNCHED' | 'IN_PROGRESS' | 'COMPLETED';
  photoUrl?: string;
  createdAt: string;
}

const SAMPLE_ACTIVE_JOBS: JobCard[] = [
  {
    id: 'jc-1',
    jobCardNo: '26-27-1729',
    customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
    rfePartCode: 'D3625',
    customerCode: 'CUST-RF045',
    targetDate: '2026-09-08',
    priority: 'MOST URGENT',
    prodPnlQty: 40,
    custPnlQty: 80,
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    custPnlAreaSqm: 45,
    currentStageIndex: 1,
    currentStageName: '2. DRILLING',
    status: 'IN_PROGRESS',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'jc-2',
    jobCardNo: '26-27-1730',
    customerPartNo: 'PSU-3KW-BOOSTER-REV03',
    rfePartCode: 'D3633',
    customerCode: 'CUST-RF019',
    targetDate: '2026-09-20',
    priority: 'HIGH',
    prodPnlQty: 60,
    custPnlQty: 120,
    totalPcbQty: 240,
    prodPnlAreaSqm: 75,
    custPnlAreaSqm: 68,
    currentStageIndex: 0,
    currentStageName: '1. SHEARING',
    status: 'IN_PROGRESS',
    photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
    createdAt: '2026-09-03T11:20:00Z',
  },
];

const LOCAL_STORAGE_CARDS_KEY = 'rf_electro_job_cards_v3';

const getStoredJobCards = (): JobCard[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse error
  }
  return null;
};

const saveJobCardsToStorage = (cards: JobCard[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(cards));
  } catch (err) {
    console.warn('Failed to persist job cards to localStorage', err);
  }
};

const getDeletedJobCardIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('erp_deleted_job_card_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function JobMovementUpdatePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [userRole, setUserRole] = useState<'MASTER' | 'SUPER_USER' | 'NORMAL'>('MASTER');
  const [assignedStage, setAssignedStage] = useState<string>('2. DRILLING');
  const [toast, setToast] = useState<string | null>(null);

  // Load stored job cards from localStorage after client mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const deleted = getDeletedJobCardIds();
    const stored = getStoredJobCards();
    if (stored !== null) {
      setJobs(stored.filter((j) => !deleted.includes(j.id) && !deleted.includes(j.jobCardNo)));
    } else {
      setJobs(SAMPLE_ACTIVE_JOBS.filter((j) => !deleted.includes(j.id) && !deleted.includes(j.jobCardNo)));
    }
  }, []);

  // Save jobs to localStorage whenever state updates (only after mount)
  useEffect(() => {
    if (isMounted) {
      saveJobCardsToStorage(jobs);
    }
  }, [jobs, isMounted]);

  // Movement Modal Options State
  const [movementTab, setMovementTab] = useState<'VIEW' | 'FULL' | 'PARTIAL'>('VIEW');
  const [remarkCategory, setRemarkCategory] = useState<string>('Clear Movement');
  const [remarksText, setRemarksText] = useState<string>('');
  const [rejectedPcbQtyInput, setRejectedPcbQtyInput] = useState<number | string>(0);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [partialQty, setPartialQty] = useState<number | string>(35);
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);

  const fetchMovementJobs = React.useCallback(() => {
    fetch(`${getApiBaseUrl()}/job-cards`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const deleted = getDeletedJobCardIds();
          const mapped: JobCard[] = data.flatMap((j: any) => {
            const masterPcbQty = j.totalPcbQty || j.custPnlQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 160);
            const masterAreaSqm = j.custPnlAreaSqm || j.prodPnlAreaSqm || 45;

            if (j.subJobCards && j.subJobCards.length > 0) {
              return j.subJobCards.map((sub: any) => {
                const subPcbQty = sub.totalPcbQty || sub.qty || masterPcbQty;
                const subAreaSqm = sub.custPnlAreaSqm || sub.prodPnlAreaSqm || masterAreaSqm;
                const rawStage = sub.currentStage?.name || j.currentStageName || PF01_STAGES[0];
                const stageIdx = PF01_STAGES.findIndex(
                  (s) => s.toLowerCase() === rawStage.toLowerCase() || s.toLowerCase().includes(rawStage.toLowerCase()) || rawStage.toLowerCase().includes(s.toLowerCase())
                );

                return {
                  id: sub.id,
                  jobCardNo: j.jobCardNo || sub.subJobCardNo,
                  photoUrl: j.photoUrl || '',
                  customerPartNo: j.customerPartNo || j.product?.code || 'EV-900W-WP-TO247',
                  rfePartCode: j.rfePartCode || j.product?.specCardNo || 'D3625',
                  customerCode: j.customerCode || j.customerPO?.customer?.code || 'CUST-RF045',
                  targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '2026-09-28',
                  priority: j.priority || 'NORMAL',
                  prodPnlQty: Math.ceil(subPcbQty / 4),
                  custPnlQty: subPcbQty,
                  totalPcbQty: subPcbQty,
                  prodPnlAreaSqm: subAreaSqm,
                  custPnlAreaSqm: subAreaSqm,
                  currentStageIndex: stageIdx >= 0 ? stageIdx : 0,
                  currentStageName: stageIdx >= 0 ? PF01_STAGES[stageIdx] : rawStage,
                  status: sub.status === 'CREATED' ? 'UNLAUNCHED' : sub.status || j.status,
                  createdAt: j.createdAt,
                };
              });
            }

            const rawStage = j.subJobCards?.[0]?.currentStage?.name || j.currentStageName || j.currentStage?.name || PF01_STAGES[0];
            const stageIdx = PF01_STAGES.findIndex(
              (s) => s.toLowerCase() === rawStage.toLowerCase() || s.toLowerCase().includes(rawStage.toLowerCase()) || rawStage.toLowerCase().includes(s.toLowerCase())
            );

            return [{
              id: j.id,
              jobCardNo: j.jobCardNo,
              photoUrl: j.photoUrl || '',
              customerPartNo: j.customerPartNo || j.product?.code || 'EV-900W-WP-TO247',
              rfePartCode: j.rfePartCode || j.product?.specCardNo || 'D3625',
              customerCode: j.customerCode || j.customerPO?.customer?.code || 'CUST-RF045',
              targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '2026-09-28',
              priority: j.priority || 'NORMAL',
              prodPnlQty: Math.ceil(masterPcbQty / 4),
              custPnlQty: masterPcbQty,
              totalPcbQty: masterPcbQty,
              prodPnlAreaSqm: masterAreaSqm,
              custPnlAreaSqm: masterAreaSqm,
              currentStageIndex: stageIdx >= 0 ? stageIdx : 0,
              currentStageName: stageIdx >= 0 ? PF01_STAGES[stageIdx] : rawStage,
              status: j.status === 'CREATED' ? 'UNLAUNCHED' : j.status,
              createdAt: j.createdAt,
            }];
          }).filter((j: JobCard) => !deleted.includes(j.id) && !deleted.includes(j.jobCardNo));

          setJobs(mapped);
          saveJobCardsToStorage(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMovementJobs();
    const interval = setInterval(fetchMovementJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchMovementJobs]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const isOverdue = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    return target < today;
  };

  const canUserMoveStage = (jobStageName: string) => {
    if (userRole === 'MASTER' || userRole === 'SUPER_USER') return true;
    if (userRole === 'NORMAL') {
      return jobStageName.trim().toLowerCase() === assignedStage.trim().toLowerCase();
    }
    return false;
  };

  const handleAdvanceStage = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      setSelectedJob(targetJob);
    }
  };

  const handleFullJobMovement = async () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    if (!canUserMoveStage(selectedJob.currentStageName)) {
      showToastMsg(`Permission Denied: Operator assigned to "${assignedStage}" cannot move jobs out of "${selectedJob.currentStageName}".`);
      return;
    }

    const currentPcbQty = selectedJob.totalPcbQty || 160;
    const currentSqmArea = selectedJob.prodPnlAreaSqm || 45;
    const sqmPerPcb = currentPcbQty > 0 ? currentSqmArea / currentPcbQty : 0;

    const parsedRejection = typeof rejectedPcbQtyInput === 'number' ? rejectedPcbQtyInput : parseInt(String(rejectedPcbQtyInput), 10) || 0;

    const actualRejected = Math.min(Math.max(0, parsedRejection), currentPcbQty);
    const forwardedPcbQty = Math.max(0, currentPcbQty - actualRejected);
    const nextStageSqm = Number((forwardedPcbQty * sqmPerPcb).toFixed(2));
    const effectiveReason = rejectionReasonInput || remarksText || 'Stage Movement';

    if (actualRejected > 0 && !effectiveReason.trim()) {
      showToastMsg('Mandatory Rejection Remark required when rejecting PCBs.');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${getApiBaseUrl()}/job-cards/${jobId}/move-stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rejectPcbQty: actualRejected,
          remark: actualRejected > 0
            ? `Rejection: ${actualRejected} PCBs rejected. Reason: ${effectiveReason}`
            : `${remarkCategory}: ${remarksText || 'Clear Movement'}`,
          remarkType: actualRejected > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
        }),
      });
    } catch (e) {
      console.warn('Backend API unavailable, using local state fallback');
    }

    const currentIndex = PF01_STAGES.indexOf(selectedJob.currentStageName);
    const nextIndex = Math.min(currentIndex + 1, PF01_STAGES.length - 1);
    const nextStageName = PF01_STAGES[nextIndex];

    showToastMsg(
      actualRejected > 0
        ? `Job ${selectedJob.jobCardNo}: ${forwardedPcbQty} PCBs moved to ${nextStageName} (${actualRejected} Rejected, Next Area: ${nextStageSqm} Sqm).`
        : `Full Movement: Job ${selectedJob.jobCardNo} moved to Stage ${nextStageName}`
    );

    await fetchMovementJobs();
    setSelectedJob(null);
    setRejectedPcbQtyInput(0);
    setRejectionReasonInput('');
    setRemarksText('');
  };

  const handleJobDispatch = async (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${getApiBaseUrl()}/job-cards/${jobId}/move-stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          remark: 'Direct Job Dispatch from Packing stage',
        }),
      });
    } catch (e) {
      console.warn('Backend API unavailable');
    }

    await fetchMovementJobs();
    showToastMsg(`🚚 Job ${targetJob.jobCardNo} successfully Dispatched & Marked Completed!`);
    setSelectedJob(null);
  };

  const [pendingWorkReason, setPendingWorkReason] = useState<string>('Drilling & Hole Check Pending');
  const [customPendingReason, setCustomPendingReason] = useState<string>('');

  const handlePartialJobMovement = async () => {
    if (!selectedJob) return;
    if (!canUserMoveStage(selectedJob.currentStageName)) {
      showToastMsg(`Permission Denied: Operator assigned to "${assignedStage}" cannot move jobs out of "${selectedJob.currentStageName}".`);
      return;
    }

    const maxPcbQty = selectedJob.totalPcbQty || 160;
    const parsedMoveQty = typeof partialQty === 'number' ? partialQty : (parseInt(String(partialQty), 10) || 0);

    if (parsedMoveQty <= 0 || parsedMoveQty >= maxPcbQty) {
      showToastMsg(`Partial quantity must be between 1 and ${maxPcbQty - 1} PCBs`);
      return;
    }

    const totalArea = selectedJob.prodPnlAreaSqm || 45;
    const sqmPerPcb = maxPcbQty > 0 ? totalArea / maxPcbQty : 0;
    const sqmMoved = Number((parsedMoveQty * sqmPerPcb).toFixed(2));
    const remPcb = Math.max(0, maxPcbQty - parsedMoveQty);
    const remArea = Number(Math.max(0, totalArea - sqmMoved).toFixed(2));
    const effectiveReason = pendingWorkReason === 'Other / Custom Pending Reason' ? (customPendingReason || 'Pending PCB Work') : pendingWorkReason;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${getApiBaseUrl()}/job-cards/${selectedJob.id}/move-partial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          qtyToMove: parsedMoveQty,
          areaToMove: sqmMoved,
          pendingWorkReason: effectiveReason,
          remark: remarksText ? `${effectiveReason} • ${remarksText}` : `Incomplete Movement: ${effectiveReason}`,
          remarkType: 'INCOMPLETE_MOVEMENT',
        }),
      });
    } catch (e) {
      console.warn('Backend API unavailable, using local state fallback');
    }

    const currentIndex = PF01_STAGES.indexOf(selectedJob.currentStageName);
    const nextIndex = Math.min(currentIndex + 1, PF01_STAGES.length - 1);
    const nextStageName = PF01_STAGES[nextIndex];

    showToastMsg(
      `Partial Movement: Moved ${parsedMoveQty} PCBs of Job Card ${selectedJob.jobCardNo} to ${nextStageName} (${sqmMoved} Sqm). ${remPcb} PCBs remain at ${selectedJob.currentStageName} (${remArea} Sqm).`
    );

    await fetchMovementJobs();
    setSelectedJob(null);
    setPartialQty(0);
    setRemarksText('');
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      j.jobCardNo.toLowerCase().includes(q) ||
      j.customerPartNo.toLowerCase().includes(q) ||
      j.rfePartCode.toLowerCase().includes(q) ||
      j.customerCode.toLowerCase().includes(q) ||
      j.currentStageName.toLowerCase().includes(q)
    );
  });
  const [barcodeInput, setBarcodeInput] = useState('');

  const [multiLotCandidates, setMultiLotCandidates] = useState<JobCard[]>([]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    // Search for matches in active jobs (exact or prefix matching for job card no or sub-lot no)
    const matches = jobs.filter(
      (j) =>
        j.jobCardNo.toLowerCase() === raw.toLowerCase() ||
        j.id.toLowerCase() === raw.toLowerCase() ||
        raw.toLowerCase().includes(j.jobCardNo.toLowerCase()) ||
        j.jobCardNo.toLowerCase().includes(raw.toLowerCase())
    );

    if (matches.length === 1) {
      setSelectedJob(matches[0]);
      setMovementTab('VIEW');
      setBarcodeInput('');
      showToastMsg(`Scanned Barcode: Job ${matches[0].jobCardNo} Opened Immediately!`);
    } else if (matches.length > 1) {
      // Multiple active lots found for this Job Card No (from partial movements)
      setMultiLotCandidates(matches);
      setBarcodeInput('');
    } else {
      showToastMsg(`No job found for scanned code: "${raw}"`);
    }
  };

  const handleSelectCandidateLot = (candidate: JobCard) => {
    setSelectedJob(candidate);
    setMultiLotCandidates([]);
    setMovementTab('VIEW');
    showToastMsg(`Selected Lot ${candidate.jobCardNo} at ${candidate.currentStageName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/job-cards"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Job Update & Movement Center
            </h1>
            <p className="text-xs text-slate-400 font-mono">Live PCB Production Floor Monitoring & Stage Movement</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Role selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <select
              value={userRole}
              onChange={(e: any) => setUserRole(e.target.value)}
              className="bg-transparent font-bold text-white outline-none cursor-pointer text-xs"
            >
              <option value="MASTER">Master (Full Access)</option>
              <option value="SUPER_USER">Super User</option>
              <option value="NORMAL">Operator</option>
            </select>
          </div>

          <Link
            href="/job-cards/launch"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
          >
            + Launch New Job
          </Link>
        </div>
      </div>

      {/* Barcode Gun Scanner Box (Faster Job Movement without manual entry) */}
      <div className="bg-slate-900 border-2 border-amber-500/40 p-4 rounded-3xl space-y-2 shadow-2xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider font-mono">
            <Scan className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>BARCODE SCANNER / FAST JOB MOVEMENT (USB / GUN SCANNER READY)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono font-bold">Scan Barcode Code128 (e.g. 26-27-1729)</span>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan Barcode here or type Job Card No (e.g. 26-27-1729)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Scan className="w-4 h-4" />
            <span>SCAN BARCODE</span>
          </button>
        </form>
      </div>

      {/* Global Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Job Card No, Part Code, Customer, or Stage..."
          className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 px-2 font-bold hover:text-white">
            Clear
          </button>
        )}
      </div>

      {/* Active Jobs Grid (Desktop & Mobile Responsive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-3xl font-mono text-sm">
            No active jobs found matching search filter.
          </div>
        ) : (
          filteredJobs.map((j) => {
            const overdue = isOverdue(j.targetDate);
            const stageIndex = PF01_STAGES.indexOf(j.currentStageName);
            const progressPct = Math.round(((stageIndex + 1) / PF01_STAGES.length) * 100);

            return (
              <div
                key={j.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                {/* Header Row: Job No & Priority */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">JOB NUMBER</span>
                    <h3 className="text-base font-black text-amber-400 font-mono tracking-tight">{j.jobCardNo}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {overdue ? (
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 font-black text-[10px] rounded-lg border border-rose-500/30 font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 animate-pulse" /> OVERDUE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-black text-[10px] rounded-lg border border-emerald-500/30 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ON SCHEDULE
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider font-mono ${
                        j.priority === 'MOST URGENT'
                          ? 'bg-rose-500 text-white'
                          : j.priority === 'HIGH'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {j.priority}
                    </span>
                  </div>
                </div>

                {/* Main Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">PART CODE / PRODUCT</span>
                    <span className="font-mono font-bold text-white block truncate" title={j.rfePartCode}>{j.rfePartCode}</span>
                    <span className="text-[11px] text-slate-400 truncate block">{j.customerPartNo}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">CUSTOMER</span>
                    <span className="font-bold text-slate-200 block truncate">{j.customerCode}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">QUANTITY</span>
                    <span className="font-black text-amber-300 font-mono">{j.totalPcbQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 160)} PCBs</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">AREA (SQM)</span>
                    <span className="font-black text-emerald-400 font-mono">{j.prodPnlAreaSqm} Sqm</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">TARGET DATE</span>
                    <span className={`font-mono font-bold ${overdue ? 'text-rose-400' : 'text-slate-300'}`}>
                      {j.targetDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">CURRENT STAGE</span>
                    <span className="font-black text-blue-400 font-mono truncate block">{j.currentStageName}</span>
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400">Progress: Stage {stageIndex + 1} of {PF01_STAGES.length}</span>
                    <span className="text-amber-400">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedJob(j)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>View & Move Stage</span>
                  </button>

                  {j.currentStageName.includes('PACKING') || stageIndex === PF01_STAGES.length - 1 ? (
                    <button
                      onClick={() => handleJobDispatch(j.id)}
                      className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0 animate-pulse"
                    >
                      <span>🚚 Job Dispatch</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdvanceStage(j.id)}
                      className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <span>Next Stage</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* View & Stage Movement Modal with Options A, B, C */}
      {selectedJob && (
        <Portal>
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-100 relative my-auto">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">JOB SELECTION & STAGE MOVEMENT</span>
                  <h3 className="text-lg font-black text-amber-400 font-mono flex items-center gap-2">
                    <span>{selectedJob.jobCardNo}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 font-normal rounded-md border border-slate-700">
                      Stage: {selectedJob.currentStageName}
                    </span>
                  </h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
              </div>

              {/* Movement Options Tabs: A, B, C */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  onClick={() => setMovementTab('VIEW')}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all ${
                    movementTab === 'VIEW' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A. Job Card View
                </button>
                <button
                  onClick={() => setMovementTab('FULL')}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all ${
                    movementTab === 'FULL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B. Full Movement
                </button>
                <button
                  onClick={() => setMovementTab('PARTIAL')}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all ${
                    movementTab === 'PARTIAL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  C. Uncompleted / Split
                </button>
              </div>

              {/* TAB A: JOB CARD VIEW */}
              {movementTab === 'VIEW' && (
                <div className="space-y-4 text-xs">
                  {selectedJob.photoUrl && (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedJob.photoUrl}
                          alt="Job Card Original Photo"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow-md cursor-pointer"
                          onClick={() => setPhotoLightbox(selectedJob.photoUrl || null)}
                        />
                        <div>
                          <p className="font-extrabold text-white text-xs">Original Physical Job Card Photo</p>
                          <p className="text-[10px] text-slate-400">Uploaded during Job Launching</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPhotoLightbox(selectedJob.photoUrl || null)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Photo
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-sans">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Job Card No:</span>
                      <strong className="font-mono text-amber-400 text-sm">{selectedJob.jobCardNo}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Current Stage:</span>
                      <strong className="font-mono text-blue-400 font-bold">{selectedJob.currentStageName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Customer Part No:</span>
                      <strong className="text-white font-medium">{selectedJob.customerPartNo}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">R.F.E. Part Code:</span>
                      <strong className="font-mono text-amber-300">{selectedJob.rfePartCode}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Customer Code:</span>
                      <strong className="text-slate-200">{selectedJob.customerCode}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Priority:</span>
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">{selectedJob.priority}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Target Delivery Date:</span>
                      <strong className="font-mono text-slate-200">{selectedJob.targetDate}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Total PCB Quantity:</span>
                      <strong className="font-mono text-emerald-400 font-bold">{selectedJob.totalPcbQty || (selectedJob.prodPnlQty ? selectedJob.prodPnlQty * 4 : 160)} PCBs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Production WIP Area:</span>
                      <strong className="font-mono text-emerald-400 font-bold">{selectedJob.prodPnlAreaSqm} Sqm</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB B: FULL MOVEMENT */}
              {movementTab === 'FULL' && (() => {
                const currentPcbQty = selectedJob.totalPcbQty || 160;
                const currentArea = selectedJob.prodPnlAreaSqm || 45;
                const sqmPerPcb = currentPcbQty > 0 ? currentArea / currentPcbQty : 0;

                const parsedRejection = typeof rejectedPcbQtyInput === 'number'
                  ? rejectedPcbQtyInput
                  : (parseInt(String(rejectedPcbQtyInput), 10) || 0);

                const actualRejected = Math.min(Math.max(0, parsedRejection), currentPcbQty);
                const forwardedPcbQty = Math.max(0, currentPcbQty - actualRejected);
                const nextStageSqm = Number((forwardedPcbQty * sqmPerPcb).toFixed(2));
                const isPackingStage = selectedJob.currentStageName.includes('PACKING') || selectedJob.currentStageIndex === PF01_STAGES.length - 1;

                return (
                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-blue-950/70 border border-blue-800/80 p-4 rounded-2xl text-blue-200 space-y-2">
                      <p className="font-bold text-white text-xs">Full Job Movement Confirmation</p>
                      <p className="text-xs leading-relaxed text-blue-100">
                        Move Job Card No. <strong className="text-amber-300 font-mono">{selectedJob.jobCardNo}</strong> to the next process.
                      </p>
                      <div className="mt-2 text-xs font-extrabold text-blue-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-blue-800 inline-block font-mono">
                        Current Stage: {selectedJob.currentStageName} ➔ Next Stage: {PF01_STAGES[selectedJob.currentStageIndex + 1] || '20. PACKING (COMPLETED)'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-xs font-bold text-rose-400 mb-1">Rejection PCB Quantity (if any):</label>
                        <input
                          type="number"
                          min={0}
                          max={currentPcbQty}
                          value={rejectedPcbQtyInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setRejectedPcbQtyInput('');
                            } else {
                              const val = parseInt(raw, 10);
                              setRejectedPcbQtyInput(isNaN(val) ? 0 : Math.min(Math.max(0, val), currentPcbQty));
                            }
                          }}
                          className="w-full bg-slate-900 border border-rose-600/50 rounded-xl px-3 py-2 text-xs font-bold text-rose-300 font-mono focus:outline-none focus:border-rose-400"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Movement Category *</label>
                        <select
                          value={remarkCategory}
                          onChange={(e) => setRemarkCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Clear Movement">Clear Movement (No issues)</option>
                          <option value="Rejection">Rejection</option>
                          <option value="Rework">Rework</option>
                          <option value="Process issue">Process issue</option>
                          <option value="Other relevant movement remarks">Other relevant movement remarks</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {actualRejected > 0 ? 'Mandatory Rejection Remark *' : 'Remarks Details (Optional)'}
                        </label>
                        <textarea
                          rows={2}
                          value={rejectionReasonInput}
                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                          placeholder={actualRejected > 0 ? 'Specify rejection defect, cause, or operator notes...' : 'Enter optional stage movement remarks...'}
                          className={`w-full bg-slate-900 border rounded-xl p-2.5 text-xs text-white focus:outline-none ${
                            actualRejected > 0 ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-amber-400'
                          }`}
                        />
                      </div>

                      {/* Live Calculation Preview */}
                      <div className="col-span-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-[11px] font-mono">
                        <div>
                          <span className="text-slate-400 block">Forwarded to Next Stage:</span>
                          <span className="text-emerald-400 font-black text-sm">{forwardedPcbQty} PCBs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Next Stage Area:</span>
                          <span className="text-emerald-300 font-black text-sm">{nextStageSqm} Sqm</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Deducted Rejections:</span>
                          <span className={`${actualRejected > 0 ? 'text-rose-400 font-black' : 'text-slate-500'} text-sm`}>{actualRejected} PCBs</span>
                        </div>
                      </div>
                    </div>

                    {isPackingStage ? (
                      <button
                        onClick={() => handleJobDispatch(selectedJob.id)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>🚚 CONFIRM JOB DISPATCH & COMPLETE ({forwardedPcbQty} PCBs)</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFullJobMovement}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>CONFIRM FULL MOVEMENT ({forwardedPcbQty} PCBs ➔ Next Stage)</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* TAB C: UNCOMPLETED / SPLIT MOVEMENT */}
              {movementTab === 'PARTIAL' && (() => {
                const masterPcb = selectedJob.totalPcbQty || selectedJob.custPnlQty || 160;
                const parsedMoveQty = typeof partialQty === 'number' ? partialQty : (parseInt(String(partialQty), 10) || 0);
                const movedPcb = parsedMoveQty > 0 ? Math.min(parsedMoveQty, masterPcb - 1) : 0;
                const remPcb = Math.max(0, masterPcb - movedPcb);

                return (
                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-amber-950/40 border border-amber-800/80 p-3.5 rounded-2xl text-amber-200 space-y-1">
                      <p className="font-extrabold text-amber-300">Uncompleted / Partial Job Movement (PCB Split)</p>
                      <p className="text-[11px] text-amber-200/80">Move partial PCB quantity forward while maintaining balance PCBs at current stage with exact pending work reason.</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-300">Quantity Ready to Move Forward (PCBs):</label>
                          <span className="text-xs font-bold text-amber-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            = {movedPcb} PCBs
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={masterPcb - 1}
                          value={partialQty}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setPartialQty('');
                            } else {
                              const parsed = parseInt(raw, 10);
                              setPartialQty(isNaN(parsed) ? '' : Math.min(parsed, masterPcb - 1));
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 font-mono"
                          placeholder={`Enter PCBs (1 to ${masterPcb - 1})`}
                        />
                        {parsedMoveQty >= masterPcb && (
                          <p className="text-[11px] text-rose-400 font-bold mt-1">
                            ⚠ Quantity cannot exceed {masterPcb - 1} PCBs (Total Lot: {masterPcb} PCBs).
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">Pending Work Reason:</label>
                        <select
                          value={pendingWorkReason}
                          onChange={(e) => setPendingWorkReason(e.target.value)}
                          className="w-full bg-slate-900 border border-amber-600/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                        >
                          <option value="Drilling & Hole Check Pending">Drilling & Hole Check Pending</option>
                          <option value="Solder Mask Touch-Up Required">Solder Mask Touch-Up Required</option>
                          <option value="Legend Reprint Pending">Legend Reprint Pending</option>
                          <option value="V-Cut / Edge Chamfer Pending">V-Cut / Edge Chamfer Pending</option>
                          <option value="FQC AI Re-Inspection Required">FQC AI Re-Inspection Required</option>
                          <option value="Copper Plating Thickness Check Pending">Copper Plating Thickness Check Pending</option>
                          <option value="Etching / Track Touch-up Pending">Etching / Track Touch-up Pending</option>
                          <option value="Other / Custom Pending Reason">Other / Custom Pending Reason</option>
                        </select>
                      </div>

                      {pendingWorkReason === 'Other / Custom Pending Reason' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Specify Custom Pending Reason:</label>
                          <input
                            type="text"
                            placeholder="e.g. Special Gold Finger Plating Inspection Pending"
                            value={customPendingReason}
                            onChange={(e) => setCustomPendingReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Incomplete Movement Remarks / Work Notes:</label>
                        <textarea
                          rows={2}
                          placeholder="Enter specific details regarding pending work, lot condition, or operator remarks..."
                          value={remarksText}
                          onChange={(e) => setRemarksText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-emerald-950/50 border border-emerald-800/80 p-3 rounded-xl text-emerald-300">
                          <div className="font-bold">Next Stage: {PF01_STAGES[selectedJob.currentStageIndex + 1]}</div>
                          <div className="text-xs font-extrabold text-emerald-400 mt-1">{movedPcb} PCBs Moved</div>
                        </div>
                        <div className="bg-amber-950/50 border border-amber-800/80 p-3 rounded-xl text-amber-300">
                          <div className="font-bold">Stays at: {selectedJob.currentStageName}</div>
                          <div className="text-xs font-extrabold text-amber-400 mt-1">{remPcb} PCBs Balance</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePartialJobMovement}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                    >
                      CONFIRM PARTIAL MOVEMENT ({movedPcb} PCBs Forward • {remPcb} PCBs Balance)
                    </button>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </Portal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-emerald-400 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {photoLightbox && (
        <Portal>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl max-w-3xl w-full space-y-3 relative shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-extrabold text-sm text-white font-mono">Verification of Original Physical Job Card Photo</span>
                <button onClick={() => setPhotoLightbox(null)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black rounded-2xl p-2">
                <img src={photoLightbox} alt="Original Job Card" className="max-h-[70vh] w-auto object-contain rounded-xl" />
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
