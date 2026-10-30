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
  ShieldAlert,
  Camera,
  Zap,
  QrCode,
  Barcode,
  Split,
  X,
  ImageIcon
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { getApiBaseUrl, fetchApi } from '@/lib/utils';
import { parseScannedJobCode } from '@/components/scanner/LiveCameraScannerModal';

// Process Flow PF-01 19 Predefined Stages (Matching Database ProcessStage Master)
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
  '12. LEGEND PRINT',
  '13. HASL',
  '14. HASL-QC',
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
  rejectedPcbQty?: number;
  createdAt: string;
}


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
  const [assignedStage, setAssignedStage] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);

  // Load stored job cards and user role/stage from localStorage
  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredJobCards();
    if (stored !== null && Array.isArray(stored)) {
      setJobs(stored);
    }
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      const storedStage = localStorage.getItem('assignedStage');
      if (storedStage) {
        setAssignedStage(storedStage);
      } else {
        setAssignedStage('ALL');
      }
      const hasAssignedStage = Boolean(storedStage && storedStage.toUpperCase() !== 'ALL');
      if (hasAssignedStage) {
        setUserRole('NORMAL');
      } else if (storedRole) {
        const upper = storedRole.toUpperCase();
        if (upper.includes('SUPER') || upper.includes('MASTER') || upper.includes('ADMIN')) {
          setUserRole('MASTER');
        } else if (upper.includes('PROD') || upper.includes('PLANNER') || upper.includes('MANAGER')) {
          setUserRole('SUPER_USER');
        } else {
          setUserRole('NORMAL');
        }
      }
    }
  }, []);

  // Save jobs to localStorage whenever state updates (only when server returns data)
  useEffect(() => {
    if (isMounted && jobs.length > 0) {
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

  const inFlightMovements = React.useRef<Map<string, { stageIdx: number; stageName: string; timestamp: number }>>(new Map());

  const fetchMovementJobs = React.useCallback(() => {
    const storedStage = typeof window !== 'undefined' ? localStorage.getItem('assignedStage') || assignedStage : assignedStage;
    const stageQuery = (storedStage && storedStage.toUpperCase() !== 'ALL') ? `?stage=${encodeURIComponent(storedStage)}` : '';
    fetchApi(`/job-cards${stageQuery}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: JobCard[] = data.flatMap((j: any) => {
            const masterPcbQty = j.totalPcbQty || j.custPnlQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 160);
            const masterAreaSqm = j.custPnlAreaSqm || j.prodPnlAreaSqm || 45;

            if (j.subJobCards && j.subJobCards.length > 0) {
              const mappedSubs: JobCard[] = j.subJobCards.map((sub: any) => {
                const subPcbQty = sub.totalPcbQty || sub.qty || masterPcbQty;
                const subAreaSqm = sub.custPnlAreaSqm || sub.prodPnlAreaSqm || masterAreaSqm;
                const rawStage = sub.currentStage?.name || j.currentStageName || PF01_STAGES[0];
                let stageIdx = sub.currentStage?.defaultOrder
                  ? Math.min(Math.max(0, sub.currentStage.defaultOrder - 1), 19)
                  : PF01_STAGES.findIndex((s) => s.toLowerCase() === rawStage.toLowerCase());
                if (stageIdx < 0) stageIdx = 0;

                return {
                  id: sub.id,
                  jobCardNo: sub.subJobCardNo || j.jobCardNo,
                  customerPartNo: j.customerPartNo || j.product?.code || '—',
                  rfePartCode: j.rfePartCode || j.product?.specCardNo || '—',
                  customerCode: j.customerCode || j.customerPO?.customer?.code || '—',
                  targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '—',
                  priority: j.priority || 'NORMAL',
                  prodPnlQty: Math.ceil(subPcbQty / 4),
                  custPnlQty: subPcbQty,
                  totalPcbQty: subPcbQty,
                  prodPnlAreaSqm: subAreaSqm,
                  custPnlAreaSqm: subAreaSqm,
                  currentStageIndex: stageIdx,
                  currentStageName: PF01_STAGES[stageIdx] || rawStage,
                  status: sub.status === 'CREATED' ? 'UNLAUNCHED' : sub.status,
                  createdAt: j.createdAt,
                };
              });

              // Consolidate sub-lots of the same job card at the same stage
              const stageMap = new Map<string, JobCard>();
              mappedSubs.forEach((item) => {
                const groupKey = `${item.currentStageIndex}-${item.status}`;
                const existing = stageMap.get(groupKey);
                if (existing) {
                  const combinedQty = (existing.totalPcbQty || 0) + (item.totalPcbQty || 0);
                  const combinedArea = Number(((existing.custPnlAreaSqm || 0) + (item.custPnlAreaSqm || 0)).toFixed(2));
                  stageMap.set(groupKey, {
                    ...existing,
                    totalPcbQty: combinedQty,
                    custPnlQty: combinedQty,
                    prodPnlQty: Math.ceil(combinedQty / 4),
                    custPnlAreaSqm: combinedArea,
                    prodPnlAreaSqm: combinedArea,
                  });
                } else {
                  stageMap.set(groupKey, item);
                }
              });

              return Array.from(stageMap.values());
            }

            const rawStage = j.currentStageName || j.currentStage?.name || PF01_STAGES[0];
            let stageIdx = PF01_STAGES.findIndex((s) => s.toLowerCase() === rawStage.toLowerCase());
            if (stageIdx < 0) stageIdx = 0;

            return [{
              id: j.id,
              jobCardNo: j.jobCardNo,
              customerPartNo: j.customerPartNo || j.product?.code || '—',
              rfePartCode: j.rfePartCode || j.product?.specCardNo || '—',
              customerCode: j.customerCode || j.customerPO?.customer?.code || '—',
              targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '—',
              priority: j.priority || 'NORMAL',
              prodPnlQty: Math.ceil(masterPcbQty / 4),
              custPnlQty: masterPcbQty,
              totalPcbQty: masterPcbQty,
              prodPnlAreaSqm: masterAreaSqm,
              custPnlAreaSqm: masterAreaSqm,
              currentStageIndex: stageIdx,
              currentStageName: PF01_STAGES[stageIdx] || rawStage,
              status: j.status === 'CREATED' ? 'UNLAUNCHED' : j.status,
              createdAt: j.createdAt,
            }];

          });

          setJobs((prev) => {
            if (prev.length === 0) {
              saveJobCardsToStorage(mapped);
              return mapped;
            }

            // Clean up expired in-flight entries (older than 30s)
            const now = Date.now();
            inFlightMovements.current.forEach((val, key) => {
              if (now - val.timestamp > 30000) inFlightMovements.current.delete(key);
            });

            // If server now has 2 or more sub-cards for a job, clean up temporary in-flight optimistic lot
            mapped.forEach((m) => {
              const baseJc = m.jobCardNo.replace(/-[A-Z]$/, '');
              const matchingServerCards = mapped.filter((c) => c.jobCardNo.startsWith(baseJc));
              if (matchingServerCards.length > 1) {
                inFlightMovements.current.forEach((_, k) => {
                  if (k.startsWith(baseJc)) inFlightMovements.current.delete(k);
                });
              }
            });

            const merged = mapped.map((serverCard) => {
              const hasInFlight = inFlightMovements.current.size > 0 &&
                Array.from(inFlightMovements.current.keys()).some(
                  (k) => k.startsWith(serverCard.jobCardNo) || k === serverCard.id
                );

              let localCard = prev.find((p) => p.id === serverCard.id && !p.id.startsWith('jc-part-'));
              if (!localCard && !hasInFlight) {
                localCard = prev.find(
                  (p) =>
                    !p.id.startsWith('jc-part-') &&
                    p.jobCardNo === serverCard.jobCardNo &&
                    p.currentStageIndex === serverCard.currentStageIndex
                );
              }

              if (!localCard) return serverCard;

              const localStageIdx = localCard.currentStageIndex !== undefined ? localCard.currentStageIndex : PF01_STAGES.indexOf(localCard.currentStageName);
              const serverStageIdx = serverCard.currentStageIndex !== undefined ? serverCard.currentStageIndex : PF01_STAGES.indexOf(serverCard.currentStageName);

              const isLocalFurther = localStageIdx > serverStageIdx;
              const isLocalCompleted = localCard.status === 'COMPLETED' && serverCard.status !== 'COMPLETED';

              if (isLocalFurther || isLocalCompleted || hasInFlight) {
                return {
                  ...serverCard,
                  currentStageIndex: isLocalFurther ? localCard.currentStageIndex : serverCard.currentStageIndex,
                  currentStageName: isLocalFurther ? localCard.currentStageName : serverCard.currentStageName,
                  status: isLocalCompleted ? localCard.status : serverCard.status,
                  totalPcbQty: (isLocalFurther || hasInFlight) ? localCard.totalPcbQty : serverCard.totalPcbQty,
                  custPnlQty: (isLocalFurther || hasInFlight) ? localCard.custPnlQty : serverCard.custPnlQty,
                  prodPnlQty: (isLocalFurther || hasInFlight) ? localCard.prodPnlQty : serverCard.prodPnlQty,
                  prodPnlAreaSqm: (isLocalFurther || hasInFlight) ? localCard.prodPnlAreaSqm : serverCard.prodPnlAreaSqm,
                  custPnlAreaSqm: (isLocalFurther || hasInFlight) ? localCard.custPnlAreaSqm : serverCard.custPnlAreaSqm,
                };
              }
              return serverCard;
            });

            // Preserve active in-flight optimistic split lots (IDs starting with 'jc-part-')
            const inFlightOptimisticLots = prev.filter(
              (p) => p.id.startsWith('jc-part-') && inFlightMovements.current.has(p.id)
            );

            const finalMerged = inFlightOptimisticLots.length > 0
              ? [...merged, ...inFlightOptimisticLots]
              : merged;

            saveJobCardsToStorage(finalMerged);
            return finalMerged;
          });
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
    const isStageLocked = (assignedStage && assignedStage.toUpperCase() !== 'ALL') || userRole === 'NORMAL';
    if (!isStageLocked) return true;
    const assignedSlug = normalizeStageSlug(assignedStage);
    const jobSlug = normalizeStageSlug(jobStageName);
    return assignedSlug === jobSlug || jobStageName.trim().toLowerCase() === assignedStage.trim().toLowerCase();
  };

  const handleAdvanceStage = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      setSelectedJob(targetJob);
    }
  };

  const handleFullJobMovement = () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    const jobCardNo = selectedJob.jobCardNo;
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
    const effectiveReason = rejectionReasonInput || remarksText || (actualRejected > 0 ? `${actualRejected} PCB(s) rejected at ${selectedJob.currentStageName}` : 'Stage Movement');

    const currentIndex = PF01_STAGES.indexOf(selectedJob.currentStageName);
    const nextIndex = currentIndex + 1;
    const nextStageName = PF01_STAGES[nextIndex] || '20. PACKING';

    // 1. INSTANT OPTIMISTIC UI & IN-FLIGHT TRACKING (0ms)
    inFlightMovements.current.set(jobId, { stageIdx: nextIndex, stageName: nextStageName, timestamp: Date.now() });
    if (jobCardNo) inFlightMovements.current.set(jobCardNo, { stageIdx: nextIndex, stageName: nextStageName, timestamp: Date.now() });

    let updatedList: JobCard[] = [];
    setJobs((prev) => {
      const otherItems = prev.filter((j) => j.id !== selectedJob.id);
      const existingNextIdx = otherItems.findIndex(
        (j) => j.jobCardNo === jobCardNo && j.currentStageName === nextStageName && j.status !== 'COMPLETED'
      );

      if (existingNextIdx !== -1) {
        const target = otherItems[existingNextIdx];
        const mergedQty = (target.totalPcbQty || 0) + forwardedPcbQty;
        const mergedArea = Number(((target.prodPnlAreaSqm || 0) + nextStageSqm).toFixed(2));
        const mergedCard: JobCard = {
          ...target,
          totalPcbQty: mergedQty,
          custPnlQty: mergedQty,
          prodPnlQty: Math.ceil(mergedQty / 4),
          prodPnlAreaSqm: mergedArea,
          custPnlAreaSqm: mergedArea,
          rejectedPcbQty: (target.rejectedPcbQty || 0) + actualRejected,
          status: 'IN_PROGRESS',
        };
        updatedList = otherItems.map((j, idx) => (idx === existingNextIdx ? mergedCard : j));
      } else {
        updatedList = prev.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                currentStageIndex: nextIndex,
                currentStageName: nextStageName,
                totalPcbQty: forwardedPcbQty,
                custPnlQty: forwardedPcbQty,
                prodPnlQty: Math.ceil(forwardedPcbQty / 4),
                prodPnlAreaSqm: nextStageSqm,
                custPnlAreaSqm: nextStageSqm,
                rejectedPcbQty: (j.rejectedPcbQty || 0) + actualRejected,
                status: nextIndex >= PF01_STAGES.length ? 'COMPLETED' : 'IN_PROGRESS',
              }
            : j
        );
      }
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    showToastMsg(
      actualRejected > 0
        ? `Job ${jobCardNo}: ${forwardedPcbQty} PCBs moved to ${nextStageName} (${actualRejected} Rejected, Next Area: ${nextStageSqm} Sqm).`
        : `Full Movement: Job ${jobCardNo} moved to Stage ${nextStageName}`
    );

    setSelectedJob(null);
    setRejectedPcbQtyInput(0);
    setRejectionReasonInput('');
    setRemarksText('');

    // 2. NON-BLOCKING BACKGROUND SYNC
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        const targetEndpoint = encodeURIComponent(jobId && !jobId.startsWith('jc-part-') ? jobId : jobCardNo);
        let res = await fetchApi(`/job-cards/${targetEndpoint}/move-stage`, {
          method: 'POST',
          body: JSON.stringify({
            cardId: jobId && !jobId.startsWith('jc-part-') ? jobId : undefined,
            jobCardNo: jobCardNo,
            subJobCardNo: (selectedJob as any).subJobCardNo || jobCardNo,
            currentStageName: selectedJob.currentStageName,
            rejectPcbQty: actualRejected,
            remark: actualRejected > 0
              ? `Rejection: ${actualRejected} PCBs rejected. Reason: ${effectiveReason}`
              : `${remarkCategory}: ${remarksText || 'Clear Movement'}`,
            remarkType: actualRejected > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          inFlightMovements.current.delete(jobId);
          inFlightMovements.current.delete(jobCardNo);
          await fetchMovementJobs();
        } else {
          inFlightMovements.current.delete(jobId);
          inFlightMovements.current.delete(jobCardNo);
          const errText = await res.text().catch(() => '');
          console.warn(`Backend Stage Move Alert (${res.status}): ${errText.slice(0, 80) || res.statusText}`);
        }
      } catch (e: any) {
        inFlightMovements.current.delete(jobId);
        inFlightMovements.current.delete(jobCardNo);
        console.warn(`Backend API unavailable: ${e?.message || 'Network error'}`);
      }
    })();
  };

  const handleJobDispatch = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    // 1. INSTANT OPTIMISTIC UI & LOCAL STORAGE UPDATE (0ms)
    let updatedList: JobCard[] = [];
    setJobs((prev) => {
      updatedList = prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETED' } : j));
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    showToastMsg(`🚚 Job ${targetJob.jobCardNo} successfully Dispatched & Marked Completed!`);
    setSelectedJob(null);

    // 2. NON-BLOCKING BACKGROUND SYNC
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        await fetchApi(`/job-cards/${jobId}/move-stage`, {
          method: 'POST',
          body: JSON.stringify({
            jobCardNo: targetJob.jobCardNo,
            status: 'COMPLETED',
            remark: 'Direct Job Dispatch from Packing stage',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (e) {
        console.warn('Backend API unavailable');
      }
    })();
  };

  const [pendingWorkReason, setPendingWorkReason] = useState<string>('Drilling & Hole Check Pending');
  const [customPendingReason, setCustomPendingReason] = useState<string>('');

  const handlePartialJobMovement = () => {
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

    const currentIndex = PF01_STAGES.indexOf(selectedJob.currentStageName);
    const nextIndex = Math.min(currentIndex + 1, PF01_STAGES.length - 1);
    const nextStageName = PF01_STAGES[nextIndex];
    const baseJc = selectedJob.jobCardNo;
    const movedTempId = `jc-part-${Date.now()}-moved`;
    const movedSubNo = `${baseJc}-A`;

    const movedBatch: JobCard = {
      ...selectedJob,
      id: movedTempId,
      jobCardNo: selectedJob.jobCardNo,
      prodPnlQty: Math.ceil(parsedMoveQty / 4),
      custPnlQty: parsedMoveQty,
      totalPcbQty: parsedMoveQty,
      prodPnlAreaSqm: sqmMoved,
      custPnlAreaSqm: sqmMoved,
      currentStageIndex: nextIndex,
      currentStageName: nextStageName,
      status: 'IN_PROGRESS',
    };

    const remainingBatch: JobCard = {
      ...selectedJob,
      prodPnlQty: Math.ceil(remPcb / 4),
      custPnlQty: remPcb,
      totalPcbQty: remPcb,
      prodPnlAreaSqm: remArea,
      custPnlAreaSqm: remArea,
    };

    // 1. INSTANT OPTIMISTIC UI & IN-FLIGHT TRACKING (0ms)
    inFlightMovements.current.set(movedTempId, { stageIdx: nextIndex, stageName: nextStageName, timestamp: Date.now() });
    inFlightMovements.current.set(movedSubNo, { stageIdx: nextIndex, stageName: nextStageName, timestamp: Date.now() });

    setJobs((prev) => {
      const otherItems = prev.filter((j) => j.id !== selectedJob.id);
      const updatedList = [...otherItems, movedBatch, remainingBatch];
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    showToastMsg(
      `Partial Movement: Moved ${parsedMoveQty} PCBs of Job Card ${selectedJob.jobCardNo} to ${nextStageName} (${sqmMoved} Sqm). ${remPcb} PCBs remain at ${selectedJob.currentStageName} (${remArea} Sqm).`
    );

    const targetJobId = selectedJob.id;
    const targetJobCardNo = selectedJob.jobCardNo;
    const targetCurrentStage = selectedJob.currentStageName;
    const remarkToSend = remarksText ? `${effectiveReason} • ${remarksText}` : `Incomplete Movement: ${effectiveReason}`;

    setSelectedJob(null);
    setPartialQty(0);
    setRemarksText('');

    // 2. NON-BLOCKING BACKGROUND SYNC
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
        const targetEndpoint = encodeURIComponent(
          targetJobId && !targetJobId.startsWith('jc-part-')
            ? targetJobId
            : targetJobCardNo
        );
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        await fetchApi(`/job-cards/${targetEndpoint}/move-partial`, {
          method: 'POST',
          body: JSON.stringify({
            cardId: targetJobId,
            jobCardNo: targetJobCardNo,
            subJobCardNo: targetJobCardNo,
            currentStageName: targetCurrentStage,
            qtyToMove: parsedMoveQty,
            areaToMove: sqmMoved,
            pendingWorkReason: effectiveReason,
            remark: remarkToSend,
            remarkType: 'INCOMPLETE_MOVEMENT',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        await fetchMovementJobs();
      } catch (e) {
        console.warn('Backend move-partial sync background skipped', e);
      }
    })();
  };

  const normalizeStageSlug = (s: string) => {
    return String(s || '')
      .toLowerCase()
      .replace(/^\d+\.\s*/, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const isStageLocked = (assignedStage && assignedStage.toUpperCase() !== 'ALL') || userRole === 'NORMAL';
  const isShearingStage = assignedStage.includes('SHEARING') || assignedStage.includes('1.') || assignedStage.toLowerCase().includes('shearing');

  const filteredJobs = jobs.filter((j) => {
    if (isStageLocked) {
      const assignedSlug = normalizeStageSlug(assignedStage);
      const isUnlaunched = j.status === 'UNLAUNCHED';
      const isCompleted = j.status === 'COMPLETED';

      if (isUnlaunched && assignedSlug !== 'shearing' && assignedSlug !== '1shearing') return false;
      if (isCompleted && assignedSlug !== 'packing' && assignedSlug !== '20packing') return false;

      const jobSlug = normalizeStageSlug(j.currentStageName);
      if (assignedSlug && jobSlug && assignedSlug !== jobSlug) {
        return false;
      }
    }
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

  const handleLookupJob = (rawInput: string) => {
    const clean = parseScannedJobCode(rawInput);
    if (!clean) return;

    const lower = clean.toLowerCase();
    // Search for matches in active jobs (exact or prefix matching for job card no or sub-lot no)
    const matches = jobs.filter(
      (j) =>
        j.jobCardNo.toLowerCase() === lower ||
        j.id.toLowerCase() === lower ||
        lower.includes(j.jobCardNo.toLowerCase()) ||
        j.jobCardNo.toLowerCase().includes(lower)
    );

    if (matches.length === 1) {
      setSelectedJob(matches[0]);
      setMovementTab('VIEW');
      setBarcodeInput('');
      showToastMsg(`⚡ Scanned & Loaded: ${matches[0].jobCardNo} (${matches[0].currentStageName})`);
    } else if (matches.length > 1) {
      // Multiple active lots found for this Job Card No (from partial movements)
      setMultiLotCandidates(matches);
      setBarcodeInput('');
      showToastMsg(`Found ${matches.length} active lots for ${clean}. Please select one below.`);
    } else {
      showToastMsg(`No job found for scanned code: "${clean}"`);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleLookupJob(barcodeInput);
  };

  const handleSelectCandidateLot = (candidate: JobCard) => {
    setSelectedJob(candidate);
    setMultiLotCandidates([]);
    setMovementTab('VIEW');
    showToastMsg(`Selected Lot ${candidate.jobCardNo} at ${candidate.currentStageName}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 p-3 sm:p-6 pb-24 sm:pb-28 space-y-4 sm:space-y-6 font-sans max-w-[1600px] mx-auto">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/job-cards"
            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0"
            title="Back to Job Cards"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Job Movement & Update
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10.5px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Floor
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
              Live PCB Production Floor Monitoring & Stage Movement Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full lg:w-auto">
          {isStageLocked ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-xs shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-800 font-extrabold text-[10px] font-mono uppercase">LOCKED STAGE:</span>
              </div>
              <span className="font-bold text-amber-950 font-mono text-xs truncate">{assignedStage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Role selector */}
              <div className="flex-1 sm:flex-none flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 border border-slate-200 px-3 py-2 rounded-xl text-xs shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={userRole}
                  onChange={(e: any) => setUserRole(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs w-full sm:w-auto"
                >
                  <option value="MASTER">Master (Full Access)</option>
                  <option value="SUPER_USER">Super User</option>
                  <option value="NORMAL">Stage Operator</option>
                </select>
              </div>

              {/* Stage selector */}
              <div className="flex-1 sm:flex-none flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 border border-amber-300 px-3 py-2 rounded-xl text-xs shadow-2xs">
                <span className="text-slate-500 font-extrabold text-[10px] font-mono uppercase shrink-0">STAGE:</span>
                <select
                  value={assignedStage}
                  onChange={(e) => {
                    setAssignedStage(e.target.value);
                    if (typeof window !== 'undefined') localStorage.setItem('movement_filter_stage', e.target.value);
                  }}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs font-mono w-full sm:w-auto truncate"
                >
                  {PF01_STAGES.map((stg) => (
                    <option key={stg} value={stg} className="bg-white text-slate-900 font-sans">
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(!isStageLocked || isShearingStage) && (
            <Link
              href="/job-cards/launch"
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all text-center justify-center flex items-center gap-1 active:scale-95 border border-amber-600/30"
            >
              + Launch New Job
            </Link>
          )}
        </div>
      </div>

      {/* Stage Lock Banner for Operator Mode */}
      {userRole === 'NORMAL' && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-slate-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold text-amber-900">
              🔒 Stage Isolation Active: Showing ONLY Job Cards & WIP lots currently pending at <strong className="text-amber-950 font-bold underline">{assignedStage}</strong>.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0 hidden sm:inline font-bold">
            Stage Operator View • {filteredJobs.length} Job(s) Available
          </span>
        </div>
      )}

      {/* Barcode & Job Card Lookup Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Scan className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              BARCODE & JOB CARD LOOKUP (QR & CODE128)
            </span>
            <span className="text-[11px] text-slate-400 block font-normal">
              Instant stage movement via physical job card barcode, scanner gun, or typing Job Card No
            </span>
          </div>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / QR Code or enter Job Card No (e.g. 26-27-2432)..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white shadow-2xs transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 transition-all border border-amber-600/30"
          >
            <Zap className="w-4 h-4 fill-current text-slate-950 shrink-0" />
            <span>FIND & MOVE</span>
          </button>
        </form>
      </div>

      {/* Multi-Lot Candidates Selection Box (If Split Lots exist) */}
      {multiLotCandidates.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase font-mono">
              <Split className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Multiple Lots Match ({multiLotCandidates.length}): Select Lot to Advance</span>
            </div>
            <button
              type="button"
              onClick={() => setMultiLotCandidates([])}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-0.5 rounded-lg bg-white border border-slate-300 cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {multiLotCandidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => handleSelectCandidateLot(cand)}
                className="p-3 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 active:scale-98 shadow-2xs group"
              >
                <div className="min-w-0">
                  <div className="font-mono font-black text-slate-900 text-sm group-hover:text-amber-700 truncate">
                    {cand.jobCardNo}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Stage: <strong className="text-blue-700">{cand.currentStageName}</strong>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-black text-emerald-700 block">
                    {cand.totalPcbQty || 160} PCBs
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 mt-1">
                    Select ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-xs">
        <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Job Card No, Part Code, Customer, or Stage..."
          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 px-2.5 font-bold hover:text-slate-700">
            Clear
          </button>
        )}
      </div>

      {/* Active Jobs Grid (Desktop & Mobile Responsive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl font-mono text-sm shadow-xs">
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
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 hover:border-slate-300 hover:shadow-md transition-all shadow-xs flex flex-col justify-between"
              >
                {/* Header Row: Job No & Priority */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">JOB NUMBER</span>
                    <h3 className="text-base font-black text-slate-950 font-mono tracking-tight truncate">{j.jobCardNo}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {overdue ? (
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg border border-rose-200 font-mono flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" /> OVERDUE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg border border-emerald-200 font-mono flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3 h-3 text-emerald-600" /> ON SCHEDULE
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-black rounded-lg uppercase tracking-wider font-mono border ${
                        j.priority === 'MOST URGENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : j.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {j.priority}
                    </span>
                  </div>
                </div>

                {/* Main Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  <div className="min-w-0 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">PART CODE / PRODUCT</span>
                    <span className="font-mono font-bold text-slate-900 block truncate" title={j.rfePartCode}>{j.rfePartCode}</span>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">{j.customerPartNo}</span>
                  </div>

                  <div className="min-w-0 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">CUSTOMER</span>
                    <span className="font-bold text-slate-800 block truncate mt-0.5">{j.customerCode}</span>
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">QUANTITY</span>
                    <span className="font-black text-indigo-700 font-mono text-sm block mt-0.5">
                      {j.totalPcbQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 160)} PCBs
                    </span>
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">AREA (SQM)</span>
                    <span className="font-black text-emerald-700 font-mono text-sm block mt-0.5">{j.prodPnlAreaSqm} m²</span>
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">TARGET DATE</span>
                    <span className={`font-mono font-bold block mt-0.5 ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>
                      {j.targetDate}
                    </span>
                  </div>

                  <div className="min-w-0 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/70">
                    <span className="text-[10px] text-blue-600 uppercase font-mono font-bold block">CURRENT STAGE</span>
                    <span className="font-black text-blue-800 font-mono truncate block mt-0.5">{j.currentStageName}</span>
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-500 truncate mr-2">Progress: Stage {stageIndex + 1} of {PF01_STAGES.length}</span>
                    <span className="text-blue-700 shrink-0">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedJob(j)}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[40px] border border-slate-300/80"
                  >
                    <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs truncate">View & Move Stage</span>
                  </button>

                  {j.currentStageName.includes('PACKING') || stageIndex === PF01_STAGES.length - 1 ? (
                    <button
                      onClick={() => handleJobDispatch(j.id)}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 min-h-[40px] active:scale-98"
                    >
                      <span>🚚 Dispatch</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdvanceStage(j.id)}
                      className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0 active:scale-98 min-h-[40px] border border-amber-600/30"
                    >
                      <span className="text-xs font-black">Next Stage</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col shadow-2xl text-slate-900 relative my-auto overflow-hidden">
              
              {/* Sticky Header */}
              <div className="flex items-center justify-between gap-3 shrink-0 p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/90">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block truncate">
                    JOB SELECTION & STAGE MOVEMENT
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 font-mono tracking-tight truncate">
                      {selectedJob.jobCardNo}
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200 truncate max-w-[200px]">
                      Stage: {selectedJob.currentStageName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Movement Options Tabs: A, B, C (Responsive) */}
              <div className="shrink-0 p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
                  <button
                    onClick={() => setMovementTab('VIEW')}
                    className={`py-2 px-1 rounded-lg font-extrabold transition-all text-center text-xs flex items-center justify-center gap-1 ${
                      movementTab === 'VIEW' ? 'bg-white text-slate-950 shadow-xs border border-slate-200 font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Overview</span>
                    <span className="hidden sm:inline">A. Job Card View</span>
                  </button>
                  <button
                    onClick={() => setMovementTab('FULL')}
                    className={`py-2 px-1 rounded-lg font-extrabold transition-all text-center text-xs flex items-center justify-center gap-1 ${
                      movementTab === 'FULL' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Full Move</span>
                    <span className="hidden sm:inline">B. Full Movement</span>
                  </button>
                  <button
                    onClick={() => setMovementTab('PARTIAL')}
                    className={`py-2 px-1 rounded-lg font-extrabold transition-all text-center text-xs flex items-center justify-center gap-1 ${
                      movementTab === 'PARTIAL' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Split Lot</span>
                    <span className="hidden sm:inline">C. Uncompleted / Split</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">

                {/* TAB A: JOB CARD VIEW */}
                {movementTab === 'VIEW' && (
                  <div className="space-y-3.5 sm:space-y-4 text-xs font-sans">
                    {selectedJob.photoUrl && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={selectedJob.photoUrl}
                            alt="Job Card Original Photo"
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-300 shadow-xs cursor-pointer shrink-0"
                            onClick={() => setPhotoLightbox(selectedJob.photoUrl || null)}
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-xs truncate">Original Physical Photo</p>
                            <p className="text-[10px] text-slate-500 truncate">Uploaded during Job Launching</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPhotoLightbox(selectedJob.photoUrl || null)}
                          className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">View Photo</span>
                          <span className="sm:hidden">View</span>
                        </button>
                      </div>
                    )}

                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs font-sans">
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Job Card No:</span>
                        <strong className="font-mono text-slate-950 text-sm truncate">{selectedJob.jobCardNo}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Current Stage:</span>
                        <strong className="font-mono text-blue-700 font-bold truncate">{selectedJob.currentStageName}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Customer Part No:</span>
                        <strong className="text-slate-900 font-medium truncate max-w-[200px] text-right">{selectedJob.customerPartNo}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">R.F.E. Part Code:</span>
                        <strong className="font-mono text-blue-900 truncate text-right font-bold">{selectedJob.rfePartCode}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Customer Code:</span>
                        <strong className="text-slate-800 truncate">{selectedJob.customerCode}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Priority:</span>
                        <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">{selectedJob.priority}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Target Delivery Date:</span>
                        <strong className="font-mono text-slate-800">{selectedJob.targetDate}</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 shrink-0">Total PCB Quantity:</span>
                        <strong className="font-mono text-indigo-700 font-bold">{selectedJob.totalPcbQty || (selectedJob.prodPnlQty ? selectedJob.prodPnlQty * 4 : 160)} PCBs</strong>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-500 shrink-0">Production WIP Area:</span>
                        <strong className="font-mono text-emerald-700 font-bold">{selectedJob.prodPnlAreaSqm} Sqm</strong>
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
                      <div className="bg-blue-50 border border-blue-200 p-3.5 sm:p-4 rounded-2xl text-blue-950 space-y-2">
                        <p className="font-bold text-blue-900 text-xs">Full Job Movement Confirmation</p>
                        <p className="text-xs leading-relaxed text-blue-800">
                          Move Job Card No. <strong className="text-blue-950 font-mono font-black">{selectedJob.jobCardNo}</strong> to the next process.
                        </p>
                        <div className="mt-2 text-[11px] sm:text-xs font-extrabold text-blue-800 bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 inline-block font-mono max-w-full truncate">
                          Current: {selectedJob.currentStageName} ➔ Next: {PF01_STAGES[selectedJob.currentStageIndex + 1] || '20. PACKING (COMPLETED)'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-bold text-rose-700 mb-1">Rejection PCB Quantity (if any):</label>
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
                            className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 font-mono focus:outline-none focus:border-rose-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Movement Category *</label>
                          <select
                            value={remarkCategory}
                            onChange={(e) => setRemarkCategory(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                          >
                            <option value="Clear Movement">Clear Movement (No issues)</option>
                            <option value="Rejection">Rejection</option>
                            <option value="Rework">Rework</option>
                            <option value="Process issue">Process issue</option>
                            <option value="Other relevant movement remarks">Other relevant movement remarks</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {actualRejected > 0 ? 'Mandatory Rejection Remark *' : 'Remarks Details (Optional)'}
                          </label>
                          <textarea
                            rows={2}
                            value={rejectionReasonInput}
                            onChange={(e) => setRejectionReasonInput(e.target.value)}
                            placeholder={actualRejected > 0 ? 'Specify rejection defect, cause, or operator notes...' : 'Enter optional stage movement remarks...'}
                            className={`w-full bg-white border rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none ${
                              actualRejected > 0 ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-amber-500'
                            }`}
                          />
                        </div>

                        {/* Live Calculation Preview */}
                        <div className="sm:col-span-2 bg-slate-100 border border-slate-200 p-2.5 sm:p-3 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 text-[11px] font-mono">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 sm:border-0 sm:bg-transparent sm:p-0">
                            <span className="text-slate-500 block text-[10px]">Forwarded to Next:</span>
                            <span className="text-emerald-700 font-black text-sm">{forwardedPcbQty} PCBs</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200 sm:border-0 sm:bg-transparent sm:p-0">
                            <span className="text-slate-500 block text-[10px]">Next Stage Area:</span>
                            <span className="text-emerald-600 font-black text-sm">{nextStageSqm} Sqm</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200 sm:border-0 sm:bg-transparent sm:p-0">
                            <span className="text-slate-500 block text-[10px]">Deducted Rejections:</span>
                            <span className={`${actualRejected > 0 ? 'text-rose-600 font-black' : 'text-slate-400'} text-sm`}>{actualRejected} PCBs</span>
                          </div>
                        </div>
                      </div>

                      {isPackingStage ? (
                        <button
                          onClick={() => handleJobDispatch(selectedJob.id)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <span className="truncate">🚚 CONFIRM JOB DISPATCH & COMPLETE ({forwardedPcbQty} PCBs)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleFullJobMovement}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-amber-600/30"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
                          <span className="truncate">CONFIRM FULL MOVEMENT ({forwardedPcbQty} PCBs ➔ Next Stage)</span>
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
                      <div className="bg-amber-50 border border-amber-200 p-3 sm:p-3.5 rounded-2xl text-amber-950 space-y-1">
                        <p className="font-extrabold text-amber-900 text-xs sm:text-sm">Uncompleted / Partial Job Movement (PCB Split)</p>
                        <p className="text-[11px] text-amber-800">Move partial PCB quantity forward while maintaining balance PCBs at current stage with exact pending work reason.</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">Quantity Ready to Move Forward (PCBs):</label>
                            <span className="text-xs font-bold text-amber-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
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
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono"
                            placeholder={`Enter PCBs (1 to ${masterPcb - 1})`}
                          />
                          {parsedMoveQty >= masterPcb && (
                            <p className="text-[11px] text-rose-600 font-bold mt-1">
                              ⚠ Quantity cannot exceed {masterPcb - 1} PCBs (Total Lot: {masterPcb} PCBs).
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Pending Work Reason:</label>
                          <select
                            value={pendingWorkReason}
                            onChange={(e) => setPendingWorkReason(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
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
                            <label className="block text-xs font-bold text-slate-700 mb-1">Specify Custom Pending Reason:</label>
                            <input
                              type="text"
                              placeholder="e.g. Special Gold Finger Plating Inspection Pending"
                              value={customPendingReason}
                              onChange={(e) => setCustomPendingReason(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Incomplete Movement Remarks / Work Notes:</label>
                          <textarea
                            rows={2}
                            placeholder="Enter specific details regarding pending work, lot condition, or operator remarks..."
                            value={remarksText}
                            onChange={(e) => setRemarksText(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-emerald-50 border border-emerald-200 p-2.5 sm:p-3 rounded-xl text-emerald-900">
                            <div className="font-bold truncate">Next Stage: {PF01_STAGES[selectedJob.currentStageIndex + 1]}</div>
                            <div className="text-xs font-extrabold text-emerald-700 mt-1">{movedPcb} PCBs Moved</div>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 p-2.5 sm:p-3 rounded-xl text-amber-900">
                            <div className="font-bold truncate">Stays at: {selectedJob.currentStageName}</div>
                            <div className="text-xs font-extrabold text-amber-700 mt-1">{remPcb} PCBs Balance</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handlePartialJobMovement}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer active:scale-98 border border-amber-600/30"
                      >
                        <span className="truncate">CONFIRM PARTIAL MOVEMENT ({movedPcb} PCBs Forward • {remPcb} PCBs Balance)</span>
                      </button>
                    </div>
                  );
                })()}

              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
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
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-slate-900 border border-slate-700 p-3 sm:p-4 rounded-2xl sm:rounded-3xl max-w-3xl w-full space-y-3 relative shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-white font-mono truncate">Physical Job Card Photo</span>
                <button
                  onClick={() => setPhotoLightbox(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black rounded-xl sm:rounded-2xl p-1 sm:p-2">
                <img src={photoLightbox} alt="Original Job Card" className="max-h-[70vh] w-auto object-contain rounded-lg sm:rounded-xl" />
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
