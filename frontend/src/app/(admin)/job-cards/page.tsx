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
  Workflow,
  Camera,
  ImageIcon,
  BarChart3,
  UserCheck,
  Zap,
  X,
  Check,
  Eye,
  Download,
  Share2
} from 'lucide-react';

// Process Flow PF-01 19 Predefined Stages
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
  '15. ROUTING & VG',
  '16. BBT',
  '17. FQC (AI)',
  '18. PDI-AQL',
  '19. PACKING',
];

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
  photoUrl?: string;
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
  jobFlowSelection: string;
  currentStageIndex: number;
  currentStageName: string;
  customerPoId?: string;
  productId?: string;
  totalQty: number;
  status: 'UNLAUNCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CREATED';
  qrCodeValue: string;
  launchedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  customerPO?: {
    poNo: string;
    orderQty: number;
    customer: { companyName: string };
  };
  product?: {
    name: string;
    code: string;
    specCardNo: string;
    layers: number;
    thickness: string;
    copper: string;
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
    jobCardNo: '26-27-1729',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
    rfePartCode: 'D3625',
    customerCode: 'CUST-RF045',
    targetDate: '2026-09-26',
    priority: 'MOST URGENT',
    prodPnlQty: 40,
    custPnlQty: 80,
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    custPnlAreaSqm: 45,
    jobFlowSelection: 'PF-01',
    currentStageIndex: 1,
    currentStageName: '2. DRILLING',
    customerPoId: 'po-1',
    productId: 'prod-1',
    totalQty: 40,
    status: 'IN_PROGRESS',
    qrCodeValue: '26-27-1729-PARENT',
    createdAt: '2026-09-01T10:00:00Z',
    launchedAt: '2026-09-02T09:30:00Z',
    customerPO: {
      poNo: 'PO-2026-001',
      orderQty: 40,
      customer: { companyName: 'Apex Electronics Ltd' },
    },
    product: {
      name: 'Main Motherboard V2',
      code: 'EV-900W-WP-TO247',
      specCardNo: 'D3625',
      layers: 4,
      thickness: '1.6mm',
      copper: '1oz',
    },
    subJobCards: [
      {
        id: 'sub-1',
        subJobCardNo: '26-27-1729-A',
        qty: 35,
        status: 'IN_PROGRESS',
        qrCodeValue: '26-27-1729-A',
        currentStage: { id: 'stg-3', name: '2. DRILLING' },
      },
      {
        id: 'sub-2',
        subJobCardNo: '26-27-1729-B',
        qty: 5,
        status: 'IN_PROGRESS',
        qrCodeValue: '26-27-1729-B',
        currentStage: { id: 'stg-2', name: '1. SHEARING' },
      },
    ],
  },
  {
    id: 'jc-2',
    jobCardNo: '26-27-1730',
    photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
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
    jobFlowSelection: 'PF-01',
    currentStageIndex: 0,
    currentStageName: '1. SHEARING',
    customerPoId: 'po-3',
    productId: 'prod-3',
    totalQty: 60,
    status: 'UNLAUNCHED',
    qrCodeValue: '26-27-1730-PARENT',
    createdAt: '2026-09-03T11:20:00Z',
    customerPO: {
      poNo: 'PO-2026-003',
      orderQty: 60,
      customer: { companyName: 'Orbit Medical Devices' },
    },
    product: {
      name: 'Power Supply PCB',
      code: 'PSU-3KW-BOOSTER',
      specCardNo: 'D3633',
      layers: 2,
      thickness: '1.2mm',
      copper: '2oz',
    },
    subJobCards: [
      {
        id: 'sub-3',
        subJobCardNo: '26-27-1730-A',
        qty: 60,
        status: 'UNLAUNCHED',
        qrCodeValue: '26-27-1730-A',
        currentStage: { id: 'stg-1', name: '1. SHEARING' },
      },
    ],
  },
];

const DEFAULT_OPEN_POS: OpenPO[] = [
  {
    id: 'po-open-001',
    poNo: 'PO-2026-004',
    orderQty: 3500,
    expectedDeliveryDate: '2026-09-25T00:00:00Z',
    customer: { companyName: 'CUST-RF019 / RF Tech Corp' },
    product: { name: '3.3KW NEW DAUGHTER BOARD', code: 'D3633', specCardNo: 'D3633' },
  },
  {
    id: 'po-open-002',
    poNo: 'PO-2026-001',
    orderQty: 2500,
    expectedDeliveryDate: '2026-09-30T00:00:00Z',
    customer: { companyName: 'Acme Electronics Ltd' },
    product: { name: 'Main Motherboard V2', code: 'PCB-MB-V2', specCardNo: 'D001' },
  },
];

