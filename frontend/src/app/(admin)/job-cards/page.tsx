'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Pencil,
  Check,
  Eye,
  Download,
  Share2,
  Scan,
  Upload
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';


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
  totalPcbQty?: number;
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
  isNewlyCreated?: boolean;
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

// Printable Horizontal Industrial Job Card QR Tag Component
const JobCardQrTag = ({ jobCard, onPrint, onClose }: { jobCard: JobCard; onPrint?: () => void; onClose?: () => void }) => {
  const [serverHost, setServerHost] = useState<string>('https://rf-electro-erp.loca.lt');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_qr_server_host');
      if (saved) setServerHost(saved);
    }
  }, []);

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
    `TOTAL PCB QTY: ${jobCard.totalPcbQty || jobCard.custPnlQty || 0} PCB`,
    `WIP AREA: ${jobCard.prodPnlAreaSqm || 50} SQM`,
    `CURRENT STAGE: ${jobCard.currentStageName || '1. SHEARING'}`,
    `PRIORITY: ${jobCard.priority}`,
    `TARGET DATE: ${jobCard.targetDate}`,
    `STATUS: ${jobCard.status}`
  ].join('\n');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;
  const barcodeImageUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(jobCard.jobCardNo)}&scale=3&rotate=N&includetext`;

  const poNo = jobCard.customerPO?.poNo || `PO-${jobCard.customerCode || '2026-001'}`;
  const custName = jobCard.customerPO?.customer?.companyName || `Customer (${jobCard.customerCode})`;
  const prodName = jobCard.product?.name || jobCard.customerPartNo;
  const prodSpecs = jobCard.product
    ? `${jobCard.product.layers || 4} Layers • ${jobCard.product.thickness || '1.6mm'} • ${jobCard.product.copper || '1oz'}`
    : `${jobCard.prodPnlAreaSqm || 50} Sqm • ${jobCard.totalPcbQty || 80} PCB`;

  return (
    <div className="bg-white border-2 border-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-5xl w-full mx-auto text-slate-900 font-sans print:shadow-none print:border-black space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md border border-slate-900 shrink-0">
            <Printer className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="text-xs font-black tracking-widest uppercase text-slate-900 font-mono">
                RF ELECTRO TECH ERP • INDUSTRIAL TRAVELER TAG
              </h4>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-950 mt-0.5 tracking-tight flex items-center gap-3">
              <span>{jobCard.jobCardNo}</span>
              <span className="text-xs px-3 py-0.5 bg-amber-400 text-slate-950 font-black rounded-lg border border-slate-900 uppercase tracking-wider">
                {jobCard.priority || 'NORMAL'}
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/job-cards-pdf/${jobCard.id || jobCard.jobCardNo}`}
            target="_blank"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm border border-amber-600 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Open PDF Report ↗</span>
          </Link>

          {onPrint && (
            <button
              onClick={onPrint}
              className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 border border-slate-900"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Sticker Tag</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Horizontal Landscape 3-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        
        {/* LEFT COLUMN: Barcode & QR Code Box (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-4 shadow-xs">
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Scannable QR Code */}
            <div className="w-32 h-32 bg-white p-1.5 border border-slate-300 rounded-xl shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
              <img
                src={qrImageUrl}
                alt={`QR Code for ${jobCard.jobCardNo}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://quickchart.io/qr?text=${encodeURIComponent(qrDataPayload)}&size=300`;
                }}
              />
            </div>

            {/* QR Quick Details */}
            <div className="space-y-2 text-xs min-w-0 flex-1">
              <div>
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">WIP JOB NO</span>
                <strong className="font-mono font-black text-sm text-slate-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-400 inline-block">
                  {jobCard.jobCardNo}
                </strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER</span>
                <span className="font-bold text-slate-900 truncate block">{jobCard.customerCode}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">RFE PART CODE</span>
                <span className="font-mono font-extrabold text-blue-700">{jobCard.rfePartCode}</span>
              </div>
            </div>
          </div>

          {/* Code128 Scannable Barcode */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1 shadow-2xs">
            <img
              src={barcodeImageUrl}
              alt={`Barcode for ${jobCard.jobCardNo}`}
              className="w-full h-11 object-contain mx-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-[11px] font-mono text-slate-800 tracking-widest font-black block">
              *{jobCard.jobCardNo}*
            </span>
          </div>

          {/* Real Scan Notice */}
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
            <p className="text-[10px] font-extrabold text-emerald-900 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              REAL SCANNABLE QR & BARCODE TAG
            </p>
            <p className="text-[9px] text-emerald-700 mt-0.5">Scan with any scanner or mobile camera for live stage tracking</p>
          </div>

          {/* Mobile Tunnel URL Switcher */}
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs font-sans print:hidden space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-900 uppercase font-mono">
                📱 Scan Target URL:
              </span>
              <button
                onClick={() => setIsEditingHost(!isEditingHost)}
                className="text-[10px] text-blue-700 font-bold underline cursor-pointer hover:text-blue-900"
              >
                {isEditingHost ? 'Close' : 'Change Mode'}
              </button>
            </div>
            {isEditingHost ? (
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleSaveHost('https://rf-electro-erp.loca.lt')}
                  className="w-full px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
                >
                  <span>🌐 Public World URL (5G/4G Anywhere)</span>
                  <span className="font-mono text-[9px] opacity-80">loca.lt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveHost('http://10.88.142.200:3000')}
                  className="w-full px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
                >
                  <span>📶 Wi-Fi LAN IP</span>
                  <span className="font-mono text-[9px] opacity-80">10.88.142.200</span>
                </button>
                <input
                  type="text"
                  value={serverHost}
                  onChange={(e) => handleSaveHost(e.target.value)}
                  placeholder="Custom domain..."
                  className="w-full text-xs font-mono bg-white border border-blue-300 rounded px-2 py-1 text-slate-900 focus:outline-none"
                />
              </div>
            ) : (
              <p className="text-[11px] font-mono font-bold text-blue-900 truncate">{formattedHost}</p>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Specifications Grid & PO/Specs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3 shadow-xs">
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              JOB CARD SPECIFICATIONS & PARAMETERS
            </h5>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER PART NO</span>
                <strong className="text-slate-900 font-bold block truncate" title={jobCard.customerPartNo}>{jobCard.customerPartNo}</strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">R.F.E. PART CODE</span>
                <strong className="text-blue-700 font-mono font-bold block">{jobCard.rfePartCode}</strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TOTAL PCB QTY</span>
                <strong className="text-indigo-700 font-mono font-black block">{jobCard.totalPcbQty || jobCard.custPnlQty || (jobCard.prodPnlQty * 2) || 0} PCB</strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TOTAL WIP AREA</span>
                <strong className="text-emerald-700 font-mono font-black block">{jobCard.prodPnlAreaSqm || 50} SQM</strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CURRENT STAGE</span>
                <span className="inline-block font-extrabold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {jobCard.currentStageName || PF01_STAGES[0]}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TARGET DATE</span>
                <strong className="text-slate-900 font-mono font-bold block">{jobCard.targetDate}</strong>
              </div>
            </div>

            {/* PO & Product Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] pt-1">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER PO</span>
                <p className="font-extrabold text-slate-900 text-xs font-mono">{poNo}</p>
                <p className="text-[10px] text-slate-500 truncate">{custName}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">PRODUCT SPECS</span>
                <p className="font-extrabold text-slate-900 text-xs truncate">{prodName}</p>
                <p className="text-[10px] text-slate-500 truncate">{prodSpecs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sub-Job Lots Breakdown & Actions (3 Cols) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between self-stretch">
          <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider font-mono flex items-center gap-1">
                <Split className="w-3.5 h-3.5 text-amber-700" />
                SUB-LOTS ({jobCard.subJobCards?.length || 1})
              </h5>
              <span className="text-[11px] font-mono font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-400">
                {jobCard.totalPcbQty || (jobCard.prodPnlQty * 2)} PCBs
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(jobCard.subJobCards || []).map((sub) => {
                const subPcb = (sub as any).totalPcbQty || (sub.qty * 2);
                return (
                  <div key={sub.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans shadow-2xs">
                    <div>
                      <span className="font-mono font-black text-slate-950 bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-300 block">
                        {sub.subJobCardNo}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-black text-blue-700 text-xs">{subPcb} PCBs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 border border-slate-900"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>PRINT STICKER TAG</span>
              </button>
            )}

            <Link
              href={`/job-cards-pdf/${jobCard.id || jobCard.jobCardNo}`}
              target="_blank"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm border border-amber-600 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>OPEN JOB CARD PDF ↗</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

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

const markJobCardAsDeleted = (id: string, jobCardNo?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedJobCardIds();
    const toAdd = [id, jobCardNo].filter(Boolean) as string[];
    const updated = Array.from(new Set([...current, ...toAdd]));
    localStorage.setItem('erp_deleted_job_card_ids', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save deleted job card ID:', err);
  }
};

export default function JobCardsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [jobCards, setJobCards] = useState<JobCard[]>(INITIAL_JOB_CARDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>('jc-1');

  // RBAC Role State
  const [userRole, setUserRole] = useState<'MASTER' | 'SUPER_USER' | 'NORMAL'>('MASTER');
  const [assignedStage, setAssignedStage] = useState<string>('2. DRILLING');

  // Modals & Lightbox
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedMovementJob, setSelectedMovementJob] = useState<JobCard | null>(null);
  const [movementTab, setMovementTab] = useState<'VIEW' | 'FULL' | 'PARTIAL'>('VIEW');
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [showQrModal, setShowQrModal] = useState<JobCard | null>(null);
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<JobCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverHost, setServerHost] = useState<string>('rf-electro-erp.loca.lt');
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);
  const [unitPcbAreaSqm, setUnitPcbAreaSqm] = useState<number>(0.28125);

  // Partial Split Pending Reason Options
  const [incompletePendingReason, setIncompletePendingReason] = useState<string>('Drilling & Hole Check Pending');
  const [incompleteCustomReason, setIncompleteCustomReason] = useState<string>('');
  const [incompleteRemarks, setIncompleteRemarks] = useState<string>('');

  // Load stored job cards from localStorage after client mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const deleted = getDeletedJobCardIds();
    const stored = getStoredJobCards();
    if (stored !== null) {
      setJobCards(stored.filter((j) => !deleted.includes(j.id) && !deleted.includes(j.jobCardNo)));
    } else {
      setJobCards(INITIAL_JOB_CARDS.filter((j) => !deleted.includes(j.id) && !deleted.includes(j.jobCardNo)));
    }
  }, []);

  // Save jobCards to localStorage whenever state updates (only after mount)
  useEffect(() => {
    if (isMounted) {
      saveJobCardsToStorage(jobCards);
    }
  }, [jobCards, isMounted]);

  // Sync userRole from localStorage if set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored) {
        const upper = stored.toUpperCase();
        if (upper.includes('SUPER') || upper.includes('MASTER') || upper.includes('ADMIN')) {
          setUserRole('MASTER');
        } else if (upper.includes('PROD') || upper.includes('MANAGER')) {
          setUserRole('SUPER_USER');
        }
      }
    }
  }, []);

  // Super Admin Check Helper
  const isSuperAdmin = React.useMemo(() => {
    const upper = userRole.toUpperCase();
    return upper.includes('SUPER') || upper.includes('MASTER') || upper.includes('ADMIN') || userRole === 'MASTER';
  }, [userRole]);

  // Toast Notification State (Replaces native browser alerts)
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: `t-${Date.now()}`, type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleDeleteJobCard = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);
    const targetCard = jobCards.find((j) => j.id === id);
    const cardNo = targetCard?.jobCardNo;

    markJobCardAsDeleted(id, cardNo);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`http://localhost:3001/api/v1/job-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (err: any) {
      console.warn('Backend DELETE call failed or offline mode', err);
    } finally {
      setJobCards((prev) => prev.filter((jc) => jc.id !== id && jc.jobCardNo !== cardNo));
      showToast('Job Card deleted successfully!', 'success');
      setDeleteConfirmCard(null);
      if (selectedMovementJob?.id === id || selectedMovementJob?.jobCardNo === cardNo) {
        setSelectedMovementJob(null);
      }
      setIsDeleting(false);
    }
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

  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // New Job Card Form (Full PDF 13 Fields & Pre-Launch Split Options)
  const [launchForm, setLaunchForm] = useState({
    jobCardNo: '26-27-1731',
    photoUrl: '',
    customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
    rfePartCode: 'D3625',
    customerCode: 'CUST-RF045',
    targetDate: '2026-09-28',
    launchDate: new Date().toISOString().split('T')[0],
    priority: 'MOST URGENT' as 'MOST URGENT' | 'HIGH' | 'NORMAL',
    prodPnlQty: 40,
    custPnlQty: 80,
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    custPnlAreaSqm: 45,
    jobFlowSelection: 'PF-01',
    autoLaunch: false,
    enablePreSplit: false,
    splitCount: 2,
    customSplits: [{ subNo: '26-27-1731-1', qty: 80 }, { subNo: '26-27-1731-2', qty: 80 }],
  });

  const handleOpenCreateModal = () => {
    setEditingCardId(null);
    const nextNo = `26-27-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setLaunchForm({
      jobCardNo: nextNo,
      photoUrl: '',
      customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
      rfePartCode: 'D3625',
      customerCode: 'CUST-RF045',
      targetDate: nextWeek,
      launchDate: today,
      priority: 'NORMAL',
      prodPnlQty: 40,
      custPnlQty: 80,
      totalPcbQty: 160,
      prodPnlAreaSqm: 50,
      custPnlAreaSqm: 45,
      jobFlowSelection: 'PF-01',
      autoLaunch: false,
      enablePreSplit: false,
      splitCount: 2,
      customSplits: [{ subNo: `${nextNo}-1`, qty: 80 }, { subNo: `${nextNo}-2`, qty: 80 }],
    });
    setShowGenerateModal(true);
  };

  const handleOpenEditModal = (card: JobCard) => {
    setEditingCardId(card.id);
    const launchDateStr = card.launchedAt ? card.launchedAt.split('T')[0] : new Date().toISOString().split('T')[0];
    setLaunchForm({
      jobCardNo: card.jobCardNo,
      photoUrl: card.photoUrl || '',
      customerPartNo: card.customerPartNo || '',
      rfePartCode: card.rfePartCode || '',
      customerCode: card.customerCode || '',
      targetDate: card.targetDate || '',
      launchDate: launchDateStr,
      priority: card.priority || 'NORMAL',
      prodPnlQty: card.prodPnlQty || 40,
      custPnlQty: card.custPnlQty || 80,
      totalPcbQty: card.totalPcbQty || 160,
      prodPnlAreaSqm: card.prodPnlAreaSqm || 50,
      custPnlAreaSqm: card.custPnlAreaSqm || 45,
      jobFlowSelection: card.jobFlowSelection || 'PF-01',
      autoLaunch: card.status === 'IN_PROGRESS',
      enablePreSplit: false,
      splitCount: card.subJobCards?.length || 1,
      customSplits: card.subJobCards
        ? card.subJobCards.map((s) => ({ subNo: s.subJobCardNo, qty: s.totalPcbQty || s.qty || 80 }))
        : [{ subNo: `${card.jobCardNo}-1`, qty: card.totalPcbQty || 160 }],
    });
    setShowGenerateModal(true);
  };

  // Sync state from backend API if available
  const fetchBackendJobCards = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/job-cards', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const deletedIds = getDeletedJobCardIds();
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
                  jobCardNo: sub.subJobCardNo,
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
                  jobFlowSelection: j.processFlowMaster?.name || 'PF-01',
                  currentStageIndex: stageIdx >= 0 ? stageIdx : 0,
                  currentStageName: stageIdx >= 0 ? PF01_STAGES[stageIdx] : rawStage,
                  customerPoId: j.customerPoId,
                  productId: j.productId,
                  totalQty: subPcbQty,
                  status: sub.status === 'CREATED' ? 'UNLAUNCHED' : sub.status || j.status,
                  qrCodeValue: sub.qrCodeValue || sub.subJobCardNo,
                  launchedAt: j.launchedAt,
                  completedAt: j.completedAt,
                  createdAt: j.createdAt,
                  customerPO: j.customerPO,
                  product: j.product,
                  subJobCards: [sub],
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
              jobFlowSelection: j.processFlowMaster?.name || 'PF-01',
              currentStageIndex: stageIdx >= 0 ? stageIdx : 0,
              currentStageName: stageIdx >= 0 ? PF01_STAGES[stageIdx] : rawStage,
              customerPoId: j.customerPoId,
              productId: j.productId,
              totalQty: masterPcbQty,
              status: j.status === 'CREATED' ? 'UNLAUNCHED' : j.status,
              qrCodeValue: j.qrCodeValue || `${j.jobCardNo}-PARENT`,
              launchedAt: j.launchedAt,
              completedAt: j.completedAt,
              createdAt: j.createdAt,
              customerPO: j.customerPO,
              product: j.product,
              subJobCards: j.subJobCards || [],
            }];
          }).filter((j) => !deletedIds.includes(j.id) && !deletedIds.includes(j.jobCardNo));

          if (mapped.length > 0) {
            setJobCards((prev) => {
              const backendKeySet = new Set(mapped.flatMap((m) => [m.id, m.jobCardNo]));
              const clientOnly = prev.filter((p) => !backendKeySet.has(p.id) && !backendKeySet.has(p.jobCardNo) && !deletedIds.includes(p.id) && !deletedIds.includes(p.jobCardNo));
              const merged = [...mapped, ...clientOnly];
              saveJobCardsToStorage(merged);
              return merged;
            });
          }
        }
      }
    } catch (err) {
      // Retain client-side fallback state smoothly
    }
  }, []);

  useEffect(() => {
    fetchBackendJobCards();
  }, [fetchBackendJobCards]);

  // Movement Form
  const [fullMoveRemarkType, setFullMoveRemarkType] = useState('Process issue');
  const [fullMoveRemarks, setFullMoveRemarks] = useState('');
  const [partialMoveQty, setPartialMoveQty] = useState<number | string>(35);

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
        setPartialMoveQty(Math.max(1, Math.floor((matched.totalPcbQty || 160) / 2)));
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
  const handleLaunchJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'NORMAL') {
      showToast('Permission Denied: Normal Users cannot launch new Job Cards.', 'error');
      return;
    }

    const jcNo = launchForm.jobCardNo || `26-27-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalPcb = Number(launchForm.totalPcbQty) || 160;
    const launchIsoDate = launchForm.launchDate ? new Date(launchForm.launchDate).toISOString() : new Date().toISOString();

    // Validate pre-splits if enabled
    let subJobCardsList: SubJobCard[] = [];
    let apiSplits: number[] = [];

    if (launchForm.enablePreSplit && launchForm.customSplits.length > 0) {
      const splitSum = launchForm.customSplits.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
      if (splitSum !== totalPcb) {
        showToast(`Pre-split quantity sum (${splitSum} PCBs) must equal Total PCB Qty (${totalPcb} PCBs).`, 'error');
        return;
      }

      subJobCardsList = launchForm.customSplits.map((item, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        subJobCardNo: item.subNo || `${jcNo}-${idx + 1}`,
        qty: Number(item.qty),
        totalPcbQty: Number(item.qty),
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
        qrCodeValue: `${item.subNo || `${jcNo}-${idx + 1}`}`,
        currentStage: { id: `stg-${idx + 1}`, name: PF01_STAGES[0] },
      }));

      apiSplits = launchForm.customSplits.map((s) => Number(s.qty));
    } else {
      subJobCardsList = [
        {
          id: `sub-${Date.now()}`,
          subJobCardNo: `${jcNo}-1`,
          qty: totalPcb,
          totalPcbQty: totalPcb,
          status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
          qrCodeValue: `${jcNo}-1`,
          currentStage: { id: 'stg-1', name: PF01_STAGES[0] },
        },
      ];
      apiSplits = [totalPcb];
    }

    // Check if updating an existing card instead of creating duplicate
    const existingIndex = jobCards.findIndex(
      (j) => (editingCardId && j.id === editingCardId) || j.jobCardNo === jcNo
    );

    if (existingIndex !== -1) {
      const existing = jobCards[existingIndex];
      const updatedJobCard: JobCard = {
        ...existing,
        jobCardNo: jcNo,
        photoUrl: launchForm.photoUrl,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: launchForm.targetDate,
        launchedAt: launchIsoDate,
        priority: launchForm.priority,
        totalPcbQty: totalPcb,
        custPnlQty: totalPcb,
        prodPnlQty: Math.ceil(totalPcb / 4),
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 45,
        prodPnlAreaSqm: Number(Number(launchForm.custPnlAreaSqm || 45) * 1.1) || 50,
        jobFlowSelection: launchForm.jobFlowSelection,
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : existing.status,
        subJobCards: subJobCardsList,
      };

      runWithLoading(`Updating Job Card ${jcNo}...`, async () => {
        try {
          await fetch(`http://localhost:3001/api/v1/job-cards/${existing.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
            body: JSON.stringify(updatedJobCard),
          });
        } catch (err) {
          // offline fallback
        }

        setJobCards((prev) => prev.map((j, idx) => (idx === existingIndex ? updatedJobCard : j)));
        showToast(`Job Card ${jcNo} updated successfully!`, 'success');
        setShowGenerateModal(false);
        setEditingCardId(null);
      });
      return;
    }

    runWithLoading('Creating New Job Card & Generating Barcode Tag...', async () => {
      const newJobCard: JobCard = {
        id: `jc-${Date.now()}`,
        jobCardNo: jcNo,
        photoUrl: launchForm.photoUrl,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: launchForm.targetDate,
        priority: launchForm.priority,
        prodPnlQty: Math.ceil(totalPcb / 4),
        custPnlQty: totalPcb,
        totalPcbQty: totalPcb,
        prodPnlAreaSqm: Number(Number(launchForm.custPnlAreaSqm || 45) * 1.1) || 50,
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 45,
        jobFlowSelection: launchForm.jobFlowSelection,
        currentStageIndex: 0,
        currentStageName: PF01_STAGES[0],
        totalQty: totalPcb,
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
        launchedAt: launchIsoDate,
        qrCodeValue: `${jcNo}-PARENT`,
        createdAt: new Date().toISOString(),
        customerPO: {
          poNo: `PO-${launchForm.customerCode}`,
          orderQty: totalPcb,
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
        subJobCards: subJobCardsList,
        isNewlyCreated: true,
      };

      // Try Backend POST API sync
      try {
        await fetch('http://localhost:3001/api/v1/job-cards/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            jobCardNo: jcNo,
            photoUrl: launchForm.photoUrl,
            customerPartNo: launchForm.customerPartNo,
            rfePartCode: launchForm.rfePartCode,
            customerCode: launchForm.customerCode,
            targetDate: launchForm.targetDate,
            launchedAt: launchIsoDate,
            priority: launchForm.priority,
            prodPnlQty: Math.ceil(totalPcb / 4),
            custPnlQty: totalPcb,
            totalPcbQty: totalPcb,
            prodPnlAreaSqm: launchForm.prodPnlAreaSqm,
            custPnlAreaSqm: launchForm.custPnlAreaSqm,
            jobFlowSelection: launchForm.jobFlowSelection,
            autoLaunch: launchForm.autoLaunch,
            splits: apiSplits,
          }),
        });
      } catch (err) {
        // Fallback to client state
      }

      setJobCards((prev) => [newJobCard, ...prev]);
      setStatusRadio('All');
      setShowGenerateModal(false);
      setShowQrModal(newJobCard);
      setEditingCardId(null);

      showToast(
        `Job Card ${newJobCard.jobCardNo} created with ${subJobCardsList.length} sub-lot(s)! ${
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
      showToast(`Full Lot (${selectedMovementJob.totalPcbQty || 160} PCBs) of ${selectedMovementJob.jobCardNo} moved to ${nextStage}`, 'success');
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

    const masterPcb = selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || Math.round((selectedMovementJob.prodPnlQty || 0) * 2) || 160;
    const parsedMoveQty = typeof partialMoveQty === 'number' ? partialMoveQty : (parseInt(String(partialMoveQty), 10) || 0);

    if (parsedMoveQty <= 0 || parsedMoveQty >= masterPcb) {
      showToast(`Partial movement qty must be between 1 and ${masterPcb - 1} PCBs.`, 'error');
      return;
    }

    const nextIndex = selectedMovementJob.currentStageIndex + 1;
    if (nextIndex >= PF01_STAGES.length) {
      showToast('Job has reached the final PACKING stage!', 'info');
      return;
    }
    const nextStage = PF01_STAGES[nextIndex];
    const remainingPcb = masterPcb - parsedMoveQty;
    const totalArea = selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45;
    const movedArea = Number(((parsedMoveQty * totalArea) / masterPcb).toFixed(2));
    const remArea = Number(((remainingPcb * totalArea) / masterPcb).toFixed(2));
    const effectiveReason = incompletePendingReason === 'Other / Custom Pending Reason' ? (incompleteCustomReason || 'Pending PCB Work') : incompletePendingReason;

    runWithLoading(`Splitting ${parsedMoveQty} PCBs & Moving to ${nextStage}...`, async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        await fetch(`http://localhost:3001/api/v1/job-cards/${selectedMovementJob.id}/move-partial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            qtyToMove: parsedMoveQty,
            areaToMove: movedArea,
            pendingWorkReason: effectiveReason,
            remark: incompleteRemarks ? `${effectiveReason} • ${incompleteRemarks}` : `Incomplete Movement: ${effectiveReason}`,
            remarkType: 'INCOMPLETE_MOVEMENT',
          }),
        });
      } catch (err) {
        console.warn('Backend API call failed, using client state update');
      }

      const rawNo = selectedMovementJob.jobCardNo;
      const parts = rawNo.split('-');
      const baseMasterNo = parts.length >= 3 ? parts.slice(0, 3).join('-') : rawNo;

      const usedLetters = new Set<string>();
      jobCards.forEach((j) => {
        if (j.jobCardNo.startsWith(`${baseMasterNo}-`)) {
          const rem = j.jobCardNo.slice(baseMasterNo.length + 1);
          const match = rem.match(/^([A-Z]+)/);
          if (match) usedLetters.add(match[1]);
        }
      });

      let nextMovedLetter = 'A';
      for (let i = 0; i < 26; i++) {
        const l = String.fromCharCode(65 + i);
        if (!usedLetters.has(l)) {
          nextMovedLetter = l;
          break;
        }
      }

      let movedSubNo = `${baseMasterNo}-${nextMovedLetter}`;
      let remainingSubNo = rawNo;

      const lastSegment = parts[parts.length - 1];
      const isLetterSuffix = /^[A-Z]+$/.test(lastSegment);

      if (!isLetterSuffix) {
        usedLetters.add(nextMovedLetter);
        let remLetter = 'B';
        for (let i = 0; i < 26; i++) {
          const l = String.fromCharCode(65 + i);
          if (!usedLetters.has(l)) {
            remLetter = l;
            break;
          }
        }
        remainingSubNo = `${baseMasterNo}-${remLetter}`;
      }

      const movedBatch: JobCard = {
        ...selectedMovementJob,
        id: `jc-part-${Date.now()}-A`,
        jobCardNo: movedSubNo,
        prodPnlQty: Math.ceil(parsedMoveQty / 4),
        custPnlQty: parsedMoveQty,
        totalPcbQty: parsedMoveQty,
        prodPnlAreaSqm: movedArea,
        custPnlAreaSqm: movedArea,
        currentStageIndex: nextIndex,
        currentStageName: nextStage,
      };

      const remainingBatch: JobCard = {
        ...selectedMovementJob,
        jobCardNo: remainingSubNo,
        prodPnlQty: Math.ceil(remainingPcb / 4),
        custPnlQty: remainingPcb,
        totalPcbQty: remainingPcb,
        prodPnlAreaSqm: remArea,
        custPnlAreaSqm: remArea,
      };

      setJobCards((prev) =>
        prev.flatMap((j) => (j.id === selectedMovementJob.id ? [movedBatch, remainingBatch] : [j]))
      );

      await fetchBackendJobCards();

      setSelectedMovementJob(null);
      setIncompleteRemarks('');
      showToast(
        `Incomplete Movement logged: ${parsedMoveQty} PCBs moved to ${nextStage}, ${remainingPcb} PCBs retained at ${selectedMovementJob.currentStageName} due to "${effectiveReason}"`,
        'success'
      );
    });
  };

  // Print Window Trigger
  const triggerPrint = () => {
    window.print();
  };

  // Export Production WIP Cards to Excel with rich formatting & auto column sizing
  const handleExportExcel = () => {
    const cardsToExport = filteredCards.length > 0 ? filteredCards : jobCards;
    if (cardsToExport.length === 0) {
      showToast('No job card data available to export.', 'error');
      return;
    }

    const exportDateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const totalPnl = cardsToExport.reduce((sum, j) => sum + (j.prodPnlQty || 0), 0);
    const totalPcb = cardsToExport.reduce((sum, j) => sum + (j.totalPcbQty || 0), 0);
    const totalSqm = cardsToExport.reduce((sum, j) => sum + (j.prodPnlAreaSqm || 0), 0);

    const formatDisplayDate = (dStr?: string) => {
      if (!dStr) return '-';
      try {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return dStr;
      }
    };

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Production WIP Jobs</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          .title-row { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: left; padding: 12px; height: 35px; }
          .subtitle-row { background-color: #1e293b; color: #cbd5e1; font-size: 10pt; font-weight: bold; text-align: left; padding: 8px; }
          .header-cell { background-color: #1e3a8a; color: #ffffff; font-size: 11pt; font-weight: bold; text-align: center; border: 1px solid #1e40af; padding: 8px 12px; white-space: nowrap; }
          .data-cell { border: 1px solid #cbd5e1; font-size: 10pt; padding: 6px 10px; vertical-align: middle; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; }
          .badge-unlaunched { background-color: #f1f5f9; color: #475569; font-weight: bold; border: 1px solid #cbd5e1; padding: 3px 8px; display: inline-block; text-align: center; }
          .badge-progress { background-color: #dbeafe; color: #1e40af; font-weight: bold; border: 1px solid #93c5fd; padding: 3px 8px; display: inline-block; text-align: center; }
          .badge-completed { background-color: #d1fae5; color: #065f46; font-weight: bold; border: 1px solid #6ee7b7; padding: 3px 8px; display: inline-block; text-align: center; }
          .badge-urgent { color: #dc2626; font-weight: bold; }
          .badge-high { color: #d97706; font-weight: bold; }
          .total-row { background-color: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: bold; font-size: 11pt; }
        </style>
      </head>
      <body>
        <table>
          <!-- Report Header Banner -->
          <tr>
            <th colspan="14" class="title-row">R.F. ELECTRO TECH ERP — PRODUCTION WIP REPORT</th>
          </tr>
          <tr>
            <td colspan="14" class="subtitle-row">
              Generated Date: ${exportDateStr} &nbsp;|&nbsp; Total Active Jobs: ${cardsToExport.length} &nbsp;|&nbsp; Total WIP Quantity: ${totalPnl} PNL (${totalPcb} PCBs) &nbsp;|&nbsp; Total Floor Area: ${totalSqm.toFixed(2)} Sqm
            </td>
          </tr>
          <tr><td colspan="14" style="height: 10px;"></td></tr>

          <!-- Column Titles -->
          <thead>
            <tr>
              <th class="header-cell" style="width: 140px;">WIP Job Card No</th>
              <th class="header-cell" style="width: 220px;">Customer Part No / Description</th>
              <th class="header-cell" style="width: 120px;">RFE Part Code</th>
              <th class="header-cell" style="width: 130px;">Customer Code</th>
              <th class="header-cell" style="width: 120px;">Target Date</th>
              <th class="header-cell" style="width: 100px;">Priority</th>
              <th class="header-cell" style="width: 100px;">Prod PNL Qty</th>
              <th class="header-cell" style="width: 100px;">Cust PNL Qty</th>
              <th class="header-cell" style="width: 110px;">Total PCB Qty</th>
              <th class="header-cell" style="width: 110px;">WIP Area (Sqm)</th>
              <th class="header-cell" style="width: 160px;">Current Process Stage</th>
              <th class="header-cell" style="width: 120px;">Job Status</th>
              <th class="header-cell" style="width: 100px;">Sub-Lots</th>
              <th class="header-cell" style="width: 120px;">Creation Date</th>
            </tr>
          </thead>
          <tbody>
    `;

    cardsToExport.forEach((j) => {
      const isUnlaunched = j.status === 'UNLAUNCHED' || j.status === 'CREATED';
      const isCompleted = j.status === 'COMPLETED';

      const statusBadge = isUnlaunched
        ? `<span class="badge-unlaunched">UNLAUNCHED</span>`
        : isCompleted
        ? `<span class="badge-completed">COMPLETED</span>`
        : `<span class="badge-progress">IN PROGRESS</span>`;

      const stageDisplay = isUnlaunched
        ? `Pending Launch (1. SHEARING)`
        : isCompleted
        ? `19. PACKING (DONE)`
        : j.currentStageName || PF01_STAGES[0];

      const priorityClass =
        j.priority === 'MOST URGENT' ? 'badge-urgent' : j.priority === 'HIGH' ? 'badge-high' : '';

      tableHtml += `
        <tr>
          <td class="data-cell text-center font-mono" style="mso-number-format:'\\@';">${j.jobCardNo}</td>
          <td class="data-cell text-left" style="mso-number-format:'\\@';">${j.customerPartNo || '-'}</td>
          <td class="data-cell text-center font-mono" style="mso-number-format:'\\@';">${j.rfePartCode || '-'}</td>
          <td class="data-cell text-center" style="mso-number-format:'\\@';">${j.customerCode || '-'}</td>
          <td class="data-cell text-center" style="mso-number-format:'Short Date';">${formatDisplayDate(j.targetDate)}</td>
          <td class="data-cell text-center ${priorityClass}">${j.priority || 'NORMAL'}</td>
          <td class="data-cell text-right font-mono" style="mso-number-format:'\\#\\,\\#\\#0';">${j.prodPnlQty || 0}</td>
          <td class="data-cell text-right font-mono" style="mso-number-format:'\\#\\,\\#\\#0';">${j.custPnlQty || 0}</td>
          <td class="data-cell text-right font-mono" style="mso-number-format:'\\#\\,\\#\\#0';">${j.totalPcbQty || 0}</td>
          <td class="data-cell text-right font-mono" style="mso-number-format:'0\\.00';">${(j.prodPnlAreaSqm || 0).toFixed(2)} Sqm</td>
          <td class="data-cell text-center font-mono">${stageDisplay}</td>
          <td class="data-cell text-center">${statusBadge}</td>
          <td class="data-cell text-center font-mono">${j.subJobCards?.length || 1} Lot(s)</td>
          <td class="data-cell text-center" style="mso-number-format:'Short Date';">${formatDisplayDate(j.createdAt)}</td>
        </tr>
      `;
    });

    tableHtml += `
          <!-- Summary Total Row -->
          <tr class="total-row">
            <td colspan="6" class="data-cell text-right" style="font-weight: bold; background-color: #f1f5f9;">GRAND TOTAL WIP:</td>
            <td class="data-cell text-right font-mono" style="font-weight: bold; background-color: #f1f5f9;">${totalPnl} PNL</td>
            <td class="data-cell text-right font-mono" style="font-weight: bold; background-color: #f1f5f9;">${cardsToExport.reduce((s, j) => s + (j.custPnlQty || 0), 0)} PNL</td>
            <td class="data-cell text-right font-mono" style="font-weight: bold; background-color: #f1f5f9;">${totalPcb} PCB</td>
            <td class="data-cell text-right font-mono" style="font-weight: bold; background-color: #f1f5f9;">${totalSqm.toFixed(2)} Sqm</td>
            <td colspan="4" class="data-cell text-left" style="background-color: #f1f5f9; font-size: 9pt; color: #64748b;">${cardsToExport.length} Active Master Job Cards</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production_wip_job_cards_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported ${cardsToExport.length} Job Card(s) to formatted Excel Report!`, 'success');
  };

  // Per-column Search Filters
  const [colFilters, setColFilters] = useState({
    wipNo: '',
    product: '',
    productCode: '',
    customer: '',
    launch: '',
    target: '',
    priority: '',
    pndg: '',
    unit: '',
    area: '',
    stage: '',
    progress: '',
  });

  const [statusRadio, setStatusRadio] = useState<'All' | 'Unstarted' | 'Active' | 'Pending' | 'Done'>('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColFilters, setShowColFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered Cards based on per-column filters, global search, and radio status
  const filteredCards = jobCards.filter((jc) => {
    const matchesWip = !colFilters.wipNo || jc.jobCardNo.toLowerCase().includes(colFilters.wipNo.toLowerCase());
    const matchesProduct = !colFilters.product || jc.customerPartNo?.toLowerCase().includes(colFilters.product.toLowerCase());
    const matchesCode = !colFilters.productCode || jc.rfePartCode?.toLowerCase().includes(colFilters.productCode.toLowerCase());
    const matchesCust = !colFilters.customer || jc.customerCode?.toLowerCase().includes(colFilters.customer.toLowerCase());
    const matchesStage = !colFilters.stage || (jc.currentStageName || '').toLowerCase().includes(colFilters.stage.toLowerCase());
    const matchesPriority = !colFilters.priority || jc.priority.toLowerCase().includes(colFilters.priority.toLowerCase());
    
    const matchesGlobal =
      !globalSearch ||
      jc.jobCardNo.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (jc.customerPartNo || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
      (jc.rfePartCode || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
      (jc.customerCode || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
      (jc.currentStageName || '').toLowerCase().includes(globalSearch.toLowerCase());

    const matchesRadio =
      statusRadio === 'All'
        ? true
        : statusRadio === 'Active'
        ? jc.status === 'IN_PROGRESS'
        : statusRadio === 'Unstarted'
        ? jc.status === 'UNLAUNCHED' || jc.status === 'CREATED'
        : statusRadio === 'Done'
        ? jc.status === 'COMPLETED'
        : true;

    return matchesWip && matchesProduct && matchesCode && matchesCust && matchesStage && matchesPriority && matchesGlobal && matchesRadio;
  });

  const totalMasterCards = jobCards.length;
  const inProgressCount = jobCards.filter((j) => j.status === 'IN_PROGRESS').length;
  const totalSubLots = jobCards.reduce((acc, j) => acc + (j.subJobCards?.length || 1), 0);
  const activePnlCount = jobCards.reduce((acc, j) => acc + (j.prodPnlQty || 0), 0);
  const activePcbCount = jobCards.reduce((acc, j) => acc + (j.totalPcbQty || j.custPnlQty || ((j.prodPnlQty || 0) * 2)), 0);
  const activeSqmArea = jobCards.reduce((acc, j) => acc + (j.prodPnlAreaSqm || 0), 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'DONE':
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">DONE</span>;
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">ACTIVE</span>;
      case 'PENDING':
      case 'PAUSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">UNSTARTED</span>;
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '08-Sep-26';
    if (dateStr.includes('-') && dateStr.length >= 10) {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const yr = parts[0].slice(2);
        return `${parts[2]}-${months[mIdx] || parts[1]}-${yr}`;
      }
    }
    return dateStr;
  };

  return (
    <div className="space-y-5 p-3 sm:p-5 w-full max-w-[1600px] mx-auto pb-16 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      
      {/* 1. TOP HEADER BANNER CARD (Clean & Perfectly Aligned Layout) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Job Cards & Movement Flow
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider font-mono">
                PF-01 FLOW
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Track PCB Job Cards, scan barcodes, execute full or split stage movement from Launch to Packing.
            </p>

            {/* Sub Quick Navigation Shortcuts */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Link
                href="/job-cards/launch"
                onClick={(e) => {
                  // Allow opening inline launch modal directly if on desktop
                  if (!e.ctrlKey && !e.metaKey) {
                    // navigate to launch page
                  }
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all border border-amber-600 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Launch Page ↗</span>
              </Link>

              <Link
                href="/job-cards/movement"
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all border border-blue-500/40 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[3] text-amber-400" />
                <span>Job Movement Center ➔</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Actions: Role Selector, WIP Report Drawer, Add Job Card */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* RBAC Role Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 px-3 py-2 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={userRole}
              onChange={(e: any) => setUserRole(e.target.value)}
              className="bg-transparent font-bold text-slate-900 cursor-pointer outline-none text-xs"
            >
              <option value="MASTER">Master ID (Full Control)</option>
              <option value="SUPER_USER">Super User (All Stages)</option>
              <option value="NORMAL">Normal User ({assignedStage})</option>
            </select>
          </div>

          {/* Report Drawer Button */}
          <button
            onClick={() => setShowReportDrawer(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>WIP & Daily Report</span>
          </button>

          {/* Add New Job Card Button */}
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-amber-600"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADD NEW JOB CARD</span>
          </button>
        </div>
      </div>

      {/* 2. SECOND ROW SUMMARY CARDS & BARCODE SCANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
        
        {/* Card 1: Barcode Scanner / Fast Stage Movement */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2.5 min-h-[96px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px] font-black text-blue-900 uppercase tracking-wider shrink-0">
              <Scan className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">⚡ STAGE MOVEMENT SCANNER</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded hidden sm:inline-block">
              26-27-1729
            </span>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan QR or enter Job No (e.g. 1729)..."
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white placeholder-slate-400 shadow-2xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Scan & Move</span>
            </button>
          </form>
        </div>

        {/* Card 2: Active Job Cards */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex items-center gap-3 min-h-[96px]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTIVE JOB CARDS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {totalMasterCards} Master Cards
            </div>
            <div className="text-[11px] text-blue-700 font-semibold truncate">
              • {inProgressCount} Active in Prod ({totalSubLots} Lots)
            </div>
          </div>
        </div>

        {/* Card 3: Total Production PCB */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs flex items-center gap-3 min-h-[96px]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL PRODUCTION PCB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {activePcbCount} PCBs
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold truncate">
              • {activePcbCount} PCBs In-Progress
            </div>
          </div>
        </div>

        {/* Card 4: Total WIP Area */}
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs flex items-center gap-3 min-h-[96px]">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Split className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL WIP AREA</span>
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {activeSqmArea.toFixed(1)} Sqm
            </div>
            <div className="text-[11px] text-purple-700 font-semibold truncate">
              • {activeSqmArea.toFixed(1)} Sqm Active Floor
            </div>
          </div>
        </div>

      </div>

      {/* 3. THIRD ROW SEARCH BAR & STATUS COUNT PILLS (Matching Screenshot 2) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search Bar Input */}
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search by Job Card # (e.g. 26-27-1729), Part Code, Customer..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 placeholder-slate-400 shadow-2xs"
          />
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>

          <button
            onClick={() => setStatusRadio('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusRadio === 'All'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Cards</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[11px]">{totalMasterCards}</span>
          </button>

          <button
            onClick={() => setStatusRadio('Unstarted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusRadio === 'Unstarted'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>UNLAUNCHED</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[11px]">
              {jobCards.filter((j) => j.status === 'UNLAUNCHED' || j.status === 'CREATED').length}
            </span>
          </button>

          <button
            onClick={() => setStatusRadio('Active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusRadio === 'Active'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>IN PROGRESS</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[11px]">{inProgressCount}</span>
          </button>

          <button
            onClick={() => setStatusRadio('Done')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusRadio === 'Done'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>COMPLETED</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[11px]">
              {jobCards.filter((j) => j.status === 'COMPLETED').length}
            </span>
          </button>

          {/* Toggle Column Filters Button */}
          <button
            onClick={() => setShowColFilters(!showColFilters)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showColFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-extrabold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle per-column search filter inputs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showColFilters ? 'Hide Column Filters' : 'Column Filters'}</span>
          </button>
        </div>

      </div>

      {/* 4. FOURTH ROW: PRODUCTION JOBS (WIP) DATA TABLE (Matching Screenshot 1 & PDF Specs) */}
      <div className="border border-slate-300/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              {/* Row 1: Column Header Titles */}
              <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">WIP No.</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">Product</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[100px]">Product Code</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[110px]">Customer</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[90px] whitespace-nowrap">Launch</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[90px] whitespace-nowrap">Target</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] whitespace-nowrap">Priority</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[60px] text-right whitespace-nowrap">Pndg</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[50px] whitespace-nowrap">Unit</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Area</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[110px] whitespace-nowrap">Stage</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[110px] whitespace-nowrap">Progress</th>
                <th className="py-2.5 px-3 text-center min-w-[125px] whitespace-nowrap">Stage Movement</th>
              </tr>

              {/* Row 2: Per-Column Filter Inputs (Optionally toggled) */}
              {showColFilters && (
                <tr className="bg-slate-50/90 border-b border-slate-300">
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.wipNo}
                      onChange={(e) => setColFilters({ ...colFilters, wipNo: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.product}
                      onChange={(e) => setColFilters({ ...colFilters, product: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.productCode}
                      onChange={(e) => setColFilters({ ...colFilters, productCode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.customer}
                      onChange={(e) => setColFilters({ ...colFilters, customer: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.launch}
                      onChange={(e) => setColFilters({ ...colFilters, launch: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.target}
                      onChange={(e) => setColFilters({ ...colFilters, target: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.priority}
                      onChange={(e) => setColFilters({ ...colFilters, priority: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.pndg}
                      onChange={(e) => setColFilters({ ...colFilters, pndg: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.unit}
                      onChange={(e) => setColFilters({ ...colFilters, unit: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.area}
                      onChange={(e) => setColFilters({ ...colFilters, area: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.stage}
                      onChange={(e) => setColFilters({ ...colFilters, stage: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-300">
                    <input
                      type="text"
                      value={colFilters.progress}
                      onChange={(e) => setColFilters({ ...colFilters, progress: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </td>
                  <td className="p-1 text-center bg-slate-50"></td>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-xs font-mono">
                    No production jobs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredCards.map((jc, idx) => {
                  const isUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED';
                  const isCompleted = jc.status === 'COMPLETED';
                  const stageIndex = PF01_STAGES.indexOf(jc.currentStageName || PF01_STAGES[0]);
                  const progressPct = isUnlaunched ? 0 : isCompleted ? 100 : Math.round(((stageIndex + 1) / PF01_STAGES.length) * 100);

                  return (
                    <tr
                      key={jc.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        jc.isNewlyCreated
                          ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500 font-medium'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/60'
                      }`}
                    >
                      {/* WIP No. with Printer Icon */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowQrModal(jc)}
                            title="Print QR Sticker Tag"
                            className="text-amber-800 hover:text-amber-950 cursor-pointer p-0.5 shrink-0"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <span>{jc.jobCardNo}</span>
                          {jc.isNewlyCreated && (
                            <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded uppercase tracking-wider animate-pulse shrink-0 shadow-2xs">
                              NEW
                            </span>
                          )}
                          {jc.subJobCards && jc.subJobCards.length > 1 && (
                            <span className="text-[10px] text-slate-500 font-normal">({jc.subJobCards.length} Lots)</span>
                          )}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-900 truncate max-w-[200px]" title={jc.customerPartNo}>
                        {jc.customerPartNo}
                      </td>

                      {/* Product Code */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {jc.rfePartCode}
                      </td>

                      {/* Customer */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                        {jc.customerCode}
                      </td>

                      {/* Launch */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDateDisplay(jc.launchedAt || jc.createdAt)}
                      </td>

                      {/* Target */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDateDisplay(jc.targetDate)}
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                        <span
                          className={`font-bold text-[11px] ${
                            jc.priority === 'MOST URGENT' || jc.priority === 'HIGH'
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {jc.priority === 'MOST URGENT' ? 'Top' : jc.priority || 'Normal'}
                        </span>
                      </td>

                      {/* Pndg */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold text-slate-900 whitespace-nowrap">
                        {jc.totalPcbQty || jc.custPnlQty || (jc.prodPnlQty ? Math.round(jc.prodPnlQty * 2) : 0)}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                        PCBs
                      </td>

                      {/* Area */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold text-emerald-700 whitespace-nowrap">
                        {jc.custPnlAreaSqm ? jc.custPnlAreaSqm.toFixed(2) : (jc.prodPnlAreaSqm ? jc.prodPnlAreaSqm.toFixed(2) : '45.00')}
                      </td>

                      {/* Stage */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        {isUnlaunched ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            UNLAUNCHED
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            19. PACKING (DONE)
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                              {jc.currentStageName || PF01_STAGES[0]}
                            </span>
                            {jc.subJobCards && jc.subJobCards.length > 1 && (
                              <span className="text-[9px] text-slate-500 font-mono font-medium pl-1">
                                {jc.subJobCards.length} Sub-Lots Active
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden border border-slate-300/80">
                          <div
                            className={`h-full text-[9px] font-extrabold text-white flex items-center justify-center transition-all px-1 whitespace-nowrap ${
                              progressPct >= 100
                                ? 'bg-emerald-600'
                                : progressPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(20, progressPct)}%` }}
                          >
                            {progressPct}%
                          </div>
                        </div>
                      </td>

                      {/* Stage Movement Action Button & Super Admin Delete Option */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMovementJob(jc);
                              setPartialMoveQty(Math.max(1, Math.floor((jc.totalPcbQty || 160) / 2)));
                              setMovementTab('VIEW');
                            }}
                            title="Open Stage Movement Confirmation & Options"
                            className="h-7 px-3 bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-lg border border-amber-600/90 text-[11px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                          >
                            <RefreshCw className="w-3 h-3 stroke-[3]" />
                            <span>Move Stage ➔</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(jc)}
                            title="Edit Job Card Parameters"
                            className="h-7 w-7 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteConfirmCard(jc)}
                              title="Delete Job Card (Super Admin Only)"
                              className="h-7 w-7 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar: Export to Excel & Pagination Controls */}
        <div className="bg-slate-100/90 border-t border-slate-300 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-slate-700">
          <div>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Export to Excel
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
            <div>
              Page <input type="text" value={currentPage} readOnly className="w-8 text-center bg-white border border-slate-300 rounded py-0.5 font-bold" /> of 40
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer">|&lt;&lt;</button>
              <button className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer">&lt;</button>
              <button className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer">&gt;</button>
              <button className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer">&gt;&gt;|</button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div>
              View 1 - {filteredCards.length} of {totalMasterCards}
            </div>
          </div>
        </div>
      </div>



      {/* MODAL 1: ADD NEW JOB CARD */}
      {showGenerateModal && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingCardId ? `Edit Job Card Parameters (${launchForm.jobCardNo})` : 'New Job Card Creation & Launch'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingCardId ? 'Modify PCB parameters and update existing job card record' : 'Fill job parameters to generate QR code & launch into production'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-700 text-base font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleLaunchJobCard} className="space-y-4 text-xs">
              
              {/* Job Card Photo Attachment Field */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Job Card Photo (Attach Original Physical Job Card Photo) *</span>
                  </label>
                  {launchForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Full
                    </button>
                  )}
                </div>

                <div className="space-y-2 font-sans">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="jobCardPhotoFileInput"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (uploadEvt) => {
                            const res = uploadEvt.target?.result as string;
                            if (res) {
                              setLaunchForm({ ...launchForm, photoUrl: res });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />

                    <label
                      htmlFor="jobCardPhotoFileInput"
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Upload Photo from Device / Camera</span>
                    </label>

                    {launchForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setLaunchForm({ ...launchForm, photoUrl: '' })}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={launchForm.photoUrl}
                      onChange={(e) => setLaunchForm({ ...launchForm, photoUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                      placeholder="Or paste image URL directly..."
                    />
                    {launchForm.photoUrl && (
                      <img
                        src={launchForm.photoUrl}
                        alt="Job Card Photo Preview"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 1: Job Card No, Launch Date & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Launch Date *</label>
                  <input
                    type="date"
                    required
                    value={launchForm.launchDate}
                    onChange={(e) => setLaunchForm({ ...launchForm, launchDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={launchForm.targetDate}
                    onChange={(e) => setLaunchForm({ ...launchForm, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
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

              {/* Row 3: Priority, Total PCB Qty, Total PCB Area (Sqm), Job Flow Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority *</label>
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
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Total PCB Qty *</label>
                  <input
                    type="number"
                    required
                    value={launchForm.totalPcbQty || ''}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 0;
                      const pnlCount = Math.ceil(qty / 4) || 10;
                      const calculatedArea = Number((qty * unitPcbAreaSqm).toFixed(2));
                      setLaunchForm({
                        ...launchForm,
                        totalPcbQty: qty,
                        prodPnlQty: pnlCount,
                        custPnlQty: pnlCount * 2,
                        custPnlAreaSqm: calculatedArea,
                        prodPnlAreaSqm: Number((calculatedArea * 1.1).toFixed(2)),
                      });
                    }}
                    className="w-full bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none shadow-2xs"
                    placeholder="160"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Total PCB Area (Sqm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={launchForm.custPnlAreaSqm || ''}
                    onChange={(e) => {
                      const area = Number(e.target.value) || 0;
                      const newUnitArea = launchForm.totalPcbQty > 0 ? area / launchForm.totalPcbQty : 0.28125;
                      setUnitPcbAreaSqm(newUnitArea);
                      setLaunchForm({
                        ...launchForm,
                        custPnlAreaSqm: area,
                        prodPnlAreaSqm: Number((area * 1.1).toFixed(2)),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    placeholder="45"
                  />
                  <p className="text-[10px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Auto-calculated: {launchForm.totalPcbQty || 0} PCBs × {unitPcbAreaSqm.toFixed(4)} Sqm/PCB
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Flow Selection *</label>
                  <select
                    value={launchForm.jobFlowSelection}
                    onChange={(e) => setLaunchForm({ ...launchForm, jobFlowSelection: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="PF-01">PF-01 Standard Flow (19 Stages)</option>
                  </select>
                </div>
              </div>

              {/* Pre-Launch Sub-Job Card Split Builder (PDF Section 3) */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-amber-700" />
                    <span className="font-extrabold text-amber-950 text-xs">Pre-Launch Sub-Job Card Lot Splitting</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={launchForm.enablePreSplit}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const total = launchForm.prodPnlQty || 40;
                        const half = Math.floor(total / 2);
                        setLaunchForm({
                          ...launchForm,
                          enablePreSplit: enabled,
                          customSplits: enabled
                            ? [
                                { subNo: `${launchForm.jobCardNo}-1`, qty: half },
                                { subNo: `${launchForm.jobCardNo}-2`, qty: total - half },
                              ]
                            : [],
                        });
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-amber-900">Divide into Sub-Job Cards</span>
                  </label>
                </div>

                {launchForm.enablePreSplit && (
                  <div className="space-y-2.5 pt-1">
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-800 font-bold uppercase font-mono">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const total = launchForm.prodPnlQty || 40;
                          const h = Math.floor(total / 2);
                          setLaunchForm({
                            ...launchForm,
                            customSplits: [
                              { subNo: `${launchForm.jobCardNo}-1`, qty: h },
                              { subNo: `${launchForm.jobCardNo}-2`, qty: total - h },
                            ],
                          });
                        }}
                        className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Split 2 Lots
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const total = launchForm.prodPnlQty || 40;
                          const part = Math.floor(total / 4);
                          const rem = total - part * 3;
                          setLaunchForm({
                            ...launchForm,
                            customSplits: [
                              { subNo: `${launchForm.jobCardNo}-1`, qty: part },
                              { subNo: `${launchForm.jobCardNo}-2`, qty: part },
                              { subNo: `${launchForm.jobCardNo}-3`, qty: part },
                              { subNo: `${launchForm.jobCardNo}-4`, qty: rem },
                            ],
                          });
                        }}
                        className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Split 4 Lots
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const count = launchForm.customSplits.length + 1;
                          setLaunchForm({
                            ...launchForm,
                            customSplits: [
                              ...launchForm.customSplits,
                              { subNo: `${launchForm.jobCardNo}-${count}`, qty: 5 },
                            ],
                          });
                        }}
                        className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        + Add Lot
                      </button>
                    </div>

                    {/* Sub-Job Cards Items List */}
                    <div className="space-y-1.5">
                      {launchForm.customSplits.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-200">
                          <input
                            type="text"
                            value={item.subNo}
                            onChange={(e) => {
                              const updated = [...launchForm.customSplits];
                              updated[idx].subNo = e.target.value;
                              setLaunchForm({ ...launchForm, customSplits: updated });
                            }}
                            className="w-32 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold"
                          />
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span>Qty:</span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...launchForm.customSplits];
                                updated[idx].qty = Number(e.target.value);
                                setLaunchForm({ ...launchForm, customSplits: updated });
                              }}
                              className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-blue-700"
                            />
                            <span>PCB</span>
                          </div>
                          {launchForm.customSplits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = launchForm.customSplits.filter((_, i) => i !== idx);
                                setLaunchForm({ ...launchForm, customSplits: updated });
                              }}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer ml-auto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sum Validation Warning */}
                    {(() => {
                      const sum = launchForm.customSplits.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
                      const target = launchForm.prodPnlQty || 40;
                      const isValid = sum === target;
                      return (
                        <div className={`p-2 rounded-lg text-[11px] font-bold flex items-center justify-between ${isValid ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                          <span>Sum of Sub-Lots: {sum} PCB / Total: {target} PCB</span>
                          <span>{isValid ? '✓ Valid Split' : '⚠️ Must equal Total PCB'}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
                  <span>LAUNCH JOB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* MODAL 2: JOB MOVEMENT OPTIONS (Wide Horizontal Landscape Dashboard View) */}
      {selectedMovementJob && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
            <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 overflow-hidden font-sans">
              
              {/* 1. Fixed Sticky Header (High-Tech Wide Header with Integrated Tab Switcher) */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        JOB CARD DASHBOARD & MOVEMENT
                      </span>
                    </div>
                    <h3 className="font-black text-white text-xl sm:text-2xl flex items-center gap-3 mt-0.5 font-mono tracking-tight">
                      <span className="text-amber-300">{selectedMovementJob.jobCardNo}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-500/40 font-bold font-sans flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Stage: {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                      </span>
                    </h3>
                  </div>
                </div>

                {/* Horizontal Segmented Pill Tab Switcher in Header */}
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1.5 text-xs font-sans shadow-inner">
                    <button
                      onClick={() => setMovementTab('VIEW')}
                      className={`py-2 px-3 sm:px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        movementTab === 'VIEW'
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 shrink-0" />
                      <span>A. Job Card View</span>
                    </button>

                    <button
                      onClick={() => setMovementTab('FULL')}
                      className={`py-2 px-3 sm:px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        movementTab === 'FULL'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 shrink-0" />
                      <span>B. Full Movement</span>
                    </button>

                    <button
                      onClick={() => setMovementTab('PARTIAL')}
                      className={`py-2 px-3 sm:px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        movementTab === 'PARTIAL'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Split className="w-4 h-4 shrink-0" />
                      <span>C. Uncompleted / Split</span>
                    </button>
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setDeleteConfirmCard(selectedMovementJob)}
                      title="Delete this Job Card (Super Admin Only)"
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm border border-rose-500 shrink-0 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete Job Card</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedMovementJob(null)}
                    className="text-slate-400 hover:text-white text-sm font-bold p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all shrink-0 border border-slate-800/80 flex items-center justify-center w-10 h-10 active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 2. Scrollable Body Content (Horizontal Multi-Column Layout) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">

                {/* TAB A: JOB CARD VIEW (HORIZONTAL 2-COLUMN SIDE-BY-SIDE LAYOUT) */}
                {movementTab === 'VIEW' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
                    
                    {/* LEFT COLUMN: Physical Photo + Specs Grid + PO/Product Info (7 Cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* Photo View Card */}
                      {selectedMovementJob.photoUrl && (
                        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 border border-blue-200/90 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative group shrink-0">
                              <img
                                src={selectedMovementJob.photoUrl}
                                alt="Job Card Photo"
                                className="w-12 h-12 rounded-xl object-cover border border-blue-300/80 shadow-2xs cursor-pointer group-hover:scale-105 transition-transform"
                                onClick={() => setPhotoLightbox(selectedMovementJob.photoUrl || null)}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center pointer-events-none">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Original Job Card Physical Photo</span>
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">Verified physical hard-copy record attached</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPhotoLightbox(selectedMovementJob.photoUrl || null)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 active:scale-95 border border-blue-500/40"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Photo</span>
                          </button>
                        </div>
                      )}

                      {/* Specifications Main Container */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-4 font-sans shadow-xs">
                        <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2 font-extrabold text-slate-900 tracking-tight">
                            <FileText className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                            Job Card Specifications & Details
                          </span>
                          {getStatusBadge(selectedMovementJob.status)}
                        </div>
                        
                        {/* 4-Column Horizontal Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">JOB CARD NO</span>
                            <strong className="text-slate-900 font-mono text-sm block mt-0.5 font-black">{selectedMovementJob.jobCardNo}</strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">CURRENT STAGE</span>
                            <span className="inline-block mt-0.5 font-extrabold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">
                              {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                            </span>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">CUSTOMER CODE</span>
                            <strong className="text-slate-900 font-bold block mt-0.5 truncate">{selectedMovementJob.customerCode || 'CUST-RF045'}</strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">CUSTOMER PART NO</span>
                            <strong className="text-slate-900 font-bold block mt-0.5 truncate" title={selectedMovementJob.customerPartNo}>
                              {selectedMovementJob.customerPartNo}
                            </strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">R.F.E. PART CODE</span>
                            <strong className="text-blue-800 font-mono font-bold block mt-0.5 text-xs bg-blue-50/60 px-2 py-0.5 rounded border border-blue-100 inline-block">
                              {selectedMovementJob.rfePartCode || 'D3625'}
                            </strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">PRIORITY</span>
                            <span className={`inline-block mt-0.5 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-lg border ${
                              selectedMovementJob.priority === 'MOST URGENT'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : selectedMovementJob.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {selectedMovementJob.priority || 'NORMAL'}
                            </span>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">TARGET DATE</span>
                            <strong className="text-slate-900 font-mono block mt-0.5 font-bold">{selectedMovementJob.targetDate}</strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">TOTAL PCB QTY</span>
                            <strong className="text-indigo-700 font-mono font-black block mt-0.5 text-sm">
                              {selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || Math.round((selectedMovementJob.prodPnlQty || 0) * 2)} PCBs
                            </strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">WIP AREA</span>
                            <strong className="text-emerald-700 font-mono font-black block mt-0.5">{selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm} Sqm</strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors col-span-2 sm:col-span-1 md:col-span-3">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">JOB FLOW</span>
                            <strong className="text-slate-800 font-mono block mt-0.5 font-bold">{selectedMovementJob.jobFlowSelection || 'PF-01 Standard'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Sub-Job Lots Breakdown + Quick Actions (5 Cols) */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                      
                      <div className="space-y-4">
                        {/* Sub-Job Lots Breakdown Box */}
                        {selectedMovementJob.subJobCards && selectedMovementJob.subJobCards.length > 0 && (
                          <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/40 border border-amber-300/80 p-4 rounded-2xl space-y-3 font-sans shadow-xs">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Split className="w-4 h-4 text-amber-700 shrink-0" />
                                SUB-JOB LOTS BREAKDOWN ({selectedMovementJob.subJobCards.length} LOTS)
                              </h5>
                              <span className="text-xs text-amber-900 font-mono font-black bg-amber-200/80 px-2.5 py-0.5 rounded-lg border border-amber-400/80 shadow-2xs">
                                Total: {selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || Math.round((selectedMovementJob.prodPnlQty || 0) * 2)} PCBs
                              </span>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {selectedMovementJob.subJobCards.map((sub) => {
                                const sPcb = (sub as any).totalPcbQty || (sub as any).qty || selectedMovementJob.totalPcbQty || 160;

                                return (
                                  <div key={sub.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans shadow-2xs hover:border-amber-400 transition-all">
                                    <div className="flex items-center gap-2 font-mono">
                                      <strong className="text-slate-900 font-bold bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">{sub.subJobCardNo}</strong>
                                      <span className="text-[10px] text-slate-400">QR: {sub.qrCodeValue}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-[11px]">
                                        {sPcb} PCBs
                                      </span>
                                      <span className="font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                        {sub.currentStage?.name || selectedMovementJob.currentStageName}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Immediate Launch Action if UNLAUNCHED */}
                        {(selectedMovementJob.status === 'UNLAUNCHED' || selectedMovementJob.status === 'CREATED') && (
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                            <div>
                              <p className="font-extrabold text-emerald-950 text-xs">Job Card is Unlaunched</p>
                              <p className="text-[11px] text-emerald-700 mt-0.5">Click Launch to release into Stage 1 Production</p>
                            </div>
                            <button
                              onClick={() => {
                                handleLaunchExistingJobCard(selectedMovementJob.id);
                                setSelectedMovementJob(null);
                              }}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0 border border-emerald-500/40"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>LAUNCH NOW</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Column Bottom Actions */}
                      <div className="space-y-2.5 font-sans pt-2">
                        {selectedMovementJob.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleMarkAsCompleted(selectedMovementJob.id)}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all active:scale-98 border border-emerald-500/30"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>MARK JOB CARD AS COMPLETED (Stage 19 PACKING)</span>
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => setShowQrModal(selectedMovementJob)}
                            className="py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 border border-slate-800"
                          >
                            <QrCode className="w-4 h-4 text-amber-400" />
                            <span>VIEW & PRINT QR TAG</span>
                          </button>

                          <a
                            href={`/job-cards-pdf/${selectedMovementJob.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md text-center transition-all active:scale-98 border border-amber-600/80"
                          >
                            <FileText className="w-4 h-4" />
                            <span>OPEN JOB CARD PDF</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB B: FULL MOVEMENT (HORIZONTAL SIDE-BY-SIDE) */}
                {movementTab === 'FULL' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs font-sans">
                    <div className="lg:col-span-6 bg-blue-50/80 border border-blue-200 p-5 rounded-2xl text-blue-950 space-y-3 shadow-2xs flex flex-col justify-between">
                      <div>
                        <p className="font-black text-blue-900 text-sm flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                          Full Lot Stage Movement Confirmation
                        </p>
                        <p className="text-xs leading-relaxed text-blue-950 mt-2">
                          Are you sure you want to move Job Card No. <strong className="text-slate-900 font-mono font-black">{selectedMovementJob.jobCardNo}</strong> ({selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || 160} PCBs, {selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45} Sqm) to the next process stage?
                        </p>
                      </div>
                      <div className="p-3 font-bold text-blue-900 bg-white rounded-xl border border-blue-200 font-mono text-xs shadow-2xs">
                        Next Stage: <span className="text-blue-700 font-extrabold">{PF01_STAGES[selectedMovementJob.currentStageIndex + 1] || '19. PACKING (COMPLETED)'}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Movement Remarks Category *</label>
                        <select
                          value={fullMoveRemarkType}
                          onChange={(e) => setFullMoveRemarkType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                        >
                          <option value="Clear Movement">Clear Movement (No issues)</option>
                          <option value="Rejection">Rejection</option>
                          <option value="Rework">Rework</option>
                          <option value="Process issue">Process issue</option>
                          <option value="Other relevant remarks">Other relevant movement remarks</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Remarks Details (Optional)</label>
                        <textarea
                          rows={3}
                          value={fullMoveRemarks}
                          onChange={(e) => setFullMoveRemarks(e.target.value)}
                          placeholder="Enter optional stage movement remarks..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={handleFullJobMovement}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-98 border border-blue-500/40"
                        >
                          CONFIRM FULL MOVEMENT ({selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || 160} PCBs ➔ Next Stage)
                        </button>

                        {selectedMovementJob.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleMarkAsCompleted(selectedMovementJob.id)}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98 border border-emerald-500/40"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>MARK AS COMPLETED & READY FOR DISPATCH</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB C: UNCOMPLETED / SPLIT MOVEMENT (HORIZONTAL SIDE-BY-SIDE) */}
                {movementTab === 'PARTIAL' && (() => {
                  const masterPcb = selectedMovementJob.totalPcbQty || selectedMovementJob.custPnlQty || Math.round((selectedMovementJob.prodPnlQty || 0) * 2) || 160;
                  const parsedMoveQty = typeof partialMoveQty === 'number' ? partialMoveQty : (parseInt(String(partialMoveQty), 10) || 0);
                  const validMoveQty = Math.min(Math.max(1, parsedMoveQty), Math.max(1, masterPcb - 1));
                  const remPcb = Math.max(0, masterPcb - validMoveQty);
                  const totalArea = selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45;
                  const movedArea = Number(((validMoveQty * totalArea) / masterPcb).toFixed(2));
                  const remArea = Number(((remPcb * totalArea) / masterPcb).toFixed(2));

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs font-sans">
                      <div className="lg:col-span-5 bg-amber-50/80 border border-amber-200 p-5 rounded-2xl text-amber-950 space-y-2 shadow-2xs flex flex-col justify-between">
                        <div>
                          <p className="font-black text-amber-900 flex items-center gap-2 text-sm">
                            <Split className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                            Uncompleted / Partial Job Movement (PCB Split)
                          </p>
                          <p className="mt-2 text-xs text-amber-900/90 leading-relaxed">
                            Required when complete PCB lot is not ready to move forward. Enter exact PCB quantity moving to next stage.
                          </p>
                        </div>
                        <div className="space-y-2 pt-3">
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 font-medium">
                            <div className="font-bold text-emerald-900">Next Stage: {PF01_STAGES[selectedMovementJob.currentStageIndex + 1] || 'COMPLETED'}</div>
                            <div className="text-sm font-black text-emerald-700 font-mono mt-1">{validMoveQty} PCBs Moved</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Area: {movedArea} Sqm
                            </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-950 font-medium">
                            <div className="font-bold text-amber-900">Stays at: {selectedMovementJob.currentStageName}</div>
                            <div className="text-sm font-black text-amber-700 font-mono mt-1">{remPcb} PCBs Balance</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Area: {remArea} Sqm
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs flex flex-col justify-between">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Quantity Ready to Move Forward (PCBs) *
                              </label>
                              <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                = {validMoveQty} PCBs
                              </span>
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={masterPcb - 1}
                              value={partialMoveQty}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setPartialMoveQty('');
                                } else {
                                  const parsed = parseInt(raw, 10);
                                  setPartialMoveQty(isNaN(parsed) ? '' : parsed);
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                              placeholder={`Enter PCBs (1 to ${masterPcb - 1})`}
                            />
                            {parsedMoveQty >= masterPcb && (
                              <p className="text-[11px] text-rose-600 font-bold mt-1">
                                ⚠ Quantity cannot exceed {masterPcb - 1} PCBs (Total Lot: {masterPcb} PCBs).
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-amber-900 mb-1">
                              Pending Work Reason:
                            </label>
                            <select
                              value={incompletePendingReason}
                              onChange={(e) => setIncompletePendingReason(e.target.value)}
                              className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
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

                          {incompletePendingReason === 'Other / Custom Pending Reason' && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Specify Custom Pending Reason:
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Special Gold Finger Plating Inspection Pending"
                                value={incompleteCustomReason}
                                onChange={(e) => setIncompleteCustomReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Work Notes / Incomplete Movement Remarks:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Enter specific work details pending on remaining PCBs..."
                              value={incompleteRemarks}
                              onChange={(e) => setIncompleteRemarks(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handlePartialJobMovement}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer border border-amber-600 active:scale-98 mt-2"
                        >
                          CONFIRM PARTIAL MOVEMENT ({validMoveQty} PCBs Forward • {remPcb} PCBs Balance)
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 3: QR CODE STICKER / TAG PRINT MODAL */}
      {showQrModal && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
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
        </Portal>
      )}

      {/* MODAL 4: WIP & Daily Movement Report Drawer */}
      {showReportDrawer && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex justify-end animate-in fade-in duration-200">
            {/* Backdrop Click Handler */}
            <div className="absolute inset-0" onClick={() => setShowReportDrawer(false)} />

            {/* Drawer Panel */}
            <div className="relative bg-white border-l border-slate-200 w-full max-w-2xl h-screen flex flex-col shadow-2xl text-slate-900 font-sans z-10">
            
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
                  <p className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Total WIP PCBs</p>
                  <p className="text-base sm:text-lg font-black text-emerald-950 mt-0.5 font-mono">{activePcbCount} PCBs</p>
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
                        <th className="py-2.5 px-3 text-center font-bold">PCB Qty</th>
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

                        const pcbSum =
                          activeMasterJobs.reduce((s, j) => s + (j.totalPcbQty || j.custPnlQty || ((j.prodPnlQty || 0) * 2)), 0) +
                          activeSubJobs.reduce((s, sub) => s + ((sub as any).totalPcbQty || (sub.qty * 2)), 0);

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
                                <span className="font-extrabold text-blue-700">{pcbSum}</span>
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
                        <td className="py-2.5 px-3 text-center font-black text-blue-700">{activePcbCount} PCBs</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">{activeSqmArea.toFixed(1)} Sqm</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delay Monitoring Section */}
              <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-2">
                <h5 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-rose-600" />
                  DELAY MONITORING & TARGET DATE COMPLIANCE
                </h5>
                <div className="text-xs text-rose-950 space-y-1.5 font-sans">
                  <div className="flex justify-between items-center border-b border-rose-200/80 pb-1">
                    <span>Overdue Jobs (Target Date Expired):</span>
                    <strong className="text-rose-700 font-mono font-black">
                      {jobCards.filter((j) => j.status === 'IN_PROGRESS' && new Date(j.targetDate) < new Date()).length} Jobs
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-rose-200/80 pb-1">
                    <span>Over-Delayed Jobs (&gt; 3 Days Late):</span>
                    <strong className="text-rose-800 font-mono font-black">
                      {jobCards.filter((j) => {
                        const target = new Date(j.targetDate);
                        const today = new Date();
                        const diffDays = (today.getTime() - target.getTime()) / (1000 * 3600 * 24);
                        return j.status === 'IN_PROGRESS' && diffDays > 3;
                      }).length} Jobs
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Jobs Exceeding Target Date:</span>
                    <strong className="text-rose-900 font-mono font-black">
                      {jobCards.filter((j) => j.status === 'IN_PROGRESS' && new Date(j.targetDate) < new Date()).length} Jobs Exceeded
                    </strong>
                  </div>
                </div>
              </div>

              {/* Quality / Loss Monitoring Section */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 mb-4">
                <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  QUALITY & LOSS MONITORING (DAILY MOVEMENT)
                </h5>
                <div className="text-xs text-emerald-950 space-y-1.5 font-sans">
                  <div className="flex justify-between items-center border-b border-emerald-200/80 pb-1">
                    <span>Total Daily Rework Jobs:</span>
                    <strong className="text-amber-800 font-mono font-black">0 Jobs Reworked</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-200/80 pb-1">
                    <span>Total Daily Rejection / Scrap:</span>
                    <strong className="text-emerald-800 font-mono font-black">0 PCB Scrap (100% Quality Yield)</strong>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Overall Factory Production Yield:</span>
                    <strong className="text-emerald-700 font-mono font-black">100% Yield Efficiency</strong>
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
        </Portal>
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

      {/* MODAL 6: PRINTABLE INDUSTRIAL JOB CARD QR & BARCODE TRAVELER TAG (Full Horizontal Professional View) */}
      {showQrModal && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 my-auto">
              <JobCardQrTag
                jobCard={showQrModal}
                onPrint={() => window.print()}
                onClose={() => setShowQrModal(null)}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 5: ORIGINAL JOB CARD PHOTO LIGHTBOX */}
      {photoLightbox && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="relative bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-4 space-y-3 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm font-mono">Original Job Card Physical Photo</h3>
                </div>
                <button
                  onClick={() => setPhotoLightbox(null)}
                  className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-2xl p-2">
                <img
                  src={photoLightbox}
                  alt="Original Job Card High-Res Photo"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Verification of Original Hard Copy Physical Job Card</span>
                <button
                  onClick={() => window.open(photoLightbox, '_blank')}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Open Original Image ↗
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 6: DELETE JOB CARD CONFIRMATION (Super Admin Only) */}
      {deleteConfirmCard && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 font-sans">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <Trash2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Delete Job Card</h3>
                  <p className="text-xs text-rose-600 font-semibold">Super Admin Privileged Action</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <p className="text-slate-600 font-medium leading-relaxed">
                  Are you sure you want to permanently delete Job Card <strong className="text-slate-900 font-mono font-black">{deleteConfirmCard.jobCardNo}</strong>?
                </p>
                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                  <div><span className="text-slate-400">Customer Part:</span> <strong className="text-slate-800">{deleteConfirmCard.customerPartNo}</strong></div>
                  <div><span className="text-slate-400">Customer Code:</span> <strong className="text-slate-800">{deleteConfirmCard.customerCode}</strong></div>
                  <div><span className="text-slate-400">Quantity:</span> <strong className="text-indigo-700">{deleteConfirmCard.totalPcbQty || deleteConfirmCard.custPnlQty || (deleteConfirmCard.prodPnlQty * 2)} PCBs</strong></div>
                </div>
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> This will delete all associated sub-lots & stage logs. Action cannot be undone!
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmCard(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteJobCard(deleteConfirmCard.id)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