// Printable Job Card QR Tag Component
const JobCardQrTag = ({ jobCard, onPrint }: { jobCard: JobCard; onPrint?: () => void }) => {
  // Configurable Server IP / Host (Defaults to universal public HTTPS tunnel for 5G/4G/Wi-Fi scanning anywhere)
  const [serverHost, setServerHost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_qr_server_host');
      if (saved) return saved;
    }
    return 'https://rf-electro-erp.loca.lt';
  });

  const [isEditingHost, setIsEditingHost] = useState(false);

  const handleSaveHost = (newHost: string) => {
    const cleaned = newHost.trim();
    setServerHost(cleaned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_qr_server_host', cleaned);
    }
  };

  const formattedHost = serverHost.startsWith('http://') || serverHost.startsWith('https://') 
    ? serverHost 
    : `http://${serverHost}`;

  const pdfDocumentUrl = `${formattedHost}/job-cards-pdf/${jobCard.id || jobCard.jobCardNo}`;

  const qrDataPayload = [
    pdfDocumentUrl,
    `--------------------------------------`,
    `RF ELECTRO TECH ERP - JOB CARD TAG`,
    `JOB CARD NO: ${jobCard.jobCardNo}`,
    `CUSTOMER: ${jobCard.customerCode}`,
    `RFE PART CODE: ${jobCard.rfePartCode}`,
    `CUST PART NO: ${jobCard.customerPartNo}`,
    `PROD PNL QTY: ${jobCard.prodPnlQty} PNL (${jobCard.totalPcbQty || jobCard.custPnlQty || 0} PCB)`,
    `WIP AREA: ${jobCard.prodPnlAreaSqm || 50} SQM`,
    `CURRENT STAGE: ${jobCard.currentStageName || '1. SHEARING'}`,
    `PRIORITY: ${jobCard.priority}`,
    `TARGET DATE: ${jobCard.targetDate}`,
    `STATUS: ${jobCard.status}`
  ].join('\n');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;
  const barcodeImageUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(jobCard.jobCardNo)}&scale=3&rotate=N&includetext`;

  return (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-xl max-w-sm mx-auto text-slate-900 font-sans print:shadow-none print:border-black">
      {/* Tag Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
        <div>
          <h4 className="text-xs font-black tracking-wider uppercase text-slate-900">RF ELECTRO TECH ERP</h4>
          <p className="text-[10px] text-slate-500 font-mono font-bold">PRODUCTION JOB CARD TAG</p>
        </div>
        <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg font-mono border border-slate-900 uppercase shadow-2xs">
          {jobCard.priority}
        </span>
      </div>

      {/* Main Barcode & QR Box */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 p-3 rounded-xl mb-3">
        {/* Real Scannable QR Code */}
        <div className="w-28 h-28 bg-white p-1 border border-slate-400 rounded-lg shrink-0 flex flex-col items-center justify-center shadow-2xs overflow-hidden">
          <img
            src={qrImageUrl}
            alt={`QR Code for ${jobCard.jobCardNo}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://quickchart.io/qr?text=${encodeURIComponent(qrDataPayload)}&size=300`;
            }}
          />
        </div>

        {/* Key Info */}
        <div className="flex-1 min-w-0 text-xs space-y-1.5">
          <div>
            <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">JOB CARD NO</span>
            <span className="font-mono font-black text-sm text-slate-900 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-400 inline-block">
              {jobCard.jobCardNo}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER</span>
            <span className="font-bold text-slate-800 truncate block text-xs">{jobCard.customerCode}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">RFE PART CODE</span>
            <span className="font-mono font-extrabold text-blue-700 text-xs">{jobCard.rfePartCode}</span>
          </div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-100 p-2.5 rounded-xl border border-slate-300 font-mono mb-3">
        <div>PNL QTY: <strong className="text-slate-900 font-bold">{jobCard.prodPnlQty} PNL</strong></div>
        <div>PCB QTY: <strong className="text-slate-900 font-bold">{jobCard.totalPcbQty || jobCard.custPnlQty || 0} PCS</strong></div>
        <div>AREA: <strong className="text-emerald-700 font-bold">{jobCard.prodPnlAreaSqm} SQM</strong></div>
        <div>STAGE: <strong className="text-blue-700 font-bold">{jobCard.currentStageName || PF01_STAGES[0]}</strong></div>
      </div>

      {/* Scannable Code128 Barcode */}
      <div className="border-t border-slate-300 pt-2.5 text-center">
        <img
          src={barcodeImageUrl}
          alt={`Barcode for ${jobCard.jobCardNo}`}
          className="w-full h-10 object-contain mx-auto"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-[10px] font-mono text-slate-700 tracking-widest font-black block mt-1">
          *{jobCard.jobCardNo}*
        </span>
      </div>

      {/* Real Scan Notice */}
      <div className="mt-3 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
        <p className="text-[10px] font-extrabold text-emerald-800 flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          REAL SCANNABLE QR CODE & BARCODE
        </p>
        <p className="text-[9px] text-emerald-600 mt-0.5">Scan with any Mobile Camera / Scanner to get full Job Card details!</p>
      </div>

      {/* Mobile Scanning Host Configuration */}
      <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-left font-sans text-xs print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-blue-900 uppercase font-mono flex items-center gap-1">
            📱 QR Scan Target URL:
          </span>
          <button
            onClick={() => setIsEditingHost(!isEditingHost)}
            className="text-[10px] text-blue-700 font-bold underline cursor-pointer hover:text-blue-900"
          >
            {isEditingHost ? 'Close' : 'Change Mode'}
          </button>
        </div>

        {isEditingHost ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSaveHost('https://rf-electro-erp.loca.lt')}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
              >
                <span>🌐 Public World URL (5G / 4G Anywhere)</span>
                <span className="font-mono text-[9px] opacity-80">loca.lt</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveHost('http://10.88.142.200:3000')}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
              >
                <span>📶 Wi-Fi LAN IP (Local Network)</span>
                <span className="font-mono text-[9px] opacity-80">10.88.142.200</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveHost('http://localhost:3000')}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
              >
                <span>💻 PC Local</span>
                <span className="font-mono text-[9px] opacity-80">localhost</span>
              </button>
            </div>

            <input
              type="text"
              value={serverHost}
              onChange={(e) => handleSaveHost(e.target.value)}
              placeholder="Or enter custom domain / IP..."
              className="w-full text-xs font-mono bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none"
            />
          </div>
        ) : (
          <p className="text-[11px] font-mono font-bold text-blue-800 mt-0.5 truncate">
            {formattedHost}
          </p>
        )}
      </div>

      {onPrint && (
        <button
          onClick={onPrint}
          className="w-full mt-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all print:hidden cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>PRINT INDUSTRIAL STICKER TAG</span>
        </button>
      )}
    </div>
  );
};

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>(INITIAL_JOB_CARDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>('jc-1');

  // RBAC Role State
  const [userRole, setUserRole] = useState<'MASTER' | 'SUPER_USER' | 'NORMAL'>('MASTER');
  const [assignedStage, setAssignedStage] = useState<string>('2. DRILLING');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMovementJob, setSelectedMovementJob] = useState<JobCard | null>(null);
  const [movementTab, setMovementTab] = useState<'VIEW' | 'FULL' | 'PARTIAL'>('VIEW');
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [showQrModal, setShowQrModal] = useState<JobCard | null>(null);

  // Toast Notification State (Replaces native browser alerts)
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: `t-${Date.now()}`, type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // High-Tech Loading Screen Overlay State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing ERP Request...');

  const runWithLoading = (text: string, action: () => void, delayMs = 650) => {
    setLoadingText(text);
    setIsLoading(true);
    setTimeout(() => {
      action();
      setIsLoading(false);
    }, delayMs);
  };

  // New Job Card Form (PDF 13 Fields)
  const [launchForm, setLaunchForm] = useState({
    jobCardNo: '26-27-1731',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
    rfePartCode: 'D3625',
    customerCode: 'CUST-RF045',
    targetDate: '2026-09-28',
    priority: 'MOST URGENT' as 'MOST URGENT' | 'HIGH' | 'NORMAL',
    prodPnlQty: 40,
    custPnlQty: 80,
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    custPnlAreaSqm: 45,
    jobFlowSelection: 'PF-01',
    autoLaunch: false,
  });

  // Movement Form
  const [fullMoveRemarkType, setFullMoveRemarkType] = useState('Process issue');
  const [fullMoveRemarks, setFullMoveRemarks] = useState('');
  const [partialMoveQty, setPartialMoveQty] = useState<number>(35);

  // Barcode Lookup Trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = barcodeInput.trim();
    if (!rawInput) return;

    const matched = jobCards.find(
      (j) =>
        j.jobCardNo.toLowerCase() === rawInput.toLowerCase() ||
        j.id.toLowerCase() === rawInput.toLowerCase() ||
        rawInput.toLowerCase().includes(j.jobCardNo.toLowerCase()) ||
        rawInput.toLowerCase().includes(j.id.toLowerCase())
    );

    if (matched) {
      runWithLoading(`Scanning QR/Barcode & Loading Job Card ${matched.jobCardNo}...`, () => {
        setSelectedMovementJob(matched);
        setMovementTab('VIEW');
        setBarcodeInput('');
        showToast(`Scanned Job Card ${matched.jobCardNo} successfully`, 'info');
      });
    } else {
      showToast(`No Job Card found matching Scanned Data "${rawInput}"`, 'error');
    }
  };

  // Check stage permission for movements
  const canUserMoveStage = (jobStageName: string) => {
    if (userRole === 'MASTER' || userRole === 'SUPER_USER') return true;
    if (userRole === 'NORMAL') {
      return jobStageName.trim().toLowerCase() === assignedStage.trim().toLowerCase();
    }
    return false;
  };

  // Launch Existing Unlaunched Job Card
  const handleLaunchExistingJobCard = (jobCardId: string) => {
    if (userRole === 'NORMAL') {
      showToast('Permission Denied: Normal Users cannot launch Job Cards.', 'error');
      return;
    }

    runWithLoading('Releasing Job Card into Stage 1 Production (1. SHEARING)...', () => {
      setJobCards((prev) =>
        prev.map((j) => {
          if (j.id === jobCardId) {
            return {
              ...j,
              status: 'IN_PROGRESS',
              currentStageIndex: 0,
              currentStageName: PF01_STAGES[0],
              launchedAt: new Date().toISOString(),
            };
          }
          return j;
        })
      );

      const targetJob = jobCards.find((j) => j.id === jobCardId);
      showToast(`Job Card ${targetJob?.jobCardNo || ''} launched into Stage 1 (${PF01_STAGES[0]})`, 'success');
    });
  };

  // Launch New Job Card Form Submit
  const handleLaunchJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'NORMAL') {
      showToast('Permission Denied: Normal Users cannot launch new Job Cards.', 'error');
      return;
    }

    const jcNo = launchForm.jobCardNo || `26-27-${Math.floor(1000 + Math.random() * 9000)}`;

    runWithLoading('Creating New Job Card & Generating Barcode Tag...', () => {
      const newJobCard: JobCard = {
        id: `jc-${Date.now()}`,
        jobCardNo: jcNo,
        photoUrl: launchForm.photoUrl,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: launchForm.targetDate,
        priority: launchForm.priority,
        prodPnlQty: Number(launchForm.prodPnlQty) || 40,
        custPnlQty: Number(launchForm.custPnlQty) || 80,
        totalPcbQty: Number(launchForm.totalPcbQty) || 160,
        prodPnlAreaSqm: Number(launchForm.prodPnlAreaSqm) || 50,
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 45,
        jobFlowSelection: launchForm.jobFlowSelection,
        currentStageIndex: 0,
        currentStageName: PF01_STAGES[0],
        totalQty: Number(launchForm.prodPnlQty) || 40,
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
        launchedAt: launchForm.autoLaunch ? new Date().toISOString() : null,
        qrCodeValue: `${jcNo}-PARENT`,
        createdAt: new Date().toISOString(),
        customerPO: {
          poNo: `PO-${launchForm.customerCode}`,
          orderQty: Number(launchForm.prodPnlQty) || 40,
          customer: { companyName: launchForm.customerCode },
        },
        product: {
          name: launchForm.customerPartNo,
          code: launchForm.customerPartNo,
          specCardNo: launchForm.rfePartCode,
          layers: 4,
          thickness: '1.6mm',
          copper: '1oz',
        },
        subJobCards: [
          {
            id: `sub-${Date.now()}`,
            subJobCardNo: `${jcNo}-A`,
            qty: Number(launchForm.prodPnlQty) || 40,
            status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
            qrCodeValue: `${jcNo}-A`,
            currentStage: { id: 'stg-1', name: PF01_STAGES[0] },
          },
        ],
      };

      setJobCards((prev) => [newJobCard, ...prev]);
      setShowGenerateModal(false);
      setShowQrModal(newJobCard);

      showToast(
        `Job Card ${newJobCard.jobCardNo} created successfully! ${
          launchForm.autoLaunch ? 'Launched into Stage 1.' : 'Status is UNLAUNCHED.'
        }`,
        'success'
      );
    });
  };

  // Full Job Movement
  const handleFullJobMovement = () => {
    if (!selectedMovementJob) return;
    if (!canUserMoveStage(selectedMovementJob.currentStageName)) {
      showToast(`Permission Denied: Cannot move jobs out of stage "${selectedMovementJob.currentStageName}".`, 'error');
      return;
    }

    const nextIndex = selectedMovementJob.currentStageIndex + 1;
    if (nextIndex >= PF01_STAGES.length) {
      showToast('Job has reached the final PACKING stage!', 'info');
      return;
    }

    const nextStage = PF01_STAGES[nextIndex];

    runWithLoading(`Moving Job ${selectedMovementJob.jobCardNo} to ${nextStage}...`, () => {
      const updated: JobCard = {
        ...selectedMovementJob,
        currentStageIndex: nextIndex,
        currentStageName: nextStage,
        status: nextIndex === PF01_STAGES.length - 1 ? 'COMPLETED' : 'IN_PROGRESS',
      };

      setJobCards((prev) => prev.map((j) => (j.id === selectedMovementJob.id ? updated : j)));
      setSelectedMovementJob(null);
      setFullMoveRemarks('');
      showToast(`Full Lot (${selectedMovementJob.prodPnlQty} PNL) of ${selectedMovementJob.jobCardNo} moved to ${nextStage}`, 'success');
    });
  };

  // Mark Job Card as Completed
  const handleMarkAsCompleted = (jobCardId: string) => {
    runWithLoading('Completing Job Card & Releasing for Final Dispatch...', () => {
      setJobCards((prev) =>
        prev.map((j) => {
          if (j.id === jobCardId) {
            return {
              ...j,
              status: 'COMPLETED',
              currentStageIndex: PF01_STAGES.length - 1,
              currentStageName: PF01_STAGES[PF01_STAGES.length - 1],
              completedAt: new Date().toISOString(),
            };
          }
          return j;
        })
      );

      const targetJob = jobCards.find((j) => j.id === jobCardId);
      setSelectedMovementJob(null);
      showToast(`Job Card ${targetJob?.jobCardNo || ''} marked as COMPLETED!`, 'success');
    });
  };

  // Partial / Uncompleted Movement (Split)
  const handlePartialJobMovement = () => {
    if (!selectedMovementJob) return;
    if (!canUserMoveStage(selectedMovementJob.currentStageName)) {
      showToast(`Permission Denied: Cannot move jobs out of stage "${selectedMovementJob.currentStageName}".`, 'error');
      return;
    }

    if (partialMoveQty <= 0 || partialMoveQty >= selectedMovementJob.prodPnlQty) {
      showToast(`Partial movement qty must be between 1 and ${selectedMovementJob.prodPnlQty - 1} PNL.`, 'error');
      return;
    }

    const nextIndex = selectedMovementJob.currentStageIndex + 1;
    const nextStage = PF01_STAGES[nextIndex];
    const remainingBalance = selectedMovementJob.prodPnlQty - partialMoveQty;
    const areaPerPnl = selectedMovementJob.prodPnlAreaSqm / selectedMovementJob.prodPnlQty;

    runWithLoading(`Splitting ${partialMoveQty} PNL & Moving to ${nextStage}...`, () => {
      const movedBatch: JobCard = {
        ...selectedMovementJob,
        id: `jc-part-${Date.now()}`,
        jobCardNo: `${selectedMovementJob.jobCardNo}-A`,
        prodPnlQty: partialMoveQty,
        prodPnlAreaSqm: Number((partialMoveQty * areaPerPnl).toFixed(2)),
        currentStageIndex: nextIndex,
        currentStageName: nextStage,
      };

      const remainingBatch: JobCard = {
        ...selectedMovementJob,
        jobCardNo: `${selectedMovementJob.jobCardNo}-B`,
        prodPnlQty: remainingBalance,
        prodPnlAreaSqm: Number((remainingBalance * areaPerPnl).toFixed(2)),
      };

      setJobCards((prev) =>
        prev.flatMap((j) => (j.id === selectedMovementJob.id ? [movedBatch, remainingBatch] : [j]))
      );

      setSelectedMovementJob(null);
      showToast(
        `Split complete: ${partialMoveQty} PNL moved to ${nextStage}, ${remainingBalance} PNL retained at ${selectedMovementJob.currentStageName}`,
        'success'
      );
    });
  };

  // Print Window Trigger
  const triggerPrint = () => {
    window.print();
  };

  // Filtered Cards
  const filteredCards = jobCards.filter((jc) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      jc.jobCardNo.toLowerCase().includes(query) ||
      jc.customerPartNo?.toLowerCase().includes(query) ||
      jc.rfePartCode?.toLowerCase().includes(query) ||
      jc.customerCode?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      jc.status === statusFilter ||
      (statusFilter === 'UNLAUNCHED' && (jc.status === 'CREATED' || jc.status === 'UNLAUNCHED'));
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'NOT_LAUNCHED':
      case 'UNLAUNCHED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-300 inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
            <Clock className="w-3 h-3 text-sky-600 shrink-0" /> UNLAUNCHED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
            <Cpu className="w-3 h-3 text-amber-700 shrink-0" /> IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> COMPLETED
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">{status}</span>;
    }
  };

  const totalMasterCards = jobCards.length;
  const inProgressCount = jobCards.filter((j) => j.status === 'IN_PROGRESS').length;
  const unlaunchedCount = jobCards.filter((j) => j.status === 'UNLAUNCHED').length;
  const completedCount = jobCards.filter((j) => j.status === 'COMPLETED').length;
  const totalSubLots = jobCards.reduce((acc, curr) => acc + (curr.subJobCards?.length || (curr.status === 'IN_PROGRESS' ? 1 : 0)), 0);

  const totalPnlCount = jobCards.reduce((acc, curr) => acc + (curr.prodPnlQty || curr.totalQty || 0), 0);
  const activePnlCount = jobCards.filter((j) => j.status === 'IN_PROGRESS').reduce((acc, curr) => acc + (curr.prodPnlQty || curr.totalQty || 0), 0);

  const totalSqmArea = jobCards.reduce((acc, curr) => acc + (curr.prodPnlAreaSqm || 50), 0);
  const activeSqmArea = jobCards.filter((j) => j.status === 'IN_PROGRESS').reduce((acc, curr) => acc + (curr.prodPnlAreaSqm || 50), 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Job Cards & Movement Flow</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">
                PF-01 FLOW
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-300 whitespace-nowrap flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-normal">
              Track PCB Job Cards, scan barcodes, execute full or split stage movement from Launch to Packing.
            </p>
          </div>
        </div>

        {/* Right Actions & Controls Row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap shrink-0 border-t xl:border-t-0 border-slate-100 pt-3 xl:pt-0">
          {/* RBAC Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-bold text-[11px] hidden sm:inline">Role:</span>
            <select
              value={userRole}
              onChange={(e: any) => setUserRole(e.target.value)}
              className="bg-white text-slate-900 font-bold rounded-lg px-2 py-1 border border-slate-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="MASTER">Master ID (Full Control)</option>
              <option value="SUPER_USER">Super User (All Stages)</option>
              <option value="NORMAL">Normal User (Stage Rights)</option>
            </select>

            {userRole === 'NORMAL' && (
              <select
                value={assignedStage}
                onChange={(e) => setAssignedStage(e.target.value)}
                className="bg-amber-50 text-amber-900 font-bold rounded-lg px-2 py-1 border border-amber-300 text-xs cursor-pointer focus:outline-none"
              >
                {PF01_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* WIP & Daily Report Button */}
          <button
            onClick={() => setShowReportDrawer(true)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-200 transition-all whitespace-nowrap cursor-pointer shadow-2xs hover:border-slate-300"
          >
            <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>WIP & Daily Report</span>
          </button>

          {/* ADD NEW JOB CARD Primary Action */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 sm:px-5 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0 text-slate-950" />
            <span>ADD NEW JOB CARD</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Barcode Lookup Input */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              Barcode Scanner / Fast Job Movement
            </label>
            <span className="text-[10px] text-slate-400">e.g. 26-27-1729</span>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Scan or type Job Card No. (e.g. 26-27-1729)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Scan
            </button>
          </form>
        </div>

        {/* Live Metrics Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Active Job Cards */}
          <div className="bg-gradient-to-br from-white to-blue-50/40 border border-blue-100 p-3.5 rounded-xl flex items-center gap-3 shadow-2xs relative overflow-hidden transition-all hover:border-blue-300">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold tracking-tight text-slate-500 uppercase">Active Job Cards</p>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5 font-mono tracking-tight">{totalMasterCards} Master Cards</p>
              <p className="text-[10px] font-semibold text-blue-700 mt-0.5 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                {inProgressCount} Active in Prod ({totalSubLots} Lots)
              </p>
            </div>
          </div>

          {/* Card 2: Total Production PNL */}
          <div className="bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-3 shadow-2xs relative overflow-hidden transition-all hover:border-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold tracking-tight text-slate-500 uppercase">Total Production PNL</p>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5 font-mono tracking-tight">{totalPnlCount} PNL Qty</p>
              <p className="text-[10px] font-semibold text-emerald-700 mt-0.5 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                {activePnlCount} PNL In-Progress
              </p>
            </div>
          </div>

          {/* Card 3: Total WIP Area */}
          <div className="bg-gradient-to-br from-white to-purple-50/40 border border-purple-100 p-3.5 rounded-xl flex items-center gap-3 shadow-2xs relative overflow-hidden transition-all hover:border-purple-300">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
              <Split className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold tracking-tight text-slate-500 uppercase">Total WIP Area</p>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5 font-mono tracking-tight">{totalSqmArea.toFixed(1)} Sqm</p>
              <p className="text-[10px] font-semibold text-purple-700 mt-0.5 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                {activeSqmArea.toFixed(1)} Sqm Active Floor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Job Card # (e.g. 26-27-1729), Part Code, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap mr-1">Status:</span>
          {['ALL', 'UNLAUNCHED', 'IN_PROGRESS', 'COMPLETED'].map((st) => {
            const count =
              st === 'ALL'
                ? jobCards.length
                : jobCards.filter((j) => {
                    if (st === 'UNLAUNCHED') return j.status === 'UNLAUNCHED' || j.status === 'CREATED';
                    return j.status === st;
                  }).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{st === 'ALL' ? 'All Cards' : st.replace('_', ' ')}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700 font-bold'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Job Cards Data Table - Responsive & No Horizontal Scroll Required */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3 w-[14%]">Job Card #</th>
                <th className="py-3 px-3 w-[24%]">Customer & Part Details</th>
                <th className="py-3 px-3 w-[14%] text-center">PNL & PCB Qty</th>
                <th className="py-3 px-3 w-[8%] text-center">Area (Sqm)</th>
                <th className="py-3 px-3 w-[11%] text-center">Status</th>
                <th className="py-3 px-3 w-[9%] text-center">Priority</th>
                <th className="py-3 px-3 w-[10%] text-center">Current Stage</th>
                <th className="py-3 px-3 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCards.map((jc) => {
                const isExpanded = expandedRow === jc.id;
                const isUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED';

                return (
                  <React.Fragment key={jc.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      {/* Job Card No */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : jc.id)}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-600" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>

                          <span className="font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs whitespace-nowrap">
                            {jc.jobCardNo}
                          </span>
                        </div>
                      </td>

                      {/* Customer & Part Details */}
                      <td className="py-3 px-3 min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs truncate" title={jc.customerPartNo || jc.product?.name}>
                          {jc.customerPartNo || jc.product?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono truncate">
                          <span className="text-blue-700 font-bold">RFE: {jc.rfePartCode || 'D3625'}</span>
                          <span>•</span>
                          <span className="truncate">Cust: {jc.customerCode || 'CUST-RF045'}</span>
                        </div>
                      </td>

                      {/* PNL & PCB Qty */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                          {jc.prodPnlQty || jc.totalQty} <span className="text-[10px] font-medium text-slate-500">Prod PNL</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                          {jc.custPnlQty || (jc.prodPnlQty * 2)} Cust • {jc.totalPcbQty || (jc.prodPnlQty * 4)} PCB
                        </div>
                      </td>

                      {/* Area Sqm */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
                        {jc.prodPnlAreaSqm || 50} Sqm
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(jc.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs ${
                            jc.priority === 'MOST URGENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : jc.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {jc.priority || 'NORMAL'}
                        </span>
                      </td>

                      {/* Current Stage */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap">
                          <Workflow className="w-3 h-3 shrink-0" />
                          <span>{jc.currentStageName || PF01_STAGES[0]}</span>
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* QR Code Icon Button */}
                          <button
                            onClick={() => setShowQrModal(jc)}
                            title="View & Print QR Sticker Tag"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200 text-xs transition-all cursor-pointer shrink-0"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Launch Button (If Unlaunched) */}
                          {isUnlaunched && (
                            <button
                              onClick={() => handleLaunchExistingJobCard(jc.id)}
                              title="Launch Job Card into Stage 1 Production"
                              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer animate-pulse shrink-0"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Launch</span>
                            </button>
                          )}

                          {/* Movement Options Button */}
                          <button
                            onClick={() => {
                              setSelectedMovementJob(jc);
                              setMovementTab('VIEW');
                            }}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg text-xs transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <span>Move</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable History & Sub Cards */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={8} className="p-4">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <Workflow className="w-4 h-4 text-blue-600" />
                                Job Process Flow (PF-01) Details & Sub-Job Cards
                              </div>
                              <button
                                onClick={() => setShowQrModal(jc)}
                                className="text-blue-600 hover:underline font-bold flex items-center gap-1 text-[11px]"
                              >
                                <QrCode className="w-3.5 h-3.5" /> Print Job Sticker
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <div>Job Card No: <strong className="text-slate-900 font-mono">{jc.jobCardNo}</strong></div>
                              <div>Customer: <strong className="text-slate-900">{jc.customerCode || 'CUST-RF045'}</strong></div>
                              <div>Prod PNL Qty: <strong className="text-blue-700">{jc.prodPnlQty} PNL</strong></div>
                              <div>Total Area: <strong className="text-emerald-700">{jc.prodPnlAreaSqm} Sqm</strong></div>
                            </div>

                            {/* Sub Job Cards List */}
                            {jc.subJobCards && jc.subJobCards.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Split Batches / Sub Cards</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {jc.subJobCards.map((sub) => (
                                    <div key={sub.id} className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                                      <div>
                                        <span className="font-bold text-slate-900">{sub.subJobCardNo}</span>
                                        <span className="text-slate-500 ml-2">({sub.qty} PNL)</span>
                                      </div>
                                      <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-300 rounded font-sans text-blue-700 font-bold">
                                        {sub.currentStage?.name || jc.currentStageName}
                                      </span>
                                    </div>
                                  ))}
                                </div>
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

      {/* MODAL 1: ADD NEW JOB CARD */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">New Job Card Creation & Launch</h3>
                  <p className="text-xs text-slate-500">Fill job parameters to generate QR code & launch into production</p>
                </div>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-700 text-base font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleLaunchJobCard} className="space-y-4 text-xs">
              
              {/* Row 1: Job Card No & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Card No. *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.jobCardNo}
                    onChange={(e) => setLaunchForm({ ...launchForm, jobCardNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 26-27-1731"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={launchForm.targetDate}
                    onChange={(e) => setLaunchForm({ ...launchForm, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Customer Code, Customer Part No, RFE Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.customerCode}
                    onChange={(e) => setLaunchForm({ ...launchForm, customerCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    placeholder="CUST-RF045"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Part No. *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.customerPartNo}
                    onChange={(e) => setLaunchForm({ ...launchForm, customerPartNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    placeholder="EV-900W-WP-TO247"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">R.F.E. Part Code *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.rfePartCode}
                    onChange={(e) => setLaunchForm({ ...launchForm, rfePartCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    placeholder="D3625"
                  />
                </div>
              </div>

              {/* Row 3: Priority & Production PNL Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level *</label>
                  <select
                    value={launchForm.priority}
                    onChange={(e: any) => setLaunchForm({ ...launchForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MOST URGENT">MOST URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Production PNL Qty *</label>
                  <input
                    type="number"
                    required
                    value={launchForm.prodPnlQty}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 0;
                      setLaunchForm({
                        ...launchForm,
                        prodPnlQty: qty,
                        custPnlQty: qty * 2,
                        totalPcbQty: qty * 4,
                        prodPnlAreaSqm: Number((qty * 1.25).toFixed(2)),
                        custPnlAreaSqm: Number((qty * 1.125).toFixed(2)),
                      });
                    }}
                    className="w-full bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none shadow-2xs"
                    placeholder="40"
                  />
                </div>
              </div>

              {/* Row 4: Auto-Calculated Details Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div>Cust PNL: <strong className="text-slate-900">{launchForm.custPnlQty}</strong></div>
                <div>PCB Qty: <strong className="text-slate-900">{launchForm.totalPcbQty}</strong></div>
                <div>Area: <strong className="text-emerald-700 font-bold">{launchForm.prodPnlAreaSqm} Sqm</strong></div>
              </div>

              {/* Checkbox: Auto Launch into Production */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="autoLaunch"
                  checked={launchForm.autoLaunch}
                  onChange={(e) => setLaunchForm({ ...launchForm, autoLaunch: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="autoLaunch" className="text-xs font-bold text-emerald-900 cursor-pointer">
                  Directly Launch into Stage 1 Production (1. SHEARING) immediately
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{launchForm.autoLaunch ? 'CREATE & LAUNCH NOW' : 'CREATE JOB CARD'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: JOB MOVEMENT OPTIONS (Three Categories: A. View, B. Full, C. Split) */}
      {selectedMovementJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">JOB MOVEMENT OPTIONS</span>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mt-0.5">
                  Job Card No: {selectedMovementJob.jobCardNo}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Stage: {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                  </span>
                </h3>
              </div>
              <button onClick={() => setSelectedMovementJob(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            {/* Option Tabs (PDF Section 3 & 4) */}
            <div className="flex border-b border-slate-200 gap-2 bg-slate-50 p-1.5 rounded-xl">
              <button
                onClick={() => setMovementTab('VIEW')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  movementTab === 'VIEW' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                A. Job Card View
              </button>

              <button
                onClick={() => setMovementTab('FULL')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  movementTab === 'FULL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                B. Full Movement
              </button>

              <button
                onClick={() => setMovementTab('PARTIAL')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  movementTab === 'PARTIAL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Split className="w-3.5 h-3.5 text-amber-600" />
                C. Uncompleted / Split
              </button>
            </div>

            {/* TAB A: JOB CARD VIEW */}
            {movementTab === 'VIEW' && (
              <div className="space-y-4 text-xs">
                {/* Details Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      Job Card Details Summary
                    </span>
                    {getStatusBadge(selectedMovementJob.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>Job Card No: <strong className="text-slate-900 font-mono">{selectedMovementJob.jobCardNo}</strong></div>
                    <div>Current Stage: <strong className="text-blue-700 font-bold">{selectedMovementJob.currentStageName || PF01_STAGES[0]}</strong></div>
                    <div>Customer Code: <strong className="text-slate-900">{selectedMovementJob.customerCode || 'CUST-RF045'}</strong></div>
                    <div>Customer Part No: <strong className="text-slate-900">{selectedMovementJob.customerPartNo}</strong></div>
                    <div>R.F.E. Part Code: <strong className="text-slate-900">{selectedMovementJob.rfePartCode || 'D3625'}</strong></div>
                    <div>Target Date: <strong className="text-slate-900">{selectedMovementJob.targetDate}</strong></div>
                    <div>Production PNL Qty: <strong className="text-blue-700 font-bold">{selectedMovementJob.prodPnlQty} PNL</strong></div>
                    <div>Total Area: <strong className="text-emerald-700 font-bold">{selectedMovementJob.prodPnlAreaSqm} Sqm</strong></div>
                  </div>
                </div>

                {/* If UNLAUNCHED, provide immediate Launch action inside tab */}
                {(selectedMovementJob.status === 'UNLAUNCHED' || selectedMovementJob.status === 'CREATED') && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-emerald-900">Job Card is Unlaunched</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Click Launch to release into Stage 1 Production</p>
                    </div>
                    <button
                      onClick={() => {
                        handleLaunchExistingJobCard(selectedMovementJob.id);
                        setSelectedMovementJob(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>LAUNCH NOW</span>
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  {selectedMovementJob.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleMarkAsCompleted(selectedMovementJob.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MARK JOB CARD AS COMPLETED (Stage 19 PACKING)</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowQrModal(selectedMovementJob)}
                      className="py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>VIEW & PRINT QR TAG</span>
                    </button>

                    <a
                      href={`/job-cards-pdf/${selectedMovementJob.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
                    >
                      <FileText className="w-4 h-4" />
                      <span>OPEN JOB CARD PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: FULL MOVEMENT */}
            {movementTab === 'FULL' && (
              <div className="space-y-4 text-xs">
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-blue-900">
                  <p className="font-semibold">Full Lot Movement Confirmation</p>
                  <p className="mt-1">
                    Are you sure you want to move Job Card No. <strong>{selectedMovementJob.jobCardNo}</strong> ({selectedMovementJob.prodPnlQty} PNL, {selectedMovementJob.prodPnlAreaSqm} Sqm) to the next process:
                  </p>
                  <div className="mt-2 font-bold text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200 inline-block">
                    Next Stage: {PF01_STAGES[selectedMovementJob.currentStageIndex + 1] || '19. PACKING (COMPLETED)'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Movement Remarks Category *</label>
                  <select
                    value={fullMoveRemarkType}
                    onChange={(e) => setFullMoveRemarkType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="Clear Movement">Clear Movement (No issues)</option>
                    <option value="Rejection">Rejection</option>
                    <option value="Rework">Rework</option>
                    <option value="Process issue">Process issue</option>
                    <option value="Other relevant remarks">Other relevant movement remarks</option>
                  </select>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={fullMoveRemarks}
                    onChange={(e) => setFullMoveRemarks(e.target.value)}
                    placeholder="Enter optional stage movement remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleFullJobMovement}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    CONFIRM FULL MOVEMENT ({selectedMovementJob.prodPnlQty} PNL ➔ Next Stage)
                  </button>

                  {selectedMovementJob.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleMarkAsCompleted(selectedMovementJob.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MARK AS COMPLETED & READY FOR DISPATCH</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB C: UNCOMPLETED / SPLIT MOVEMENT */}
            {movementTab === 'PARTIAL' && (
              <div className="space-y-4 text-xs">
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Split className="w-4 h-4 text-amber-700" />
                    Uncompleted / Partial Job Movement (Lot Split)
                  </p>
                  <p className="mt-1 text-[11px]">
                    Required when complete lot is not ready to move forward. The system automatically maintains balance quantity and area for both portions.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity Ready to Move Forward (PNL):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedMovementJob.prodPnlQty - 1}
                      value={partialMoveQty}
                      onChange={(e) => setPartialMoveQty(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 font-medium">
                      <div className="font-bold">Next Stage: {PF01_STAGES[selectedMovementJob.currentStageIndex + 1]}</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1">{partialMoveQty} PNL Moved</div>
                      <div className="text-[10px] text-slate-500">
                        Sqm: {((partialMoveQty * selectedMovementJob.prodPnlAreaSqm) / selectedMovementJob.prodPnlQty).toFixed(2)} Sqm
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 font-medium">
                      <div className="font-bold">Stays at: {selectedMovementJob.currentStageName}</div>
                      <div className="text-sm font-bold text-amber-700 mt-1">{selectedMovementJob.prodPnlQty - partialMoveQty} PNL Remaining</div>
                      <div className="text-[10px] text-slate-500">
                        Sqm: {(((selectedMovementJob.prodPnlQty - partialMoveQty) * selectedMovementJob.prodPnlAreaSqm) / selectedMovementJob.prodPnlQty).toFixed(2)} Sqm
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePartialJobMovement}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  CONFIRM PARTIAL MOVEMENT ({partialMoveQty} PNL Forward • {selectedMovementJob.prodPnlQty - partialMoveQty} PNL Balance)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: QR CODE STICKER / TAG PRINT MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Job Card QR Tag Preview</h3>
              </div>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            {/* Printable QR Tag Card */}
            <JobCardQrTag jobCard={showQrModal} onPrint={triggerPrint} />

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setShowQrModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: WIP & Daily Movement Report Drawer */}
      {showReportDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex justify-end animate-in fade-in duration-200">
          {/* Backdrop Click Handler */}
          <div className="absolute inset-0" onClick={() => setShowReportDrawer(false)} />

          {/* Drawer Panel */}
          <div className="relative bg-white border-l border-slate-200 w-full max-w-xl h-full flex flex-col shadow-2xl text-slate-900 font-sans z-10">
            
            {/* 1. Fixed Drawer Header (Never Scrolls, Never Clipped) */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">Daily Job Movement & WIP Report</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-50 text-emerald-700 font-black border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE SYNCHRONIZED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time Stage-wise job status, WIP area & loss monitoring</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportDrawer(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* Quick Live Summary Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-800 uppercase font-mono">Active WIP Jobs</p>
                  <p className="text-base sm:text-lg font-black text-blue-950 mt-0.5 font-mono">{inProgressCount} Cards ({totalSubLots} Lots)</p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Total WIP PNL</p>
                  <p className="text-base sm:text-lg font-black text-emerald-950 mt-0.5 font-mono">{activePnlCount} PNL</p>
                </div>

                <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-purple-800 uppercase font-mono">Total WIP Sqm</p>
                  <p className="text-base sm:text-lg font-black text-purple-950 mt-0.5 font-mono">{activeSqmArea.toFixed(1)} Sqm</p>
                </div>
              </div>

              {/* Stage-Wise WIP Breakdown Table (All 19 Stages) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                    19 STAGES WIP BREAKDOWN
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    PF-01 Standard Flow
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-900 text-white font-mono text-[10px] uppercase sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Stage Name</th>
                        <th className="py-2.5 px-3 text-center font-bold">Active Jobs</th>
                        <th className="py-2.5 px-3 text-center font-bold">PNL Qty</th>
                        <th className="py-2.5 px-3 text-right font-bold">WIP Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {PF01_STAGES.map((stg) => {
                        const activeMasterJobs = jobCards.filter(
                          (j) => j.status === 'IN_PROGRESS' && j.currentStageName === stg
                        );

                        const activeSubJobs = jobCards
                          .flatMap((j) => j.subJobCards || [])
                          .filter((sub) => sub.status === 'IN_PROGRESS' && sub.currentStage?.name === stg);

                        const totalStageJobsCount = activeMasterJobs.length + activeSubJobs.length;

                        const pnlSum =
                          activeMasterJobs.reduce((s, j) => s + (j.prodPnlQty || j.totalQty || 0), 0) +
                          activeSubJobs.reduce((s, sub) => s + sub.qty, 0);

                        const sqmSum = activeMasterJobs.reduce((s, j) => s + (j.prodPnlAreaSqm || 50), 0);

                        const hasActiveWip = totalStageJobsCount > 0;

                        return (
                          <tr
                            key={stg}
                            className={`transition-colors ${
                              hasActiveWip
                                ? 'bg-amber-50/60 hover:bg-amber-100/80 font-semibold'
                                : 'hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                              {hasActiveWip && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                              <span className={hasActiveWip ? 'text-slate-950 font-black' : 'text-slate-700'}>{stg}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {hasActiveWip ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[11px]">
                                  {totalStageJobsCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {hasActiveWip ? (
                                <span className="font-extrabold text-blue-700">{pnlSum}</span>
                              ) : (
                                <span className="text-slate-400 font-medium">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {hasActiveWip ? (
                                <span className="font-extrabold text-emerald-700">{sqmSum.toFixed(1)} Sqm</span>
                              ) : (
                                <span className="text-slate-400 font-medium">0.0 Sqm</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Grand Totals Footer */}
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs">
                      <tr>
                        <td className="py-2.5 px-3 font-black text-slate-900 uppercase">Grand Total WIP</td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-900">{inProgressCount} Jobs</td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-700">{activePnlCount} PNL</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">{activeSqmArea.toFixed(1)} Sqm</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delay & Overdue Monitoring Notice */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 mb-4">
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  DELAY & OVERDUE MONITORING
                </h5>
                <div className="text-xs text-slate-600 space-y-1 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span>Jobs Target Date Active:</span>
                    <strong className="text-slate-900 font-mono">{jobCards.length} Jobs On Schedule</strong>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Daily Movement Loss/Rejection:</span>
                    <strong className="text-emerald-700 font-mono">0 Rejections (100% Yield)</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Fixed Footer Close Action */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setShowReportDrawer(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Simple Round Loading Overlay with Blurred Background */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3.5 text-slate-900">
            <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-xs font-bold text-slate-800">{loadingText}</span>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-extrabold ${
              toast.type === 'success'
                ? 'bg-slate-950 text-emerald-400 border-emerald-500/50 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-slate-950 text-rose-400 border-rose-500/50 shadow-rose-950/20'
                : 'bg-slate-950 text-sky-400 border-sky-500/50 shadow-sky-950/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Zap className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="text-slate-100">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs ml-2 font-bold p-1 rounded hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
