'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Scan,
  Settings,
  Upload,
  History
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { getApiBaseUrl } from '@/lib/utils';


// Process Flow PF-01 19 Predefined Stages (Matching Database ProcessStage Master)
const PF01_STAGES = [
  '1. SHEARING',
  '2. DRILLING',
  '3. DRL-QC',
  '4. PTH',
  '5. PTH-QC',
  '6. PHOTO PRINTING',
  '7. PHOTO-QC',
  '8. PATTERN PLATING',
  '9. ETCHING',
  '10. ETCHING-QC',
  '11. SOLDER MASK',
  '12. SOLDER MASK-QC',
  '13. LEGEND PRINTING',
  '14. HAL / ENIG',
  '15. PUNCHING / ROUTING',
  '16. E-TESTING',
  '17. FINAL QC',
  '18. PACKING',
  '19. DISPATCH',
];

const normalizeStageIndex = (stageName?: string | null): number => {
  if (!stageName) return 0;
  const s = stageName.trim().toLowerCase();

  const numMatch = s.match(/^(\d+)\./);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 19) return num - 1;
    if (num >= 20) return 17; // PACKING
  }

  if (s.includes('shear') || s.includes('cutting')) return 0;
  if (s.includes('drl-qc') || s.includes('drill-qc')) return 2;
  if (s.includes('drill')) return 1;
  if (s.includes('pth-qc') || s.includes('pit-qc')) return 4;
  if (s.includes('pth') || s.includes('dml') || s.includes('pit')) return 3;
  if (s.includes('photo-qc')) return 6;
  if (s.includes('photo printing') || s.includes('photo')) return 5;
  if (s.includes('pattern plating')) return 7;
  if (s.includes('plating')) return 7;
  if (s.includes('etching-qc')) return 9;
  if (s.includes('etching') || s.includes('etch')) return 8;
  if (s.includes('premask') || s.includes('aoi')) return 8;
  if (s.includes('solder mask-qc')) return 11;
  if (s.includes('solder mask') || s.includes('solder') || s.includes('pism-qc')) return 11;
  if (s.includes('pism')) return 10;
  if (s.includes('hasl-qc')) return 13;
  if (s.includes('hasl') || s.includes('hal') || s.includes('enig')) return 13;
  if (s.includes('legend printing') || s.includes('legend') || s.includes('silk')) return 12;
  if (s.includes('punching') || s.includes('routing') || s.includes('rout') || s.includes('cnc')) return 14;
  if (s.includes('vg') || s.includes('v-cut') || s.includes('vcut')) return 14;
  if (s.includes('e-testing') || s.includes('bbt') || s.includes('bare board') || s.includes('testing')) return 15;
  if (s.includes('final qc') || s.includes('fqc')) return 16;
  if (s.includes('pdi') || s.includes('aql')) return 17;
  if (s.includes('pack')) return 17;
  if (s.includes('dispatch')) return 18;

  const foundIdx = PF01_STAGES.findIndex(
    (stg) => stg.toLowerCase() === s || stg.toLowerCase().includes(s) || s.includes(stg.toLowerCase())
  );
  return foundIdx >= 0 ? foundIdx : 0;
};



interface SubJobCard {
  id: string;
  subJobCardNo: string;
  qty: number;
  totalPcbQty?: number;
  status: string;
  qrCodeValue: string;
  currentStage?: { id: string; name: string } | null;
}

interface RejectionLog {
  stageName: string;
  rejectedPcbQty: number;
  rejectedAreaSqm: number;
  remark: string;
  timestamp: string;
}

interface JobCard {
  id: string;
  parentJobCardId?: string;
  jobCardNo: string;
  subJobCardNo?: string;
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
    name?: string;
    code?: string;
    specCardNo?: string;
    layers?: number;
    thickness?: string;
    thicknessMm?: number | string;
    copper?: string;
    copperWeight?: string;
    solderMask?: string;
    surfaceFinish?: string;
    materialType?: string;
    material?: string;
  };
  subJobCards: SubJobCard[];
  isNewlyCreated?: boolean;
  rejectedPcbQty?: number;
  rejectedAreaSqm?: number;
  rejectionLogs?: RejectionLog[];
}


// Printable Horizontal Industrial Job Card QR Tag Component
const JobCardQrTag = ({ jobCard, onPrint, onClose }: { jobCard: JobCard; onPrint?: () => void; onClose?: () => void }) => {
  const [serverHost, setServerHost] = useState<string>('https://rf-electro-tech-erp.onrender.com');
  const [liveDetails, setLiveDetails] = useState<{
    product?: any;
    customerPO?: any;
  } | null>(null);
  const [isFetchingSpecs, setIsFetchingSpecs] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_qr_server_host');
      if (saved) setServerHost(saved);
    }
  }, []);

  // Fetch 100% Live DB specs and customer PO directly from API
  useEffect(() => {
    let isMounted = true;
    const fetchFreshData = async () => {
      setIsFetchingSpecs(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const targetId = jobCard.id || jobCard.jobCardNo;
        if (targetId) {
          const res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetId)}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data) {
              setLiveDetails({
                product: data.product,
                customerPO: data.customerPO,
              });
              setIsFetchingSpecs(false);
              return;
            }
          }
        }

        // Secondary Lookup: If product spec card exists in products master
        if (jobCard.rfePartCode) {
          const res = await fetch(`${getApiBaseUrl()}/products`, { headers });
          if (res.ok) {
            const prods = await res.json();
            if (Array.isArray(prods)) {
              const matched = prods.find((p: any) => p.specCardNo === jobCard.rfePartCode || p.code === jobCard.customerPartNo);
              if (isMounted && matched) {
                setLiveDetails((prev) => ({ ...prev, product: matched }));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Live spec lookup failed, using local job card data', err);
      } finally {
        if (isMounted) setIsFetchingSpecs(false);
      }
    };

    fetchFreshData();
    return () => { isMounted = false; };
  }, [jobCard.id, jobCard.jobCardNo, jobCard.rfePartCode, jobCard.customerPartNo]);

  const [isEditingHost, setIsEditingHost] = useState(false);

  const handleSaveHost = (newHost: string) => {
    const cleaned = newHost.trim();
    setServerHost(cleaned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_qr_server_host', cleaned);
      localStorage.setItem('erp_backend_api_url', cleaned);
    }
  };

  const formattedHost = serverHost.startsWith('http://') || serverHost.startsWith('https://') 
    ? serverHost 
    : `http://${serverHost}`;

  const pdfDocumentUrl = `${formattedHost}/job-cards-pdf/${jobCard.id || jobCard.jobCardNo}`;

  // Live merged Product & PO Data (Prioritize live DB record, fallback to attached jobCard fields, NEVER mock strings)
  const product = liveDetails?.product || jobCard.product;
  const customerPO = liveDetails?.customerPO || jobCard.customerPO;

  // Accurate Numeric Calculations & Clean Formatting (No float glitch like 61.87500000000001)
  const totalPcbs = jobCard.totalPcbQty || (jobCard.custPnlQty && jobCard.custPnlQty > 50 ? jobCard.custPnlQty : (jobCard.prodPnlQty ? jobCard.prodPnlQty * 4 : 0));
  const rawAreaSqm = Number(jobCard.prodPnlAreaSqm || jobCard.custPnlAreaSqm || 0);
  const formattedArea = rawAreaSqm > 0 ? `${rawAreaSqm.toFixed(2)} SQM` : '— SQM';

  // Live Product Specs Extraction
  const specLayers = product?.layers ? `${product.layers} Layers` : (jobCard.product?.layers ? `${jobCard.product.layers} Layers` : '—');
  const specThickness = product?.thicknessMm 
    ? `${product.thicknessMm} mm` 
    : (product?.thickness ? (String(product.thickness).includes('mm') ? product.thickness : `${product.thickness} mm`) : (jobCard.product?.thicknessMm ? `${jobCard.product.thicknessMm} mm` : (jobCard.product?.thickness || '—')));
  const specCopper = product?.copperWeight || product?.copper || jobCard.product?.copperWeight || jobCard.product?.copper || '—';
  const specFinish = product?.surfaceFinish || jobCard.product?.surfaceFinish || '—';
  const specMask = product?.solderMask || jobCard.product?.solderMask || '—';
  const specMaterial = product?.materialType || product?.material || jobCard.product?.materialType || 'FR-4';

  // Real Customer PO information without fake mock fallback
  const poNo = customerPO?.poNo || (jobCard.customerPoId ? `PO: ${jobCard.customerPoId.slice(0, 8)}...` : 'Direct Order (No PO)');
  const custCompany = customerPO?.customer?.companyName || jobCard.customerCode || 'Direct Customer';

  const qrDataPayload = [
    pdfDocumentUrl,
    `--------------------------------------`,
    `RF ELECTRO TECH ERP - INDUSTRIAL TRAVELER TAG`,
    `JOB CARD NO: ${jobCard.jobCardNo}`,
    `CUSTOMER: ${custCompany}`,
    `RFE PART CODE: ${jobCard.rfePartCode || 'N/A'}`,
    `CUST PART NO: ${jobCard.customerPartNo || 'N/A'}`,
    `TOTAL PCB QTY: ${totalPcbs} PCB`,
    `WIP AREA: ${rawAreaSqm > 0 ? rawAreaSqm.toFixed(2) : '0'} SQM`,
    `CURRENT STAGE: ${jobCard.currentStageName || PF01_STAGES[0]}`,
    `PRIORITY: ${jobCard.priority || 'NORMAL'}`,
    `TARGET DATE: ${jobCard.targetDate || 'N/A'}`,
    `STATUS: ${jobCard.status || 'CREATED'}`,
    product?.layers ? `LAYERS: ${product.layers}L` : '',
    product?.thicknessMm ? `THICKNESS: ${product.thicknessMm}mm` : '',
    product?.copperWeight ? `COPPER: ${product.copperWeight}` : '',
    product?.surfaceFinish ? `FINISH: ${product.surfaceFinish}` : '',
  ].filter(Boolean).join('\n');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;
  const barcodeImageUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(jobCard.jobCardNo)}&scale=3&rotate=N&includetext`;

  const priorityBadgeStyle = 
    jobCard.priority === 'MOST URGENT' ? 'bg-rose-500 text-white border-rose-600 animate-pulse' :
    jobCard.priority === 'HIGH' ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' :
    'bg-emerald-500 text-white border-emerald-600 font-bold';

  return (
    <div className="bg-white border-2 border-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-5xl w-full mx-auto text-slate-900 font-sans print:shadow-none print:border-black space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md border border-slate-900 shrink-0">
            <Printer className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isFetchingSpecs ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></span>
              <h4 className="text-xs font-black tracking-widest uppercase text-slate-900 font-mono">
                RF ELECTRO TECH ERP • INDUSTRIAL TRAVELER TAG
              </h4>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-950 mt-0.5 tracking-tight flex items-center gap-3">
              <span>{jobCard.jobCardNo}</span>
              <span className={`text-xs px-3 py-0.5 rounded-lg border uppercase tracking-wider ${priorityBadgeStyle}`}>
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
                  {jobCard.subJobCardNo || jobCard.jobCardNo}
                </strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER</span>
                <span className="font-bold text-slate-900 truncate block">{custCompany}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">RFE PART CODE</span>
                <span className="font-mono font-extrabold text-blue-700">{jobCard.rfePartCode || '—'}</span>
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
              *{jobCard.subJobCardNo || jobCard.jobCardNo}*
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
                  onClick={() => handleSaveHost('https://rf-electro-tech-erp.onrender.com')}
                  className="w-full px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold text-left cursor-pointer flex items-center justify-between"
                >
                  <span>🌐 Public World URL (5G/4G Anywhere)</span>
                  <span className="font-mono text-[9px] opacity-80">onrender.com</span>
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

        {/* MIDDLE COLUMN: Specifications Grid & Live Product Specs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50/80 border border-slate-300 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                JOB PARAMETERS & PRODUCTION SPECS
              </h5>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isFetchingSpecs ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  {isFetchingSpecs ? 'Syncing...' : 'LIVE SPECS'}
                </span>
              </div>
            </div>

            {/* 6 Primary Job Parameter Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER PART NO</span>
                <strong className="text-slate-900 font-bold block truncate text-xs" title={jobCard.customerPartNo}>
                  {jobCard.customerPartNo || '—'}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">R.F.E. PART CODE</span>
                <strong className="text-blue-700 font-mono font-black block text-xs tracking-tight">
                  {jobCard.rfePartCode || '—'}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TOTAL PCB QTY</span>
                <strong className="text-indigo-700 font-mono font-black block text-xs">
                  {totalPcbs} PCB
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TOTAL WIP AREA</span>
                <strong className="text-emerald-700 font-mono font-black block text-xs">
                  {formattedArea}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CURRENT STAGE</span>
                <span className="inline-block font-extrabold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-full">
                  {jobCard.currentStageName || PF01_STAGES[0]}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">TARGET DATE</span>
                <strong className="text-slate-900 font-mono font-bold block text-xs">
                  {jobCard.targetDate || '—'}
                </strong>
              </div>
            </div>

            {/* LIVE PRODUCT SPECIFICATIONS SHOWCASE */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black text-slate-900 font-mono uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  PRODUCT SPECIFICATIONS (LIVE DB)
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                  {product?.name || jobCard.customerPartNo || 'PCB Board'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">LAYERS</span>
                  <span className="text-[11px] font-mono font-extrabold text-slate-900">{specLayers}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">THICKNESS</span>
                  <span className="text-[11px] font-mono font-extrabold text-slate-900">{specThickness}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">COPPER</span>
                  <span className="text-[11px] font-mono font-extrabold text-slate-900">{specCopper}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">FINISH</span>
                  <span className="text-[11px] font-mono font-extrabold text-blue-700 truncate block">{specFinish}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">MASK</span>
                  <span className="text-[11px] font-mono font-extrabold text-emerald-700 truncate block">{specMask}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">MATERIAL</span>
                  <span className="text-[11px] font-mono font-extrabold text-slate-800 truncate block">{specMaterial}</span>
                </div>
              </div>
            </div>

            {/* CUSTOMER & PO INFO CARD */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER PO</span>
                <span className="font-mono font-bold text-slate-900 text-xs truncate block">{poNo}</span>
              </div>
              <div className="text-right min-w-0 flex-1 pl-2">
                <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">CUSTOMER</span>
                <span className="font-bold text-slate-700 text-xs truncate block">{custCompany}</span>
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
                {totalPcbs} PCBs
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(jobCard.subJobCards && jobCard.subJobCards.length > 0 ? jobCard.subJobCards : [{ id: 'sub-single', subJobCardNo: jobCard.subJobCardNo || jobCard.jobCardNo, totalPcbQty: totalPcbs }]).map((sub) => {
                const subPcb = (sub as any).totalPcbQty || ((sub as any).qty && (sub as any).qty > 50 ? (sub as any).qty : totalPcbs);
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
    if (cards.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_CARDS_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(cards));
    }
  } catch (err) {
    console.warn('Failed to persist job cards to localStorage', err);
  }
};



export default function JobCardsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
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
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [serverHost, setServerHost] = useState<string>('rf-electro-tech-erp.onrender.com');
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);
  const [unitPcbAreaSqm, setUnitPcbAreaSqm] = useState<number>(0.28125);

  // Server Connection Diagnostic State
  const [serverConnectionState, setServerConnectionState] = useState<{
    status: 'CONNECTED' | 'DISCONNECTED' | 'MIXED_CONTENT_BLOCKED' | 'CHECKING';
    url: string;
    message?: string;
  }>({ status: 'CHECKING', url: '' });

  // Partial Split Pending Reason Options
  const [incompletePendingReason, setIncompletePendingReason] = useState<string>('Drilling & Hole Check Pending');
  const [incompleteCustomReason, setIncompleteCustomReason] = useState<string>('');
  const [incompleteRemarks, setIncompleteRemarks] = useState<string>('');

  // Track recently deleted IDs to prevent re-appearing during sync polling
  const recentlyDeletedIds = useRef<Set<string>>(new Set());

  // Available Products from Master for Live Specs & Auto-population
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/products`, {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAvailableProducts(data);
      })
      .catch((err) => console.warn('Product master list fetch failed:', err));
  }, []);

  // Set client mount state & load initial stored cards
  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredJobCards();
    if (stored !== null) {
      setJobCards(stored);
    }
  }, []);

  // Save jobCards to localStorage as reliable cache and offline persistence
  useEffect(() => {
    if (isMounted && jobCards.length > 0) {
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

  const handleDeleteJobCard = async (target: JobCard | string) => {
    if (!target) return;

    // Resolve targetCard and target identifiers
    const targetIdFromParam = typeof target === 'string' ? target : target.id;
    const targetCard = typeof target === 'object'
      ? target
      : jobCards.find(
          (j) => j.id === targetIdFromParam || j.jobCardNo === targetIdFromParam || j.subJobCardNo === targetIdFromParam
        );

    const targetId = targetCard?.id || targetIdFromParam;
    const cardNo = targetCard?.jobCardNo || (typeof target === 'string' ? target : '');
    const subCardNo = targetCard?.subJobCardNo || '';
    const parentId = (targetCard as any)?.parentJobCardId;

    // Prevent duplicate or overlapping deletion request for the same card
    if (deletingCardId && (deletingCardId === targetId || (cardNo && deletingCardId === cardNo))) {
      return;
    }

    setDeletingCardId(targetId || cardNo || 'active');

    // Immediately close modal so user does not get confused or double-click
    setDeleteConfirmCard(null);

    // Track deleted IDs in recentlyDeletedIds to prevent polling sync from re-adding before DB settles
    const idsToRemember = [targetId, cardNo, subCardNo].filter((x): x is string => Boolean(x && typeof x === 'string' && x.trim()));
    idsToRemember.forEach((delId) => recentlyDeletedIds.current.add(delId));
    setTimeout(() => {
      idsToRemember.forEach((delId) => recentlyDeletedIds.current.delete(delId));
    }, 10000);

    // Safe positive-retention UI update: Keep every card UNLESS it explicitly matches this target card
    const targetIdsToDelete = new Set<string>(idsToRemember);
    const updated = jobCards.filter((jc) => {
      if (!jc) return false;
      if (jc.id && targetIdsToDelete.has(jc.id)) return false;
      if (jc.jobCardNo && targetIdsToDelete.has(jc.jobCardNo)) return false;
      if (jc.subJobCardNo && targetIdsToDelete.has(jc.subJobCardNo)) return false;
      if (parentId && typeof parentId === 'string' && (jc as any).parentJobCardId === parentId) return false;
      return true;
    });

    setJobCards(updated);
    saveJobCardsToStorage(updated);

    if (selectedMovementJob && (
      (targetId && selectedMovementJob.id === targetId) ||
      (cardNo && selectedMovementJob.jobCardNo === cardNo)
    )) {
      setSelectedMovementJob(null);
    }

    let backendDeleteSuccess = false;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Prefer exact jobCardNo or exact UUID
      const primaryDeleteId = cardNo || targetId;
      const res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(primaryDeleteId)}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok || res.status === 404) {
        backendDeleteSuccess = true;
      } else if (targetId && targetId !== primaryDeleteId) {
        // Fallback with UUID if primary delete was by cardNo
        const fallbackRes = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          headers,
        });
        if (fallbackRes.ok || fallbackRes.status === 404) {
          backendDeleteSuccess = true;
        }
      }
    } catch (err: any) {
      console.warn('Backend DELETE call failed or offline mode', err);
    } finally {
      setDeletingCardId(null);
      if (backendDeleteSuccess) {
        showToast('Job Card deleted successfully!', 'success');
      } else {
        showToast('Job Card removed locally.', 'info');
      }
      // Refetch from backend to confirm multi-device sync state
      await fetchBackendJobCards();
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
    jobCardNo: '',
    photoUrl: '',
    customerPartNo: '',
    rfePartCode: '',
    customerCode: '',
    targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    launchDate: new Date().toISOString().split('T')[0],
    priority: 'NORMAL' as 'MOST URGENT' | 'HIGH' | 'NORMAL',
    prodPnlQty: 40,
    custPnlQty: 80,
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    custPnlAreaSqm: 45,
    jobFlowSelection: 'PF-01',
    autoLaunch: false,
    enablePreSplit: false,
    splitCount: 2,
    customSplits: [{ subNo: '1', qty: 80 }, { subNo: '2', qty: 80 }],
    layers: 2,
    thicknessMm: 1.6,
    copperWeight: '1oz',
    surfaceFinish: 'HASL Lead-Free',
    solderMask: 'Green',
    materialType: 'FR-4',
  });

  const handleOpenCreateModal = () => {
    setEditingCardId(null);
    const nextNo = `26-27-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setLaunchForm({
      jobCardNo: nextNo,
      photoUrl: '',
      customerPartNo: '',
      rfePartCode: '',
      customerCode: '',
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
      layers: 2,
      thicknessMm: 1.6,
      copperWeight: '1oz',
      surfaceFinish: 'HASL Lead-Free',
      solderMask: 'Green',
      materialType: 'FR-4',
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
      layers: card.product?.layers || 2,
      thicknessMm: Number(card.product?.thicknessMm) || 1.6,
      copperWeight: card.product?.copperWeight || card.product?.copper || '1oz',
      surfaceFinish: card.product?.surfaceFinish || 'HASL Lead-Free',
      solderMask: card.product?.solderMask || 'Green',
      materialType: card.product?.materialType || 'FR-4',
    });
    setShowGenerateModal(true);
  };

  // Sync state from backend API if available
  const fetchBackendJobCards = useCallback(async () => {
    const targetUrl = getApiBaseUrl();
    setServerConnectionState((prev) => ({ ...prev, url: targetUrl }));

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl.startsWith('http:')) {
      setServerConnectionState({
        status: 'MIXED_CONTENT_BLOCKED',
        url: targetUrl,
        message: 'Browser blocked insecure HTTP API request on HTTPS Vercel. Use LAN link (http://<SERVER_IP>:3000) or an HTTPS backend URL!',
      });
      return;
    }

    try {
      const res = await fetch(`${targetUrl}/job-cards`, {
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
          'Bypass-Tunnel-Reminder': 'true',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (res.ok) {
        setServerConnectionState({ status: 'CONNECTED', url: targetUrl });
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: JobCard[] = data.flatMap((j: any) => {
            const masterPcbQty = j.totalPcbQty || (j.custPnlQty && j.custPnlQty > 50 ? j.custPnlQty : (j.prodPnlQty ? j.prodPnlQty * 4 : 160));
            const masterAreaSqm = j.custPnlAreaSqm || j.prodPnlAreaSqm || 45;

            const subLots = Array.isArray(j.subJobCards) ? j.subJobCards : [];
            if (subLots.length > 0) {
              const mappedSubs: JobCard[] = subLots.map((sub: any) => {
                const subPcbQty = sub.totalPcbQty || sub.qty || masterPcbQty;
                const subAreaSqm = sub.custPnlAreaSqm || sub.prodPnlAreaSqm || masterAreaSqm;
                const rawStage = sub.currentStage?.name || j.currentStageName || PF01_STAGES[0];
                let stageIdx = sub.currentStage?.defaultOrder
                  ? Math.min(Math.max(0, sub.currentStage.defaultOrder - 1), 18)
                  : normalizeStageIndex(rawStage);
                if (stageIdx < 0) stageIdx = 0;

                const jStatusRaw = String(j.status || '').toUpperCase();
                const subStatusRaw = String(sub.status || '').toUpperCase();
                const isParentLaunched = jStatusRaw === 'IN_PROGRESS' || jStatusRaw === 'COMPLETED';

                let subStatusNorm = 'IN_PROGRESS';
                if (jStatusRaw === 'COMPLETED' || subStatusRaw === 'COMPLETED' || stageIdx >= 18) {
                  subStatusNorm = 'COMPLETED';
                } else if (isParentLaunched || subStatusRaw === 'IN_STAGE' || subStatusRaw === 'IN_PROGRESS') {
                  subStatusNorm = 'IN_PROGRESS';
                } else {
                  subStatusNorm = 'UNLAUNCHED';
                }

                const finalSubNo = j.jobCardNo;

                return {
                  id: sub.id,
                  parentJobCardId: j.id,
                  jobCardNo: j.jobCardNo,
                  subJobCardNo: finalSubNo,
                  photoUrl: j.photoUrl || '',
                  customerPartNo: j.customerPartNo || j.product?.code || '',
                  rfePartCode: j.rfePartCode || j.product?.specCardNo || '',
                  customerCode: j.customerCode || j.customerPO?.customer?.code || '',
                  targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '2026-09-28',
                  priority: j.priority || 'NORMAL',
                  prodPnlQty: Math.ceil(subPcbQty / 4),
                  custPnlQty: subPcbQty,
                  totalPcbQty: subPcbQty,
                  prodPnlAreaSqm: subAreaSqm,
                  custPnlAreaSqm: subAreaSqm,
                  jobFlowSelection: j.processFlowMaster?.name || 'PF-01',
                  currentStageIndex: stageIdx,
                  currentStageName: PF01_STAGES[stageIdx] || rawStage,
                  customerPoId: j.customerPoId,
                  productId: j.productId,
                  totalQty: subPcbQty,
                  status: subStatusNorm as any,
                  isNewlyCreated: subStatusNorm === 'UNLAUNCHED',
                  qrCodeValue: sub.qrCodeValue || j.qrCodeValue || `${j.jobCardNo}-PARENT`,
                  launchedAt: j.launchedAt,
                  completedAt: j.completedAt,
                  createdAt: j.createdAt,
                  customerPO: j.customerPO,
                  product: j.product,
                  subJobCards: subLots,
                  rejectedPcbQty: j.rejectedPcbQty || 0,
                  rejectedAreaSqm: j.rejectedAreaSqm || 0,
                  rejectionLogs: j.rejectionLogs || [],
                };
              });

              // AUTOMATIC LOT REUNIFICATION / MERGE:
              // If multiple sub-lots of the same Job Card are at the same stage,
              // automatically consolidate them into 1 unified traveler lot (e.g. 250 + 250 = 500 PCBs)
              const stageMap = new Map<string, JobCard>();
              mappedSubs.forEach((item) => {
                const groupKey = `${item.currentStageIndex}-${item.status}`;
                const existing = stageMap.get(groupKey);
                if (existing) {
                  const combinedQty = (existing.totalPcbQty || 0) + (item.totalPcbQty || 0);
                  const combinedArea = Number(((existing.custPnlAreaSqm || 0) + (item.custPnlAreaSqm || 0)).toFixed(2));
                  const combinedRejQty = (existing.rejectedPcbQty || 0) + (item.rejectedPcbQty || 0);
                  const combinedRejArea = Number(((existing.rejectedAreaSqm || 0) + (item.rejectedAreaSqm || 0)).toFixed(2));
                  const combinedLogs = [...(existing.rejectionLogs || []), ...(item.rejectionLogs || [])];
                  stageMap.set(groupKey, {
                    ...existing,
                    totalPcbQty: combinedQty,
                    custPnlQty: combinedQty,
                    prodPnlQty: Math.ceil(combinedQty / 4),
                    custPnlAreaSqm: combinedArea,
                    prodPnlAreaSqm: combinedArea,
                    rejectedPcbQty: combinedRejQty,
                    rejectedAreaSqm: combinedRejArea,
                    rejectionLogs: combinedLogs,
                  });
                } else {
                  stageMap.set(groupKey, item);
                }
              });

              return Array.from(stageMap.values());
            }

            const rawStage = j.currentStageName || j.currentStage?.name || (j.status === 'COMPLETED' ? '20. PACKING' : PF01_STAGES[0]);
            let stageIdx = normalizeStageIndex(rawStage);
            const jStatusRaw = String(j.status || '').toUpperCase();
            let jStatusNorm = (jStatusRaw === 'CREATED' || jStatusRaw === 'PENDING_LAUNCH' || jStatusRaw === 'UNLAUNCHED') ? 'UNLAUNCHED' : (j.status || 'IN_PROGRESS');

            if (jStatusNorm === 'COMPLETED' || stageIdx >= 18) {
              stageIdx = Math.min(stageIdx, 18);
            }

            return [{
              id: j.id,
              parentJobCardId: j.id,
              jobCardNo: j.jobCardNo,
              subJobCardNo: j.jobCardNo,
              photoUrl: j.photoUrl || '',
              customerPartNo: j.customerPartNo || j.product?.code || '',
              rfePartCode: j.rfePartCode || j.product?.specCardNo || '',
              customerCode: j.customerCode || j.customerPO?.customer?.code || '',
              targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '2026-09-28',
              priority: j.priority || 'NORMAL',
              prodPnlQty: Math.ceil(masterPcbQty / 4),
              custPnlQty: masterPcbQty,
              totalPcbQty: masterPcbQty,
              prodPnlAreaSqm: masterAreaSqm,
              custPnlAreaSqm: masterAreaSqm,
              jobFlowSelection: j.processFlowMaster?.name || 'PF-01',
              currentStageIndex: stageIdx,
              currentStageName: PF01_STAGES[stageIdx] || rawStage,
              customerPoId: j.customerPoId,
              productId: j.productId,
              totalQty: masterPcbQty,
              status: jStatusNorm as any,
              isNewlyCreated: jStatusNorm === 'UNLAUNCHED',
              qrCodeValue: j.qrCodeValue || `${j.jobCardNo}-PARENT`,
              launchedAt: j.launchedAt,
              completedAt: j.completedAt,
              createdAt: j.createdAt,
              customerPO: j.customerPO,
              product: j.product,
              subJobCards: j.subJobCards || [],
              rejectedPcbQty: j.rejectedPcbQty || 0,
              rejectedAreaSqm: j.rejectedAreaSqm || 0,
              rejectionLogs: j.rejectionLogs || [],
            }];
          });


          // Server Database is 100% Single Source of Truth for Real-Time Multi-Device Sync
          // Filter out any recently deleted IDs to prevent re-appearing during sync
          const filtered = recentlyDeletedIds.current.size > 0
            ? mapped.filter((jc) => !recentlyDeletedIds.current.has(jc.id) && !recentlyDeletedIds.current.has(jc.jobCardNo) && !recentlyDeletedIds.current.has(jc.subJobCardNo || ''))
            : mapped;
          setJobCards(filtered);
          saveJobCardsToStorage(filtered);
        }
      } else {
        setServerConnectionState({
          status: 'DISCONNECTED',
          url: targetUrl,
          message: 'Backend server returned non-OK status.',
        });
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl.startsWith('http:')) {
        setServerConnectionState({
          status: 'MIXED_CONTENT_BLOCKED',
          url: targetUrl,
          message: 'Browser blocked insecure HTTP API request on HTTPS Vercel.',
        });
      } else {
        setServerConnectionState({
          status: 'DISCONNECTED',
          url: targetUrl,
          message: 'Cannot reach backend server.',
        });
      }
    }
  }, []);

  const handleSaveApiHost = (newHost: string) => {
    const cleaned = newHost.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_backend_api_url', cleaned);
      localStorage.setItem('erp_qr_server_host', cleaned);
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchBackendJobCards();
    const interval = setInterval(() => {
      fetchBackendJobCards();
    }, 2000);

    const onFocus = () => fetchBackendJobCards();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [fetchBackendJobCards]);

  // Movement Form & Rejection PCB State
  const [fullMoveRemarkType, setFullMoveRemarkType] = useState('Clear Movement');
  const [fullMoveRemarks, setFullMoveRemarks] = useState('');
  const [fullMoveRejectQty, setFullMoveRejectQty] = useState<number | string>(0);
  const [hasRejectionInMovement, setHasRejectionInMovement] = useState(false);
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

  // Traceability & Movement History State
  const [historyModalJob, setHistoryModalJob] = useState<JobCard | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchJobCardHistory = async (job: JobCard) => {
    setHistoryModalJob(job);
    setIsHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Query by jobCardNo first (canonical parent ID on backend)
      let rawLogs: any[] = [];
      const primaryTarget = job.jobCardNo || job.parentJobCardId || job.id;
      let res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(primaryTarget)}/history`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) rawLogs = data;
      } else if (job.id && job.id !== primaryTarget) {
        // Fallback with exact UUID if primary was by cardNo
        const fallbackRes = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(job.id)}/history`, { headers });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (Array.isArray(data)) rawLogs = data;
        }
      }

      // 2. Merge local rejection logs if any exist on this card
      if (job.rejectionLogs && job.rejectionLogs.length > 0) {
        const localRejLogs = job.rejectionLogs.map((r, i) => ({
          id: `rej-${i}-${Date.now()}`,
          createdAt: r.timestamp || new Date().toISOString(),
          subJobCard: { subJobCardNo: job.jobCardNo },
          stage: { name: r.stageName },
          qtyForwarded: 0,
          qtyRejected: r.rejectedPcbQty || 0,
          remarkType: 'REJECTION',
          remarks: `[REJECTION] ${r.remark} (${r.rejectedPcbQty} PCBs / ${r.rejectedAreaSqm} Sqm)`,
          createdBy: { name: 'Quality Operator' },
        }));
        const existingTimestamps = new Set(rawLogs.map((l: any) => l.createdAt));
        const filteredLocalRej = localRejLogs.filter((l) => !existingTimestamps.has(l.createdAt));
        rawLogs = [...filteredLocalRej, ...rawLogs];
      }

      // 3. If card is launched and in-progress, ensure current active stage is represented
      if (job.status !== 'UNLAUNCHED') {
        const activeStageName = job.currentStageName || PF01_STAGES[job.currentStageIndex || 0] || '1. SHEARING';
        const hasActiveLog = rawLogs.some((l) => l.stage?.name === activeStageName || String(l.remarks || '').includes(activeStageName));
        if (!hasActiveLog) {
          rawLogs.unshift({
            id: `active-curr-${job.id}`,
            createdAt: new Date().toISOString(),
            subJobCard: { subJobCardNo: job.jobCardNo },
            stage: { name: activeStageName },
            qtyForwarded: job.totalPcbQty || (job.custPnlQty && job.custPnlQty > 50 ? job.custPnlQty : 160),
            qtyProcessed: job.totalPcbQty || (job.custPnlQty && job.custPnlQty > 50 ? job.custPnlQty : 160),
            qtyRejected: job.rejectedPcbQty || 0,
            remarkType: 'CURRENT_STAGE',
            remarks: `Active at ${activeStageName} (${job.totalPcbQty || 160} PCBs in production)`,
            createdBy: { name: 'Production Floor' },
          });
        }
      }

      // 4. If still empty, synthesize Initial Launch entry
      if (rawLogs.length === 0) {
        rawLogs.push({
          id: `init-${job.id}`,
          createdAt: job.launchedAt || job.createdAt || new Date().toISOString(),
          subJobCard: { subJobCardNo: job.jobCardNo },
          stage: { name: '1. SHEARING (INITIAL LAUNCH)' },
          qtyForwarded: job.totalPcbQty || 160,
          qtyProcessed: job.totalPcbQty || 160,
          qtyRejected: 0,
          remarkType: 'INITIAL_LAUNCH',
          remarks: 'Job Card released to shop floor for production launch',
          createdBy: { name: 'Production Planner' },
        });
      }

      setHistoryLogs(rawLogs);
    } catch (err) {
      console.error('Failed to fetch job card history', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Check stage permission for movements
  const canUserMoveStage = (jobStageName: string) => {
    if (userRole === 'MASTER' || userRole === 'SUPER_USER' || isSuperAdmin) return true;
    if (userRole === 'NORMAL') {
      return !assignedStage || jobStageName.trim().toLowerCase() === assignedStage.trim().toLowerCase();
    }
    return true;
  };

  // Launch Existing Unlaunched Job Card
  const handleLaunchExistingJobCard = async (jobCardId: string) => {
    if (userRole === 'NORMAL') {
      showToast('Permission Denied: Normal Users cannot launch Job Cards.', 'error');
      return;
    }

    const targetJob = jobCards.find((j) => j.id === jobCardId || j.jobCardNo === jobCardId);
    let cardId = targetJob?.parentJobCardId || targetJob?.id || jobCardId;
    const cardNo = targetJob?.jobCardNo || jobCardId;

    runWithLoading(`Releasing Job Card ${cardNo} into Stage 1 Production (1. SHEARING)...`, async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // 1. Try launching by ID
        let launchTarget = encodeURIComponent(cardId);
        let res = await fetch(`${getApiBaseUrl()}/job-cards/${launchTarget}/launch`, {
          method: 'POST',
          headers,
        });

        // 2. Fallback: Try launching by Job Card No
        if (!res.ok && cardNo && cardNo !== cardId) {
          launchTarget = encodeURIComponent(cardNo);
          res = await fetch(`${getApiBaseUrl()}/job-cards/${launchTarget}/launch`, {
            method: 'POST',
            headers,
          });
        }

        // 3. Fallback: If card only existed in client memory, auto-create in DB with autoLaunch
        if (!res.ok && targetJob) {
          res = await fetch(`${getApiBaseUrl()}/job-cards/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jobCardNo: targetJob.jobCardNo,
              customerPartNo: targetJob.customerPartNo,
              rfePartCode: targetJob.rfePartCode,
              customerCode: targetJob.customerCode,
              targetDate: targetJob.targetDate,
              priority: targetJob.priority,
              totalPcbQty: targetJob.totalPcbQty || 160,
              prodPnlQty: targetJob.prodPnlQty || 40,
              custPnlQty: targetJob.custPnlQty || 160,
              prodPnlAreaSqm: targetJob.prodPnlAreaSqm || 50,
              custPnlAreaSqm: targetJob.custPnlAreaSqm || 45,
              jobFlowSelection: targetJob.jobFlowSelection || 'PF-01',
              autoLaunch: true,
            }),
          });

          if (res.ok) {
            const createdData = await res.json();
            if (createdData?.id) {
              cardId = createdData.id;
            }
          }
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          showToast(`Backend Launch Error (${res.status}): ${errText.slice(0, 80) || 'Server rejected launch'}`, 'error');
          return;
        }
      } catch (e: any) {
        showToast(`Backend launch failed: Server unreachable or network error`, 'error');
        return;
      }

      setJobCards((prev) =>
        prev.map((j) => {
          if (j.id === cardId || j.id === jobCardId || j.jobCardNo === cardNo || j.parentJobCardId === cardId) {
            return {
              ...j,
              status: 'IN_PROGRESS',
              currentStageIndex: 0,
              currentStageName: PF01_STAGES[0],
              launchedAt: new Date().toISOString(),
              isNewlyCreated: false,
            };
          }
          return j;
        })
      );

      await fetchBackendJobCards();
      showToast(`🚀 Job Card ${cardNo} launched successfully into Stage 1 (${PF01_STAGES[0]})`, 'success');
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
        subJobCardNo: jcNo,
        qty: Number(item.qty),
        totalPcbQty: Number(item.qty),
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
        qrCodeValue: jcNo,
        currentStage: { id: `stg-${idx + 1}`, name: PF01_STAGES[0] },
      }));

      apiSplits = launchForm.customSplits.map((s) => Number(s.qty));
    } else {
      subJobCardsList = [
        {
          id: `sub-${Date.now()}`,
          subJobCardNo: jcNo,
          qty: totalPcb,
          totalPcbQty: totalPcb,
          status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
          qrCodeValue: jcNo,
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
      const finalStatus = launchForm.autoLaunch
        ? 'IN_PROGRESS'
        : (existing.status && existing.status !== 'UNLAUNCHED' && existing.status !== 'CREATED' ? existing.status : 'UNLAUNCHED');

      const preservedSubCards = (launchForm.enablePreSplit && launchForm.customSplits.length > 0)
        ? subJobCardsList
        : (existing.subJobCards && existing.subJobCards.length > 0
            ? existing.subJobCards.map((s) => ({
                ...s,
                totalPcbQty: totalPcb,
                qty: s.qty || totalPcb,
                status: finalStatus as any,
              }))
            : subJobCardsList);

      const updatedJobCard: JobCard = {
        ...existing,
        jobCardNo: jcNo,
        photoUrl: launchForm.photoUrl,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: launchForm.targetDate,
        launchedAt: existing.launchedAt || (finalStatus === 'IN_PROGRESS' ? launchIsoDate : undefined),
        priority: launchForm.priority,
        totalPcbQty: totalPcb,
        custPnlQty: totalPcb,
        prodPnlQty: Math.ceil(totalPcb / 4),
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 45,
        prodPnlAreaSqm: Number(Number(launchForm.custPnlAreaSqm || 45) * 1.1) || 50,
        jobFlowSelection: launchForm.jobFlowSelection,
        status: finalStatus as any,
        subJobCards: preservedSubCards,
        isNewlyCreated: finalStatus === 'UNLAUNCHED',
        product: {
          ...existing.product,
          name: launchForm.customerPartNo,
          code: launchForm.customerPartNo,
          specCardNo: launchForm.rfePartCode,
          layers: Number(launchForm.layers) || 2,
          thicknessMm: Number(launchForm.thicknessMm) || 1.6,
          thickness: `${Number(launchForm.thicknessMm) || 1.6} mm`,
          copper: launchForm.copperWeight || '1oz',
          copperWeight: launchForm.copperWeight || '1oz',
          surfaceFinish: launchForm.surfaceFinish || 'HASL Lead-Free',
          solderMask: launchForm.solderMask || 'Green',
          materialType: launchForm.materialType || 'FR-4',
        },
      };

      runWithLoading(`Updating Job Card ${jcNo}...`, async () => {
        try {
          await fetch(`${getApiBaseUrl()}/job-cards/${existing.id}`, {
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
        saveJobCardsToStorage(jobCards.map((j, idx) => (idx === existingIndex ? updatedJobCard : j)));
        showToast(`Job Card ${jcNo} updated successfully!`, 'success');
        setShowGenerateModal(false);
        setEditingCardId(null);
        await fetchBackendJobCards();
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
          layers: Number(launchForm.layers) || 2,
          thicknessMm: Number(launchForm.thicknessMm) || 1.6,
          thickness: `${Number(launchForm.thicknessMm) || 1.6} mm`,
          copper: launchForm.copperWeight || '1oz',
          copperWeight: launchForm.copperWeight || '1oz',
          surfaceFinish: launchForm.surfaceFinish || 'HASL Lead-Free',
          solderMask: launchForm.solderMask || 'Green',
          materialType: launchForm.materialType || 'FR-4',
        },
        subJobCards: subJobCardsList,
        isNewlyCreated: !launchForm.autoLaunch,
      };

      // Backend POST API sync - MUST succeed before adding to state/localStorage
      try {
        const createRes = await fetch(`${getApiBaseUrl()}/job-cards/create`, {
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
            layers: Number(launchForm.layers) || 2,
            thicknessMm: Number(launchForm.thicknessMm) || 1.6,
            copperWeight: launchForm.copperWeight || '1oz',
            surfaceFinish: launchForm.surfaceFinish || 'HASL Lead-Free',
            solderMask: launchForm.solderMask || 'Green',
            materialType: launchForm.materialType || 'FR-4',
          }),
        });

        if (!createRes.ok) {
          const errorMsg = await createRes.text().catch(() => '');
          showToast(`Backend Create Error (${createRes.status}): ${errorMsg.slice(0, 80) || 'Server rejected creation'}`, 'error');
          return; // DO NOT add to local state if backend creation fails
        }

        const createdData = await createRes.json();
        if (createdData && createdData.id) {
          newJobCard.id = createdData.id;
        }
      } catch (err: any) {
        showToast(`Backend unreachable. Cannot create Job Card without server connection: ${err?.message || 'Network error'}`, 'error');
        return; // DO NOT add to local state if network fails
      }

      setJobCards((prev) => [newJobCard, ...prev]);
      setStatusRadio('All');
      setShowGenerateModal(false);
      setShowQrModal(newJobCard);
      setEditingCardId(null);
      await fetchBackendJobCards();

      showToast(
        `Job Card ${newJobCard.jobCardNo} created on server with ${subJobCardsList.length} sub-lot(s)! ${
          launchForm.autoLaunch ? 'Launched into Stage 1.' : 'Status is UNLAUNCHED.'
        }`,
        'success'
      );
    });
  };

  // 1-Click Direct Quick Stage Advance
  const handleQuickAdvanceStage = (card: JobCard) => {
    if (!canUserMoveStage(card.currentStageName)) {
      showToast(`Permission Denied: Operator assigned to "${assignedStage}" cannot move jobs out of "${card.currentStageName}".`, 'error');
      return;
    }

    const currentIdx = (card.currentStageIndex !== undefined && card.currentStageIndex >= 0)
      ? card.currentStageIndex
      : normalizeStageIndex(card.currentStageName);

    const nextIndex = currentIdx + 1;
    if (nextIndex >= PF01_STAGES.length) {
      showToast('Job Card has already reached the final PACKING stage!', 'info');
      return;
    }

    const nextStage = PF01_STAGES[nextIndex];
    const cardNo = card.jobCardNo;
    const subCardNo = card.subJobCardNo || card.jobCardNo;
    const cardId = card.id;

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    let updatedList: JobCard[] = [];
    setJobCards((prev) => {
      const otherItems = prev.filter((j) => j.id !== card.id);
      const existingNextIdx = otherItems.findIndex(
        (j) => j.jobCardNo === cardNo && j.currentStageName === nextStage && j.status !== 'COMPLETED'
      );

      if (existingNextIdx !== -1) {
        const target = otherItems[existingNextIdx];
        const mergedQty = (target.totalPcbQty || 0) + (card.totalPcbQty || 0);
        const mergedArea = Number(((target.custPnlAreaSqm || 0) + (card.custPnlAreaSqm || 0)).toFixed(2));
        const mergedCard: JobCard = {
          ...target,
          totalPcbQty: mergedQty,
          custPnlQty: mergedQty,
          prodPnlQty: Math.ceil(mergedQty / 4),
          custPnlAreaSqm: mergedArea,
          prodPnlAreaSqm: mergedArea,
          status: nextIndex === PF01_STAGES.length - 1 ? 'COMPLETED' : 'IN_PROGRESS',
        };
        updatedList = otherItems.map((j, idx) => (idx === existingNextIdx ? mergedCard : j));
      } else {
        updatedList = prev.map((j) =>
          j.id === card.id
            ? {
                ...j,
                currentStageIndex: nextIndex,
                currentStageName: nextStage,
                status: nextIndex === PF01_STAGES.length - 1 ? 'COMPLETED' : 'IN_PROGRESS',
                isNewlyCreated: false,
              }
            : j
        );
      }
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    showToast(`🚀 Sub-Lot ${subCardNo} moved to ${nextStage}`, 'success');

    // 2. NON-BLOCKING BACKGROUND SYNC
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const targetSubNo = subCardNo;
        const primaryTarget = encodeURIComponent(cardId || targetSubNo);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        let res = await fetch(`${getApiBaseUrl()}/job-cards/${primaryTarget}/move-stage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            cardId: cardId,
            subJobCardNo: targetSubNo,
            jobCardNo: cardNo,
            remark: `Quick Stage Movement to ${nextStage}`,
            remarkType: 'FULL_MOVEMENT',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok && targetSubNo && targetSubNo !== cardId) {
          const fallbackCtrl = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 3500);
          await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetSubNo)}/move-stage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              cardId: cardId,
              subJobCardNo: targetSubNo,
              jobCardNo: cardNo,
              remark: `Quick Stage Movement to ${nextStage}`,
              remarkType: 'FULL_MOVEMENT',
            }),
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimeout);
        }
      } catch (err: any) {
        console.warn('Backend stage move sync in background skipped or offline');
      }
    })();
  };

  // Full Lot Job Stage Movement with optional Rejection PCB Qty & Mandatory Remarks
  const handleFullJobMovement = () => {
    if (!selectedMovementJob) return;

    const currentPcb = selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4)) || 160;
    const currentArea = selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45;

    // Only apply rejection if user explicitly toggled rejection ON
    const rawReject = Number(fullMoveRejectQty) || 0;
    const rejectPcb = (hasRejectionInMovement && rawReject > 0) ? Math.min(rawReject, currentPcb) : 0;

    // Auto-populate remarks if user didn't type any so movement is NEVER blocked
    const effectiveRemarks = fullMoveRemarks.trim() || (
      rejectPcb > 0
        ? `${rejectPcb} PCB(s) marked as ${fullMoveRemarkType || 'Defect/Rejection'} at ${selectedMovementJob.currentStageName || 'Stage'}`
        : 'Clear stage movement'
    );

    const movedPcb = currentPcb - rejectPcb;
    const unitArea = currentPcb > 0 ? currentArea / currentPcb : 0.2;
    const movedArea = Number((movedPcb * unitArea).toFixed(2));
    const rejectArea = Number((rejectPcb * unitArea).toFixed(2));

    const currentIdx = (selectedMovementJob.currentStageIndex !== undefined && selectedMovementJob.currentStageIndex >= 0)
      ? selectedMovementJob.currentStageIndex
      : normalizeStageIndex(selectedMovementJob.currentStageName);

    const nextIndex = currentIdx + 1;
    if (nextIndex >= PF01_STAGES.length) {
      showToast('Job has already reached the final PACKING stage!', 'info');
      return;
    }

    const nextStage = PF01_STAGES[nextIndex];

    const updatedRejectedPcbQty = (selectedMovementJob.rejectedPcbQty || 0) + rejectPcb;
    const updatedRejectedAreaSqm = Number(((selectedMovementJob.rejectedAreaSqm || 0) + rejectArea).toFixed(2));
    const newRejectionLogs: RejectionLog[] = rejectPcb > 0 ? [
      ...(selectedMovementJob.rejectionLogs || []),
      {
        stageName: selectedMovementJob.currentStageName,
        rejectedPcbQty: rejectPcb,
        rejectedAreaSqm: rejectArea,
        remark: effectiveRemarks,
        timestamp: new Date().toISOString(),
      }
    ] : (selectedMovementJob.rejectionLogs || []);

    const targetSubNo = selectedMovementJob.subJobCardNo || selectedMovementJob.jobCardNo;
    const targetSubId = selectedMovementJob.id;
    const jobCardNo = selectedMovementJob.jobCardNo;

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    let updatedList: JobCard[] = [];
    setJobCards((prev) => {
      const otherItems = prev.filter((j) => j.id !== selectedMovementJob.id);
      const existingNextIdx = otherItems.findIndex(
        (j) => j.jobCardNo === jobCardNo && j.currentStageName === nextStage && j.status !== 'COMPLETED'
      );

      if (existingNextIdx !== -1) {
        const target = otherItems[existingNextIdx];
        const mergedQty = (target.totalPcbQty || 0) + movedPcb;
        const mergedArea = Number(((target.custPnlAreaSqm || 0) + movedArea).toFixed(2));
        const mergedCard: JobCard = {
          ...target,
          totalPcbQty: mergedQty,
          custPnlQty: mergedQty,
          prodPnlQty: Math.ceil(mergedQty / 4),
          custPnlAreaSqm: mergedArea,
          prodPnlAreaSqm: mergedArea,
          rejectedPcbQty: (target.rejectedPcbQty || 0) + updatedRejectedPcbQty,
          rejectedAreaSqm: Number(((target.rejectedAreaSqm || 0) + updatedRejectedAreaSqm).toFixed(2)),
          rejectionLogs: [...(target.rejectionLogs || []), ...newRejectionLogs],
          status: nextIndex === PF01_STAGES.length - 1 ? 'COMPLETED' : 'IN_PROGRESS',
        };
        updatedList = otherItems.map((j, idx) => (idx === existingNextIdx ? mergedCard : j));
      } else {
        updatedList = prev.map((j) =>
          j.id === selectedMovementJob.id
            ? {
                ...j,
                currentStageIndex: nextIndex,
                currentStageName: nextStage,
                totalPcbQty: movedPcb,
                custPnlQty: movedPcb,
                prodPnlQty: Math.ceil(movedPcb / 4),
                custPnlAreaSqm: movedArea,
                prodPnlAreaSqm: movedArea,
                rejectedPcbQty: updatedRejectedPcbQty,
                rejectedAreaSqm: updatedRejectedAreaSqm,
                rejectionLogs: newRejectionLogs,
                status: nextIndex === PF01_STAGES.length - 1 ? 'COMPLETED' : 'IN_PROGRESS',
                isNewlyCreated: false,
              }
            : j
        );
      }
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    // 2. CLOSE MODAL IMMEDIATELY
    setSelectedMovementJob(null);
    setFullMoveRemarks('');
    setFullMoveRejectQty(0);
    setHasRejectionInMovement(false);
    setFullMoveRemarkType('Clear Movement');

    if (rejectPcb > 0) {
      showToast(`Full Lot moved to ${nextStage}: ${movedPcb} PCBs moved (${movedArea} Sqm), ${rejectPcb} PCBs REJECTED`, 'success');
    } else {
      showToast(`🚀 Full Lot ${jobCardNo} moved to ${nextStage} (${movedPcb} PCBs, ${movedArea} Sqm)`, 'success');
    }

    // 3. NON-BLOCKING BACKGROUND SYNC TO BACKEND
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const primaryTarget = encodeURIComponent(targetSubId || targetSubNo);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        let res = await fetch(`${getApiBaseUrl()}/job-cards/${primaryTarget}/move-stage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            cardId: targetSubId,
            subJobCardNo: targetSubNo,
            jobCardNo: jobCardNo,
            rejectPcbQty: rejectPcb,
            remark: effectiveRemarks,
            remarkType: rejectPcb > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok && targetSubNo && targetSubNo !== targetSubId) {
          const fallbackCtrl = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 3500);
          await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetSubNo)}/move-stage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              cardId: targetSubId,
              subJobCardNo: targetSubNo,
              jobCardNo: jobCardNo,
              rejectPcbQty: rejectPcb,
              remark: effectiveRemarks,
              remarkType: rejectPcb > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
            }),
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimeout);
        }
      } catch (err: any) {
        console.warn('Backend stage move sync in background skipped or offline');
      }
    })();
  };

  // Mark Job Card as Completed
  const handleMarkAsCompleted = (jobCardId: string) => {
    const targetId = jobCardId || selectedMovementJob?.id || '';
    const targetCardNo = selectedMovementJob?.jobCardNo || '';

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    let updatedList: JobCard[] = [];
    setJobCards((prev) => {
      updatedList = prev.map((j) => {
        if (j.id === targetId || j.jobCardNo === targetId || (targetCardNo && j.jobCardNo === targetCardNo)) {
          return {
            ...j,
            status: 'COMPLETED',
            currentStageIndex: PF01_STAGES.length - 1,
            currentStageName: PF01_STAGES[PF01_STAGES.length - 1],
            completedAt: new Date().toISOString(),
            isNewlyCreated: false,
          };
        }
        return j;
      });
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    // 2. CLOSE MODAL IMMEDIATELY
    setSelectedMovementJob(null);
    showToast(`Job Card ${targetCardNo || targetId} marked as COMPLETED & Ready for Dispatch!`, 'success');

    // 3. NON-BLOCKING BACKGROUND SYNC TO BACKEND
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const primaryTarget = encodeURIComponent(targetId || targetCardNo);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        await fetch(`${getApiBaseUrl()}/job-cards/${primaryTarget}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: 'COMPLETED' }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.warn('Failed to call backend status API, using client state update');
      }
    })();
  };

  // Partial / Uncompleted Movement (Split)
  const handlePartialJobMovement = () => {
    if (!selectedMovementJob) return;
    if (!canUserMoveStage(selectedMovementJob.currentStageName)) {
      showToast(`Permission Denied: Cannot move jobs out of stage "${selectedMovementJob.currentStageName}".`, 'error');
      return;
    }

    const masterPcb = selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4)) || 160;
    const parsedMoveQty = typeof partialMoveQty === 'number' ? partialMoveQty : (parseInt(String(partialMoveQty), 10) || 0);

    if (parsedMoveQty <= 0 || parsedMoveQty >= masterPcb) {
      showToast(`Partial movement qty must be between 1 and ${masterPcb - 1} PCBs.`, 'error');
      return;
    }

    const currentIdx = (selectedMovementJob.currentStageIndex !== undefined && selectedMovementJob.currentStageIndex >= 0)
      ? selectedMovementJob.currentStageIndex
      : normalizeStageIndex(selectedMovementJob.currentStageName);
    const nextIndex = currentIdx + 1;
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

    const baseJc = selectedMovementJob.jobCardNo;
    const movedSubNo = baseJc;
    const remainingSubNo = baseJc;

    const movedBatch: JobCard = {
      ...selectedMovementJob,
      id: `jc-part-${Date.now()}-moved`,
      jobCardNo: selectedMovementJob.jobCardNo,
      subJobCardNo: movedSubNo,
      prodPnlQty: Math.ceil(parsedMoveQty / 4),
      custPnlQty: parsedMoveQty,
      totalPcbQty: parsedMoveQty,
      prodPnlAreaSqm: movedArea,
      custPnlAreaSqm: movedArea,
      currentStageIndex: nextIndex,
      currentStageName: nextStage,
      status: 'IN_PROGRESS',
      isNewlyCreated: false,
    };

    const remainingBatch: JobCard = {
      ...selectedMovementJob,
      jobCardNo: selectedMovementJob.jobCardNo,
      subJobCardNo: remainingSubNo,
      prodPnlQty: Math.ceil(remainingPcb / 4),
      custPnlQty: remainingPcb,
      totalPcbQty: remainingPcb,
      prodPnlAreaSqm: remArea,
      custPnlAreaSqm: remArea,
      isNewlyCreated: false,
    };

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    let finalList: JobCard[] = [];
    setJobCards((prev) => {
      const otherItems = prev.filter((j) => j.id !== selectedMovementJob.id);
      const existingNextIdx = otherItems.findIndex(
        (j) => j.jobCardNo === selectedMovementJob.jobCardNo && j.currentStageName === nextStage
      );

      let listWithMoved: JobCard[];
      if (existingNextIdx !== -1) {
        const target = otherItems[existingNextIdx];
        const mergedQty = (target.totalPcbQty || 0) + parsedMoveQty;
        const mergedArea = Number(((target.custPnlAreaSqm || 0) + movedArea).toFixed(2));
        const mergedCard: JobCard = {
          ...target,
          totalPcbQty: mergedQty,
          custPnlQty: mergedQty,
          prodPnlQty: Math.ceil(mergedQty / 4),
          custPnlAreaSqm: mergedArea,
          prodPnlAreaSqm: mergedArea,
        };
        listWithMoved = otherItems.map((j, idx) => (idx === existingNextIdx ? mergedCard : j));
      } else {
        listWithMoved = [...otherItems, movedBatch];
      }

      if (remainingPcb > 0) {
        const existingCurrIdx = listWithMoved.findIndex(
          (j) => j.jobCardNo === selectedMovementJob.jobCardNo && j.currentStageName === selectedMovementJob.currentStageName
        );
        if (existingCurrIdx !== -1) {
          const curr = listWithMoved[existingCurrIdx];
          const mergedRemQty = (curr.totalPcbQty || 0) + remainingPcb;
          const mergedRemArea = Number(((curr.custPnlAreaSqm || 0) + remArea).toFixed(2));
          finalList = listWithMoved.map((j, idx) =>
            idx === existingCurrIdx
              ? {
                  ...curr,
                  totalPcbQty: mergedRemQty,
                  custPnlQty: mergedRemQty,
                  prodPnlQty: Math.ceil(mergedRemQty / 4),
                  custPnlAreaSqm: mergedRemArea,
                  prodPnlAreaSqm: mergedRemArea,
                }
              : j
          );
        } else {
          finalList = [...listWithMoved, remainingBatch];
        }
      } else {
        finalList = listWithMoved;
      }

      saveJobCardsToStorage(finalList);
      return finalList;
    });

    // 2. CLOSE MODAL IMMEDIATELY
    const savedJobCardId = selectedMovementJob.id;
    setSelectedMovementJob(null);
    setIncompleteRemarks('');
    showToast(
      `Incomplete Movement logged: ${parsedMoveQty} PCBs moved to ${nextStage}, ${remainingPcb} PCBs retained at ${selectedMovementJob.currentStageName} due to "${effectiveReason}"`,
      'success'
    );

    // 3. NON-BLOCKING BACKGROUND SYNC
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        await fetch(`${getApiBaseUrl()}/job-cards/${savedJobCardId}/move-partial`, {
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
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.warn('Backend move-partial sync skipped or offline');
      }
    })();
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

  const [statusRadio, setStatusRadio] = useState<'All' | 'Unstarted' | 'Active' | 'Pending' | 'Done' | 'Overdue'>('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColFilters, setShowColFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const isCardOverdue = useCallback(
    (jc: JobCard) => {
      if (jc.status === 'COMPLETED') return false;
      if (!jc.targetDate) return false;
      const targetStr = jc.targetDate.split('T')[0];
      return targetStr < todayStr;
    },
    [todayStr]
  );

  // Filtered Cards based on per-column filters, global search, and radio status
  const filteredCards = jobCards.filter((jc) => {
    const matchesWip = !colFilters.wipNo || jc.jobCardNo.toLowerCase().includes(colFilters.wipNo.toLowerCase());
    const matchesProduct = !colFilters.product || jc.customerPartNo?.toLowerCase().includes(colFilters.product.toLowerCase());
    const matchesCode = !colFilters.productCode || jc.rfePartCode?.toLowerCase().includes(colFilters.productCode.toLowerCase());
    const matchesCust = !colFilters.customer || jc.customerCode?.toLowerCase().includes(colFilters.customer.toLowerCase());

    const isOperatorUser = userRole === 'NORMAL';
    const effectiveStageFilter = isOperatorUser ? assignedStage : colFilters.stage;
    const matchesStage = !effectiveStageFilter || (jc.currentStageName || '').toLowerCase().includes(effectiveStageFilter.toLowerCase());
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
        : statusRadio === 'Overdue'
        ? isCardOverdue(jc)
        : true;

    return matchesWip && matchesProduct && matchesCode && matchesCust && matchesStage && matchesPriority && matchesGlobal && matchesRadio;
  });

  const totalMasterCards = jobCards.length;
  const inProgressCount = jobCards.filter((j) => j.status === 'IN_PROGRESS').length;
  const totalSubLots = jobCards.reduce((acc, j) => acc + (j.subJobCards?.length || 1), 0);
  const activePnlCount = jobCards.reduce((acc, j) => acc + (j.prodPnlQty || 0), 0);
  const activePcbCount = jobCards.reduce((acc, j) => acc + (j.totalPcbQty || (j.custPnlQty && j.custPnlQty > 50 ? j.custPnlQty : ((j.prodPnlQty || 0) * 4))), 0);
  const activeSqmArea = jobCards.reduce((acc, j) => acc + (j.prodPnlAreaSqm || 0), 0);

  const overdueCards = React.useMemo(() => jobCards.filter(isCardOverdue), [jobCards, isCardOverdue]);
  const overdueCount = overdueCards.length;
  const overduePcbCount = React.useMemo(
    () => overdueCards.reduce((acc, curr) => acc + (curr.totalPcbQty || curr.custPnlQty || 0), 0),
    [overdueCards]
  );

  // Top 3 WIP Stages by active Sqm Area
  const top3WipStages = React.useMemo(() => {
    const activeCards = jobCards.filter((j) => j.status !== 'COMPLETED');
    const totalFloorSqm = activeCards.reduce((sum, j) => sum + (j.custPnlAreaSqm || j.prodPnlAreaSqm || 0), 0);

    const stageMap: Record<string, { stageName: string; areaSqm: number; pcbQty: number; cardCount: number }> = {};

    activeCards.forEach((jc) => {
      const stage = jc.currentStageName || PF01_STAGES[0];
      const sqm = jc.custPnlAreaSqm || jc.prodPnlAreaSqm || 0;
      const pcbs = jc.totalPcbQty || jc.custPnlQty || 0;

      if (!stageMap[stage]) {
        stageMap[stage] = { stageName: stage, areaSqm: 0, pcbQty: 0, cardCount: 0 };
      }
      stageMap[stage].areaSqm += sqm;
      stageMap[stage].pcbQty += pcbs;
      stageMap[stage].cardCount += 1;
    });

    return Object.values(stageMap)
      .sort((a, b) => b.areaSqm - a.areaSqm)
      .slice(0, 3)
      .map((item) => ({
        ...item,
        areaSqm: Number(item.areaSqm.toFixed(2)),
        percentage: totalFloorSqm > 0 ? Math.round((item.areaSqm / totalFloorSqm) * 100) : 0,
      }));
  }, [jobCards]);

  // Top 5 High Rejection Job Cards (Tracked live upon stage movement entry)
  const top5RejectedCards = React.useMemo(() => {
    return jobCards
      .filter((j) => (j.rejectedPcbQty || 0) > 0)
      .sort((a, b) => (b.rejectedPcbQty || 0) - (a.rejectedPcbQty || 0))
      .slice(0, 5);
  }, [jobCards]);

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
        {/* Left: Title & Subtext */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
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
          </div>
        </div>

        {/* Right: Actions & Controls in clean grid */}
        <div className="flex flex-col gap-2 w-full xl:w-auto shrink-0">
          {/* Row 1: Quick Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Link
              href="/job-cards/launch"
              className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all border border-amber-600 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Launch Page ↗</span>
            </Link>

            <Link
              href="/job-cards/movement"
              className="h-9 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all border border-blue-500/40 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[3] text-amber-400" />
              <span>Job Movement ➔</span>
            </Link>
          </div>

          {/* Row 2: Selectors & Main Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {/* RBAC Role Switcher Pill */}
            <div className="h-9 flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 px-2.5 rounded-xl text-xs overflow-hidden">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-medium shrink-0 text-[11px] hidden sm:inline">Role:</span>
              <select
                value={userRole}
                onChange={(e: any) => setUserRole(e.target.value)}
                className="bg-transparent font-bold text-slate-900 cursor-pointer outline-none text-[11px] truncate min-w-0 flex-1"
              >
                <option value="MASTER">Master</option>
                <option value="SUPER_USER">Super User</option>
                <option value="NORMAL">Operator</option>
              </select>
            </div>

            {/* Stage Operator Login Selector */}
            <div className="h-9 flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 rounded-xl text-xs shadow-2xs overflow-hidden">
              <span className="text-amber-900 font-bold text-[10px] uppercase font-mono shrink-0 hidden sm:inline">Stage:</span>
              <select
                value={assignedStage}
                onChange={(e) => {
                  setAssignedStage(e.target.value);
                  setUserRole('NORMAL');
                }}
                className="bg-transparent font-extrabold text-amber-950 cursor-pointer outline-none text-[11px] font-mono truncate min-w-0 flex-1"
                title="Select Stage Account to view only jobs pending at this stage"
              >
                {PF01_STAGES.map((stg) => (
                  <option key={stg} value={stg} className="bg-white text-slate-900 font-sans font-bold">
                    {stg}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Drawer Button */}
            <button
              onClick={() => setShowReportDrawer(true)}
              className="h-9 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">WIP Report</span>
            </button>

            {/* Add New Job Card Button */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="h-9 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-amber-600"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              <span className="truncate">ADD NEW CARD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECOND ROW SUMMARY CARDS & BARCODE SCANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
        
        {/* Card 1: Barcode Scanner / Fast Stage Movement */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2.5 min-h-[96px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px] font-black text-blue-900 uppercase tracking-wider shrink-0">
              <Scan className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">⚡ STAGE SCANNER</span>
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
              placeholder="Scan QR or Job No..."
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white placeholder-slate-400 shadow-2xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Move</span>
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

        {/* Card 4: Overdue Job Cards (Interactive Metric) */}
        <div
          onClick={() => setStatusRadio(statusRadio === 'Overdue' ? 'All' : 'Overdue')}
          className={`border rounded-2xl p-4 shadow-xs flex items-center gap-3 min-h-[96px] cursor-pointer transition-all ${
            statusRadio === 'Overdue'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
              : overdueCount > 0
              ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/90'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}

        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            statusRadio === 'Overdue'
              ? 'bg-white/20 text-white'
              : overdueCount > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                statusRadio === 'Overdue' ? 'text-rose-100' : overdueCount > 0 ? 'text-rose-900' : 'text-slate-500'
              }`}>
                OVERDUE JOB CARDS
              </span>
              {overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
            </div>
            <div className={`text-base sm:text-lg font-black font-mono mt-0.5 truncate ${
              statusRadio === 'Overdue' ? 'text-white' : overdueCount > 0 ? 'text-rose-950' : 'text-slate-900'
            }`}>
              {overdueCount} Cards
            </div>
            <div className={`text-[11px] font-semibold truncate ${
              statusRadio === 'Overdue' ? 'text-rose-100' : overdueCount > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              • {overduePcbCount} PCBs Past Target
            </div>
          </div>
        </div>

        {/* Card 5: Total WIP Area */}
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

      {/* 2.5 ANALYTICS & LIVE MOVEMENT WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* LEFT: Top 3 WIP Stages by SQM Area (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-purple-200/80 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  TOP 3 WIP STAGES (BY AREA)
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Highest active Sqm volume in production flow</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              {top3WipStages.reduce((acc, curr) => acc + curr.areaSqm, 0).toFixed(1)} Sqm Total
            </span>
          </div>

          {/* Stage Progress Items */}
          <div className="space-y-2.5 flex-1 justify-center flex flex-col">
            {top3WipStages.length > 0 ? (
              top3WipStages.map((stg, idx) => {
                const rankColors = [
                  'bg-amber-500 text-slate-950 border-amber-600',
                  'bg-slate-300 text-slate-900 border-slate-400',
                  'bg-amber-700 text-white border-amber-800',
                ];
                const barColors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600'];

                return (
                  <div key={stg.stageName} className="space-y-1 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center border shrink-0 ${rankColors[idx] || 'bg-slate-200'}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 font-mono text-xs truncate">
                          {stg.stageName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        <span className="font-black text-slate-900">{stg.areaSqm} Sqm</span>
                        <span className="text-[10px] text-slate-500">({stg.pcbQty} PCBs)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${barColors[idx] || 'bg-purple-600'} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(5, stg.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 font-medium">
                No active WIP stages currently running
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Top 5 Rejection Job Cards (Live Movement Entries) (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-rose-200/80 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    TOP 5 REJECTION JOB CARDS
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Tracked live when operators enter rejections during stage movement</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
              {top5RejectedCards.reduce((acc, curr) => acc + (curr.rejectedPcbQty || 0), 0)} Total Rejections
            </span>
          </div>

          {/* Rejection List */}
          <div className="space-y-2 flex-1">
            {top5RejectedCards.length > 0 ? (
              top5RejectedCards.map((jc, idx) => {
                const lastLog = jc.rejectionLogs?.[jc.rejectionLogs.length - 1];
                return (
                  <div
                    key={jc.id}
                    className="flex items-center justify-between gap-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-200/80 p-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-950 bg-rose-200/80 px-2 py-0.5 rounded border border-rose-300">
                            {jc.jobCardNo}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 truncate">{jc.customerCode}</span>
                          <span className="text-[10px] text-slate-500 truncate hidden sm:inline-block">({jc.customerPartNo})</span>
                        </div>
                        {lastLog && (
                          <p className="text-[10px] text-rose-800 font-semibold truncate mt-0.5">
                            ⚠️ Stage: <span className="font-mono">{lastLog.stageName}</span> — "{lastLog.remark}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                        {jc.rejectedPcbQty} PCBs
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {jc.rejectedAreaSqm || 0} Sqm
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No Rejections Logged Yet across active job cards. Live movement entries will appear here instantly.</span>
              </div>
            )}
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
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar whitespace-nowrap pb-0.5">
          <span className="text-[11px] font-bold text-slate-500 mr-0.5 shrink-0 hidden sm:inline-block">Status:</span>

          <button
            onClick={() => setStatusRadio('All')}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusRadio === 'All'
                ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Cards</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[10px]">{totalMasterCards}</span>
          </button>

          <button
            onClick={() => setStatusRadio('Unstarted')}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusRadio === 'Unstarted'
                ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>UNLAUNCHED</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[10px]">
              {jobCards.filter((j) => j.status === 'UNLAUNCHED' || j.status === 'CREATED').length}
            </span>
          </button>

          <button
            onClick={() => setStatusRadio('Active')}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusRadio === 'Active'
                ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>IN PROGRESS</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[10px]">{inProgressCount}</span>
          </button>

          <button
            onClick={() => setStatusRadio('Done')}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusRadio === 'Done'
                ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>COMPLETED</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[10px]">
              {jobCards.filter((j) => j.status === 'COMPLETED').length}
            </span>
          </button>

          <button
            onClick={() => setStatusRadio(statusRadio === 'Overdue' ? 'All' : 'Overdue')}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              statusRadio === 'Overdue'
                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs font-black'
                : overdueCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-extrabold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>OVERDUE</span>
            <span className="px-1.5 py-0.2 bg-slate-950/10 rounded font-mono text-[10px]">
              {overdueCount} ({overduePcbCount} PCBs)
            </span>
          </button>

          {/* Toggle Column Filters Button */}
          <button
            onClick={() => setShowColFilters(!showColFilters)}
            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              showColFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-extrabold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle per-column search filter inputs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showColFilters ? 'Hide Filters' : 'Column Filters'}</span>
          </button>

          {userRole === 'NORMAL' && (
            <span className="h-8 px-2.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-mono text-[11px] font-black inline-flex items-center gap-1.5 shadow-2xs animate-pulse shrink-0">
              🔒 Operator Stage Locked: {assignedStage}
            </span>
          )}
        </div>

      </div>

      {/* 4. FOURTH ROW: PRODUCTION JOBS (WIP) DATA TABLE */}
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
                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                      <p className="text-slate-600 font-sans font-semibold text-sm">No job cards found matching current filters.</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          ➕ Create New Job Card
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCards.map((jc, idx) => {
                  const isUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED' || (jc.status as string) === 'PENDING_LAUNCH';
                  const isCompleted = jc.status === 'COMPLETED';
                  const stageIndex = jc.currentStageIndex !== undefined && jc.currentStageIndex >= 0 ? jc.currentStageIndex : normalizeStageIndex(jc.currentStageName);
                  const progressPct = isUnlaunched ? 0 : isCompleted ? 100 : Math.round(((stageIndex + 1) / PF01_STAGES.length) * 100);
                  const isNewTagVisible = isUnlaunched;

                  return (
                    <tr
                      key={jc.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        isNewTagVisible
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
                          <span>{jc.subJobCardNo || jc.jobCardNo}</span>
                          {isNewTagVisible && (
                            <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded uppercase tracking-wider animate-pulse shrink-0 shadow-2xs">
                              NEW
                            </span>
                          )}
                          {jc.subJobCards && jc.subJobCards.length > 1 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                              Lot {(jc.subJobCards.findIndex((s) => s.id === jc.id) >= 0 ? jc.subJobCards.findIndex((s) => s.id === jc.id) + 1 : idx + 1)}/{jc.subJobCards.length}
                            </span>
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
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={isCardOverdue(jc) ? 'text-rose-700 font-extrabold' : 'text-slate-600'}>
                            {formatDateDisplay(jc.targetDate)}
                          </span>
                          {isCardOverdue(jc) && (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 text-[9px] font-black rounded border border-rose-300 w-max mt-0.5 inline-flex items-center gap-1 shadow-2xs">
                              <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                              OVERDUE
                            </span>
                          )}
                        </div>
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
                        <div className="flex flex-col items-end">
                          <span className="text-slate-900 font-black">
                            {jc.totalPcbQty || (jc.custPnlQty && jc.custPnlQty > 50 ? jc.custPnlQty : (jc.prodPnlQty ? Math.round(jc.prodPnlQty * 4) : 160))}
                          </span>
                          {Boolean(jc.rejectedPcbQty && jc.rejectedPcbQty > 0) && (
                            <span
                              title={`Total Rejected PCBs on this card: ${jc.rejectedPcbQty}`}
                              className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-mono inline-flex items-center gap-0.5 mt-0.5 shadow-2xs"
                            >
                              ⚠️ {jc.rejectedPcbQty} Rej
                            </span>
                          )}
                        </div>
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
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {isUnlaunched ? (
                            <button
                              onClick={() => handleLaunchExistingJobCard(jc.id)}
                              title="Launch Job Card into Stage 1 Production"
                              className="h-6.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-md text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>LAUNCH</span>
                            </button>
                          ) : isCompleted ? (
                            <span className="h-6.5 px-2 bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold rounded-md text-[10px] inline-flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>DONE</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedMovementJob(jc);
                                setFullMoveRejectQty(0);
                                setFullMoveRemarks('');
                                setFullMoveRemarkType('Clear Movement');
                                setPartialMoveQty(Math.max(1, Math.floor((jc.totalPcbQty || 160) / 2)));
                                setMovementTab('FULL');
                              }}
                              title="Open Stage Movement Options (Rejections, Remarks & Partial Splits)"
                              className="h-6.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-md border border-amber-600/90 text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                            >
                              <RefreshCw className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Move Stage ➔</span>
                            </button>
                          )}

                          <button
                            onClick={() => fetchJobCardHistory(jc)}
                            title="View Full Stage Movement & Traceability History"
                            className="h-6.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-md text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                          >
                            <History className="w-3 h-3 text-white" />
                            <span>History</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(jc)}
                            title="Edit Job Card Parameters"
                            className="h-6.5 w-6.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteConfirmCard(jc)}
                              disabled={Boolean(deletingCardId && (deletingCardId === jc.id || deletingCardId === jc.jobCardNo))}
                              title="Delete Job Card (Super Admin Only)"
                              className="h-6.5 w-6.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs disabled:opacity-50"
                            >
                              {deletingCardId && (deletingCardId === jc.id || deletingCardId === jc.jobCardNo) ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
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
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm border border-amber-300 shrink-0">
                    {editingCardId ? <Pencil className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-extrabold text-slate-950 text-base sm:text-lg tracking-tight">
                        {editingCardId ? 'Edit Job Card Parameters' : 'New Job Card Creation & Launch'}
                      </h3>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300/80 shadow-2xs">
                        {launchForm.jobCardNo || 'DRAFT'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editingCardId 
                        ? 'Modify PCB parameters and update existing job card record' 
                        : 'Configure production parameters, generate industrial traveler QR tag & launch WIP'}
                    </p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                  title="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleLaunchJobCard} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs custom-scrollbar">
                
                {/* 1. Job Card Physical Photo Attachment */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs tracking-tight">
                        Original Physical Job Card Photo <span className="text-rose-500">*</span>
                      </span>
                    </div>
                    {launchForm.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Photo Attached
                      </span>
                    )}
                  </div>

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

                  {launchForm.photoUrl ? (
                    /* Attached Photo Preview State */
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                          className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                          title="Click to view full preview"
                        >
                          <img
                            src={launchForm.photoUrl}
                            alt="Job Card Document"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Physical Job Card Document Attached</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs sm:max-w-md">
                            {launchForm.photoUrl.startsWith('data:') ? 'Image uploaded from device (Base64)' : launchForm.photoUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <label
                          htmlFor="jobCardPhotoFileInput"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setLaunchForm({ ...launchForm, photoUrl: '' })}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Picker State */
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <label
                        htmlFor="jobCardPhotoFileInput"
                        className="sm:col-span-6 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-3 flex items-center justify-center gap-2.5 cursor-pointer transition-all text-blue-700 font-bold group shadow-2xs"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <span className="block text-xs font-extrabold text-blue-900">Upload Photo from Device / Camera</span>
                          <span className="block text-[10px] text-blue-600 font-normal">Click to browse or take snapshot</span>
                        </div>
                      </label>

                      <div className="sm:col-span-6 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-2xs">
                        <ImageIcon className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                        <input
                          type="text"
                          value={launchForm.photoUrl}
                          onChange={(e) => setLaunchForm({ ...launchForm, photoUrl: e.target.value })}
                          className="w-full bg-transparent text-xs text-slate-900 focus:outline-none placeholder:text-slate-400 font-mono"
                          placeholder="Or paste direct image URL..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Job Identification & Timeline */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-400 uppercase font-mono text-[10px] font-black tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Identification & Schedule</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Job Card No. <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-mono text-slate-400 font-bold">#</span>
                        <input
                          type="text"
                          required
                          value={launchForm.jobCardNo}
                          onChange={(e) => setLaunchForm({ ...launchForm, jobCardNo: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                          placeholder="26-27-1731"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Launch Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={launchForm.launchDate}
                        onChange={(e) => setLaunchForm({ ...launchForm, launchDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Delivery Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={launchForm.targetDate}
                        onChange={(e) => setLaunchForm({ ...launchForm, targetDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Part Code Master */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 uppercase font-mono text-[10px] font-black tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Customer & Part Codes</span>
                    </div>
                    {availableProducts.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Quick Preset:</span>
                        <select
                          onChange={(e) => {
                            const prod = availableProducts.find((p) => p.id === e.target.value || p.code === e.target.value);
                            if (prod) {
                              setLaunchForm((prev) => ({
                                ...prev,
                                customerPartNo: prod.code || prod.name || prev.customerPartNo,
                                rfePartCode: prod.specCardNo || prod.code || prev.rfePartCode,
                                customerCode: prod.customer?.code || prev.customerCode,
                                layers: prod.layers || prev.layers,
                                thicknessMm: Number(prod.thicknessMm) || prev.thicknessMm,
                                copperWeight: prod.copperWeight || prod.copper || prev.copperWeight,
                                surfaceFinish: prod.surfaceFinish || prev.surfaceFinish,
                                solderMask: prod.solderMask || prev.solderMask,
                                materialType: prod.materialType || prev.materialType,
                              }));
                            }
                          }}
                          className="text-[11px] bg-indigo-50/70 border border-indigo-200 text-indigo-900 rounded-lg px-2 py-0.5 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                          defaultValue=""
                        >
                          <option value="" disabled>Load from Product Master...</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} ({p.name}) — {p.layers || 2}L / {p.thicknessMm || '1.6'}mm
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Customer Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.customerCode}
                        onChange={(e) => setLaunchForm({ ...launchForm, customerCode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                        placeholder="e.g. CUST-001"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Customer Part No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.customerPartNo}
                        onChange={(e) => setLaunchForm({ ...launchForm, customerPartNo: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                        placeholder="Customer Part Number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        R.F.E. Part Code <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={launchForm.rfePartCode}
                          onChange={(e) => setLaunchForm({ ...launchForm, rfePartCode: e.target.value })}
                          className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-blue-700 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                          placeholder="R.F.E. Part Code"
                        />
                        <span className="absolute right-3 top-2 text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">RFE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PCB Technical Specifications (Live Spec Card) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-400 uppercase font-mono text-[10px] font-black tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                    <span>3. PCB Technical Specifications (Live Spec Card)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Layers <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.layers}
                        onChange={(e) => setLaunchForm({ ...launchForm, layers: Number(e.target.value) || 2 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value={1}>1 Layer (Single)</option>
                        <option value={2}>2 Layers (Double)</option>
                        <option value={4}>4 Layers (Multilayer)</option>
                        <option value={6}>6 Layers</option>
                        <option value={8}>8 Layers</option>
                        <option value={10}>10 Layers</option>
                        <option value={12}>12 Layers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Thickness (mm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={launchForm.thicknessMm}
                        onChange={(e) => setLaunchForm({ ...launchForm, thicknessMm: parseFloat(e.target.value) || 1.6 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs"
                        placeholder="1.6"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Copper Weight <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.copperWeight}
                        onChange={(e) => setLaunchForm({ ...launchForm, copperWeight: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="0.5oz">0.5 oz (18µm)</option>
                        <option value="1oz">1.0 oz (35µm)</option>
                        <option value="2oz">2.0 oz (70µm)</option>
                        <option value="3oz">3.0 oz (105µm)</option>
                        <option value="4oz">4.0 oz (140µm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Surface Finish <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.surfaceFinish}
                        onChange={(e) => setLaunchForm({ ...launchForm, surfaceFinish: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="HASL Lead-Free">HASL Lead-Free</option>
                        <option value="HASL Leaded">HASL Leaded</option>
                        <option value="ENIG (Gold)">ENIG (Gold)</option>
                        <option value="OSP">OSP</option>
                        <option value="Immersion Silver">Immersion Silver</option>
                        <option value="Immersion Tin">Immersion Tin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Solder Mask <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.solderMask}
                        onChange={(e) => setLaunchForm({ ...launchForm, solderMask: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="Green">Green</option>
                        <option value="Matt Green">Matt Green</option>
                        <option value="Blue">Blue</option>
                        <option value="Red">Red</option>
                        <option value="Black">Black</option>
                        <option value="Matt Black">Matt Black</option>
                        <option value="White">White</option>
                        <option value="Yellow">Yellow</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Material Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.materialType}
                        onChange={(e) => setLaunchForm({ ...launchForm, materialType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="FR-4">FR-4 (TG140)</option>
                        <option value="FR-4 High TG">FR-4 High TG (TG170)</option>
                        <option value="Aluminum">Aluminum Base</option>
                        <option value="Copper Base">Copper Base</option>
                        <option value="Rogers (High Frequency)">Rogers High Freq</option>
                        <option value="Polyimide">Polyimide (Flex)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Production Volume & Parameters */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-400 uppercase font-mono text-[10px] font-black tracking-wider">
                    <Box className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Production Volumes & Parameters</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Priority <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.priority}
                        onChange={(e: any) => setLaunchForm({ ...launchForm, priority: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="MOST URGENT">⚡ MOST URGENT</option>
                        <option value="HIGH">🔥 HIGH</option>
                        <option value="NORMAL">🟢 NORMAL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 mb-1">
                        Total PCB Qty <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
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
                              custPnlQty: qty,
                              custPnlAreaSqm: calculatedArea,
                              prodPnlAreaSqm: Number((calculatedArea * 1.1).toFixed(2)),
                            });
                          }}
                          className="w-full bg-amber-50/60 border border-amber-300 rounded-xl pl-3 pr-11 py-2 text-xs font-mono font-black text-slate-950 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                          placeholder="160"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">PCBs</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 mb-1">
                        Total PCB Area (Sqm) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                          placeholder="45"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">m²</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        <span>{launchForm.totalPcbQty || 0} × {unitPcbAreaSqm.toFixed(4)} m²</span>
                        <span className="font-bold text-amber-800">={(Number(launchForm.custPnlAreaSqm) || 0).toFixed(2)} m²</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Job Flow Route <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.jobFlowSelection}
                        onChange={(e) => setLaunchForm({ ...launchForm, jobFlowSelection: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="PF-01">PF-01 Standard Flow (19 Stages)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Production Options: Pre-Launch Lot Splitting & Direct Launch */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-slate-400 uppercase font-mono text-[10px] font-black tracking-wider">
                    <Workflow className="w-3.5 h-3.5 text-purple-600" />
                    <span>5. Production Launch & Lot Splitting</span>
                  </div>

                  {/* Pre-Launch Sub-Job Card Split Card */}
                  <div className={`border rounded-2xl p-4 transition-all shadow-2xs ${launchForm.enablePreSplit ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50/70 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${launchForm.enablePreSplit ? 'bg-amber-200 text-amber-950' : 'bg-slate-200 text-slate-600'}`}>
                          <Split className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-950 text-xs block">Pre-Launch Sub-Job Card Lot Splitting</span>
                          <span className="text-[11px] text-slate-500">Divide order volume into multiple travelers before releasing to floor</span>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
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
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {launchForm.enablePreSplit && (
                      <div className="space-y-3 pt-3.5 border-t border-amber-200/80 mt-3.5">
                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-amber-900 font-extrabold uppercase font-mono">Presets:</span>
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
                            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs border border-amber-300"
                          >
                            Split in 2 (50/50)
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
                            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs border border-amber-300"
                          >
                            Split in 4 Lots
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
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer transition-colors shadow-2xs border border-amber-600 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" /> Add Lot
                          </button>
                        </div>

                        {/* Sub-Job Cards Items Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {launchForm.customSplits.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item.subNo}
                                onChange={(e) => {
                                  const updated = [...launchForm.customSplits];
                                  updated[idx].subNo = e.target.value;
                                  setLaunchForm({ ...launchForm, customSplits: updated });
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500"
                              />
                              <div className="flex items-center gap-1 font-mono text-xs">
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const updated = [...launchForm.customSplits];
                                    updated[idx].qty = Number(e.target.value);
                                    setLaunchForm({ ...launchForm, customSplits: updated });
                                  }}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 text-right focus:bg-white focus:outline-none focus:border-amber-500"
                                />
                                <span className="text-[10px] text-slate-500 font-sans font-bold">PCB</span>
                              </div>
                              {launchForm.customSplits.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = launchForm.customSplits.filter((_, i) => i !== idx);
                                    setLaunchForm({ ...launchForm, customSplits: updated });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                                  title="Delete lot"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Sum Validation Indicator */}
                        {(() => {
                          const sum = launchForm.customSplits.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
                          const target = launchForm.prodPnlQty || 40;
                          const isValid = sum === target;
                          return (
                            <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs ${isValid ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'}`}>
                              <span className="flex items-center gap-1.5 font-mono">
                                <span>Sum of Sub-Lots: <strong>{sum}</strong> PCB</span>
                                <span className="text-slate-400">/</span>
                                <span>Total Target: <strong>{target}</strong> PCB</span>
                              </span>
                              <span>{isValid ? '✓ Split Allocation Balanced' : '⚠️ Must equal Total PCB'}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Direct Launch into Stage 1 Production Checkbox Card */}
                  <div className={`border rounded-2xl p-4 transition-all shadow-2xs ${launchForm.autoLaunch ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50/70 border-slate-200'}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${launchForm.autoLaunch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Zap className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-950 text-xs block">
                            Directly Launch into Stage 1 Production (1. SHEARING)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Instantly mark traveler as IN_PROGRESS and dispatch to cutting shopfloor immediately
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        id="autoLaunch"
                        checked={launchForm.autoLaunch}
                        onChange={(e) => setLaunchForm({ ...launchForm, autoLaunch: e.target.checked })}
                        className="w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                    </label>
                  </div>
                </div>

              </form>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200/80 shrink-0">
                <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Ready to dispatch to production</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleLaunchJobCard(e as any)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {editingCardId ? <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" /> : <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    <span>{editingCardId ? 'SAVE CHANGES' : 'LAUNCH JOB'}</span>
                  </button>
                </div>
              </div>

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
                            <strong className="text-slate-900 font-bold block mt-0.5 truncate">{selectedMovementJob.customerCode || '—'}</strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">CUSTOMER PART NO</span>
                            <strong className="text-slate-900 font-bold block mt-0.5 truncate" title={selectedMovementJob.customerPartNo}>
                              {selectedMovementJob.customerPartNo || '—'}
                            </strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">R.F.E. PART CODE</span>
                            <strong className="text-blue-800 font-mono font-bold block mt-0.5 text-xs bg-blue-50/60 px-2 py-0.5 rounded border border-blue-100 inline-block">
                              {selectedMovementJob.rfePartCode || '—'}
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
                              {selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4))} PCBs
                            </strong>
                          </div>

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">WIP AREA</span>
                            <strong className="text-emerald-700 font-mono font-black block mt-0.5">{selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm} Sqm</strong>
                          </div>

                          {Boolean(selectedMovementJob.rejectedPcbQty && selectedMovementJob.rejectedPcbQty > 0) && (
                            <div className="bg-rose-50/90 p-3 rounded-xl border border-rose-200 shadow-2xs">
                              <span className="text-[10px] text-rose-700 font-mono uppercase block font-black tracking-wider">REJECTED / SCRAP</span>
                              <strong className="text-rose-700 font-mono font-black block mt-0.5 text-sm">
                                ⚠️ {selectedMovementJob.rejectedPcbQty} PCBs
                              </strong>
                              {selectedMovementJob.rejectedAreaSqm ? (
                                <span className="text-[10px] font-mono text-rose-600 font-bold block mt-0.5">
                                  ({selectedMovementJob.rejectedAreaSqm.toFixed(2)} Sqm)
                                </span>
                              ) : null}
                            </div>
                          )}

                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-colors col-span-2 sm:col-span-1 md:col-span-3">
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">JOB FLOW</span>
                            <strong className="text-slate-800 font-mono block mt-0.5 font-bold">{selectedMovementJob.jobFlowSelection || 'PF-01 Standard'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Rejection & Defect History in Tab A */}
                      {selectedMovementJob.rejectionLogs && selectedMovementJob.rejectionLogs.length > 0 && (
                        <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-2xl space-y-2.5 font-sans shadow-xs">
                          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                            <span className="flex items-center gap-1.5 font-black text-rose-950 text-xs uppercase tracking-wider font-mono">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              Rejection & Quality Log ({selectedMovementJob.rejectionLogs.length} Records)
                            </span>
                            <span className="text-xs font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">
                              Total: {selectedMovementJob.rejectedPcbQty || 0} Rejected PCBs
                            </span>
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {selectedMovementJob.rejectionLogs.map((log, lIdx) => (
                              <div key={lIdx} className="bg-white p-2.5 rounded-xl border border-rose-100 flex items-center justify-between text-xs shadow-2xs">
                                <div>
                                  <span className="font-bold text-slate-900">{log.stageName || 'Stage'}</span>
                                  <span className="text-slate-500 text-[11px] block">{log.remark || 'Rejected during movement'}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                                    {log.rejectedPcbQty} PCBs
                                  </span>
                                  {log.timestamp && (
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                                Total: {selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4))} PCBs
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
                {movementTab === 'FULL' && (() => {
                  const currentTotalPcb = selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4)) || 160;
                  const parsedRejectQty = Math.min(Math.max(0, Number(fullMoveRejectQty) || 0), currentTotalPcb);
                  const movingPcbQty = Math.max(0, currentTotalPcb - parsedRejectQty);
                  const isRejectionRemarksNeeded = parsedRejectQty > 0 && !fullMoveRemarks.trim();
                  const currentStageIdx = (selectedMovementJob.currentStageIndex !== undefined && selectedMovementJob.currentStageIndex >= 0)
                    ? selectedMovementJob.currentStageIndex
                    : normalizeStageIndex(selectedMovementJob.currentStageName);
                  const nextStageTitle = PF01_STAGES[currentStageIdx + 1] || '19. PACKING (COMPLETED)';

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs font-sans">
                      <div className="lg:col-span-6 bg-blue-50/80 border border-blue-200 p-5 rounded-2xl text-blue-950 space-y-3 shadow-2xs flex flex-col justify-between">
                        <div>
                          <p className="font-black text-blue-900 text-sm flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                            Full Lot Stage Movement Confirmation
                          </p>
                          <p className="text-xs leading-relaxed text-blue-950 mt-2">
                            Are you sure you want to move Job Card No. <strong className="text-slate-900 font-mono font-black">{selectedMovementJob.jobCardNo}</strong> ({currentTotalPcb} PCBs, {selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45} Sqm) to the next process stage?
                          </p>

                          {Boolean(selectedMovementJob.rejectedPcbQty && selectedMovementJob.rejectedPcbQty > 0) && (
                            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-center justify-between shadow-2xs">
                              <span className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                Previous Rejections on this Card:
                              </span>
                              <span className="font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                                {selectedMovementJob.rejectedPcbQty} PCBs ({selectedMovementJob.rejectedAreaSqm || 0} Sqm)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 font-bold text-blue-900 bg-white rounded-xl border border-blue-200 font-mono text-xs shadow-2xs">
                          Next Stage: <span className="text-blue-700 font-extrabold">{nextStageTitle}</span>
                        </div>
                      </div>

                      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                        {/* Rejection Option Toggle */}
                        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                          <label className="flex items-center justify-between cursor-pointer select-none">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Record Defective / Rejected PCBs in this stage?</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={hasRejectionInMovement}
                              onChange={(e) => {
                                setHasRejectionInMovement(e.target.checked);
                                if (!e.target.checked) {
                                  setFullMoveRejectQty(0);
                                  setFullMoveRemarks('');
                                  setFullMoveRemarkType('Clear Movement');
                                }
                              }}
                              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                            />
                          </label>

                          {hasRejectionInMovement && (
                            <div className="pt-2 border-t border-slate-200 space-y-3">
                              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2">
                                <label className="block text-xs font-bold text-rose-950 flex items-center justify-between">
                                  <span>Reject PCB Quantity</span>
                                  <span className="text-[10px] font-mono font-black text-rose-700">
                                    Available: {currentTotalPcb} PCBs
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={currentTotalPcb}
                                  value={fullMoveRejectQty}
                                  onChange={(e) => setFullMoveRejectQty(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  placeholder="Enter rejected qty..."
                                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
                                />
                                {parsedRejectQty > 0 && (
                                  <p className="text-[11px] text-rose-800 font-bold">
                                    ⚠️ {parsedRejectQty} PCBs will be rejected. Only {movingPcbQty} PCBs will move to next stage.
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Movement Remarks Category
                                </label>
                                <select
                                  value={fullMoveRemarkType}
                                  onChange={(e) => setFullMoveRemarkType(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-2xs"
                                >
                                  <option value="Rejection">Rejection</option>
                                  <option value="Rework">Rework</option>
                                  <option value="Process issue">Process issue</option>
                                  <option value="Other relevant remarks">Other relevant movement remarks</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                  <span>Remarks / Defect Details (Optional)</span>
                                  <span className="text-[10px] text-slate-400 font-medium">Auto-filled if empty</span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={fullMoveRemarks}
                                  onChange={(e) => setFullMoveRemarks(e.target.value)}
                                  placeholder="Enter optional defect reason (e.g. Scratched track, drilled off-center)..."
                                  className="w-full border rounded-xl p-2.5 text-xs text-slate-900 bg-white border-slate-200 focus:bg-white focus:border-rose-500 focus:outline-none shadow-2xs font-medium"
                                />
                              </div>
                            </div>
                          )}

                          {!hasRejectionInMovement && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Movement Remarks (Optional)
                              </label>
                              <input
                                type="text"
                                value={fullMoveRemarks}
                                onChange={(e) => setFullMoveRemarks(e.target.value)}
                                placeholder="Optional stage remarks (e.g. All OK)..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={handleFullJobMovement}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-98 border border-blue-500/40 flex items-center justify-center gap-1.5"
                          >
                            <span>
                              {parsedRejectQty > 0
                                ? `CONFIRM MOVEMENT (${movingPcbQty} PCBs ➔ Next Stage | ${parsedRejectQty} Rejected)`
                                : `CONFIRM FULL MOVEMENT (${currentTotalPcb} PCBs ➔ Next Stage)`}
                            </span>
                          </button>

                          {selectedMovementJob.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
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
                  );
                })()}

                {/* TAB C: UNCOMPLETED / SPLIT MOVEMENT (HORIZONTAL SIDE-BY-SIDE) */}
                {movementTab === 'PARTIAL' && (() => {
                  const masterPcb = selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4)) || 160;
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
                          activeMasterJobs.reduce((s, j) => s + (j.totalPcbQty || (j.custPnlQty && j.custPnlQty > 50 ? j.custPnlQty : ((j.prodPnlQty || 0) * 4))), 0) +
                          activeSubJobs.reduce((s, sub) => s + ((sub as any).totalPcbQty || ((sub.qty && sub.qty > 50) ? sub.qty : (sub.qty * 4))), 0);

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
              {(() => {
                const totalScrapPcb = jobCards.reduce((acc, j) => acc + (j.rejectedPcbQty || 0), 0);
                const totalReworkJobs = jobCards.filter((j) => (j.rejectionLogs && j.rejectionLogs.length > 0) || (j.rejectedPcbQty && j.rejectedPcbQty > 0)).length;
                const totalFactoryPcb = jobCards.reduce((acc, j) => acc + (j.totalPcbQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 0)), 0);
                const factoryYieldPct = totalFactoryPcb > 0
                  ? Math.max(0, Math.min(100, ((totalFactoryPcb - totalScrapPcb) / totalFactoryPcb) * 100)).toFixed(1)
                  : '100.0';

                return (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 mb-4">
                    <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      QUALITY & LOSS MONITORING (DAILY MOVEMENT)
                    </h5>
                    <div className="text-xs text-emerald-950 space-y-1.5 font-sans">
                      <div className="flex justify-between items-center border-b border-emerald-200/80 pb-1">
                        <span>Total Daily Rework Jobs:</span>
                        <strong className="text-amber-800 font-mono font-black">{totalReworkJobs} Jobs Reworked</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-emerald-200/80 pb-1">
                        <span>Total Daily Rejection / Scrap:</span>
                        <strong className="text-emerald-800 font-mono font-black">
                          {totalScrapPcb} PCB Scrap ({factoryYieldPct}% Quality Yield)
                        </strong>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span>Overall Factory Production Yield:</span>
                        <strong className="text-emerald-700 font-mono font-black">{factoryYieldPct}% Yield Efficiency</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                  <div><span className="text-slate-400 font-mono">Quantity:</span> <strong className="text-indigo-700">{deleteConfirmCard.totalPcbQty || (deleteConfirmCard.custPnlQty && deleteConfirmCard.custPnlQty > 50 ? deleteConfirmCard.custPnlQty : (deleteConfirmCard.prodPnlQty * 4))} PCBs</strong></div>
                </div>
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> This will delete all associated sub-lots & stage logs. Action cannot be undone!
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmCard(null)}
                  disabled={Boolean(deleteConfirmCard && (deletingCardId === deleteConfirmCard.id || deletingCardId === deleteConfirmCard.jobCardNo))}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirmCard && handleDeleteJobCard(deleteConfirmCard)}
                  disabled={Boolean(deleteConfirmCard && (deletingCardId === deleteConfirmCard.id || deletingCardId === deleteConfirmCard.jobCardNo))}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteConfirmCard && (deletingCardId === deleteConfirmCard.id || deletingCardId === deleteConfirmCard.jobCardNo) ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
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

      {/* MODAL 7: JOB CARD TRACEABILITY & STAGE MOVEMENT HISTORY TIMELINE */}
      {historyModalJob && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto font-sans text-slate-900">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-5 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                    <History className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-950 text-lg">
                        Job Card Traceability & Stage Movement History
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 font-mono">
                        {historyModalJob.jobCardNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Chronological movement logs, stage transfers, operator timestamps & PCB rejections
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHistoryModalJob(null);
                    setHistoryLogs([]);
                  }}
                  className="text-slate-400 hover:text-slate-700 text-base font-bold p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Job Card Meta Specs summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">WIP Job No</span>
                    <strong className="text-slate-900 text-sm font-black">{historyModalJob.jobCardNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Customer Code</span>
                    <strong className="text-slate-800 font-bold">{historyModalJob.customerCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Customer Part</span>
                    <strong className="text-slate-800 font-bold truncate block">{historyModalJob.customerPartNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Stage</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[11px] truncate max-w-full">
                      {historyModalJob.currentStageName || PF01_STAGES[0]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">Volume:</span>
                    <strong className="text-indigo-700 font-black">{historyModalJob.totalPcbQty || historyModalJob.custPnlQty || 160} PCBs</strong>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-bold">WIP Area:</span>
                    <strong className="text-emerald-700 font-black">{Number(historyModalJob.custPnlAreaSqm || historyModalJob.prodPnlAreaSqm || 0).toFixed(2)} SQM</strong>
                  </div>

                  {historyModalJob.product && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">
                        {historyModalJob.product.layers ? `${historyModalJob.product.layers} Layers` : '2 Layers'}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">
                        {historyModalJob.product.thicknessMm ? `${historyModalJob.product.thicknessMm} mm` : '1.6 mm'}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">
                        {historyModalJob.product.copperWeight || historyModalJob.product.copper || '1oz'}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-blue-700 truncate max-w-[120px]">
                        {historyModalJob.product.surfaceFinish || 'HASL Lead-Free'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Logs Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Chronological Stage Movement Logs ({historyLogs.length})</span>
                  </h4>
                  {historyLogs.length > 0 && (
                    <button
                      onClick={() => {
                        let csvContent = "data:text/csv;charset=utf-8,Timestamp,Job Card No,Sub Lot,Stage,Qty Forwarded,Qty Rejected,Remarks,Operator\n";
                        historyLogs.forEach((l: any) => {
                          const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('en-GB') : '-';
                          const stageName = l.stage?.name || l.stageName || '-';
                          const subNo = l.subJobCard?.subJobCardNo || historyModalJob.jobCardNo;
                          const remarkStr = `"${(l.remarks || '').replace(/"/g, '""')}"`;
                          const userStr = `"${l.createdBy?.name || 'Operator'}"`;
                          csvContent += `${dateStr},${historyModalJob.jobCardNo},${subNo},${stageName},${l.qtyForwarded || 0},${l.qtyRejected || 0},${remarkStr},${userStr}\n`;
                        });
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `traceability_history_${historyModalJob.jobCardNo}_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                      <span>Export History CSV</span>
                    </button>
                  )}
                </div>

                {isHistoryLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-mono flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                    <span>Loading stage movement traceability records from database...</span>
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-mono bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
                    <p className="font-sans font-semibold text-slate-600 text-sm">No stage movement logs recorded yet for this Job Card.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Logs will appear automatically whenever an operator advances a stage or logs rejections.</p>
                  </div>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3">
                    {historyLogs.map((log: any, idx: number) => {
                      const dateObj = log.createdAt ? new Date(log.createdAt) : null;
                      const formattedDate = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      const formattedTime = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                      const isRejection = (log.qtyRejected || 0) > 0 || String(log.remarkType || '').includes('REJECT');

                      return (
                        <div
                          key={log.id || idx}
                          className={`p-3.5 rounded-2xl border text-xs font-sans transition-all space-y-2 ${
                            isRejection
                              ? 'bg-rose-50/80 border-rose-200 shadow-2xs'
                              : 'bg-slate-50/90 border-slate-200/90 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-[10px] flex items-center justify-center font-mono">
                                #{historyLogs.length - idx}
                              </span>
                              <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {log.subJobCard?.subJobCardNo || historyModalJob.jobCardNo}
                              </span>
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono text-[11px]">
                                {log.stage?.name || 'Process Stage'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-slate-700">{formattedDate}</span>
                              <span className="text-slate-400">{formattedTime}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">QTY FORWARDED</span>
                              <strong className="text-emerald-700 font-mono font-black text-xs">
                                {log.qtyForwarded || log.qtyProcessed || 0} PCBs
                              </strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">REJECTED PCB QTY</span>
                              <strong className={`font-mono font-black text-xs ${isRejection ? 'text-rose-700' : 'text-slate-600'}`}>
                                {log.qtyRejected || 0} PCBs
                              </strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold">OPERATOR / INSPECTOR</span>
                              <strong className="text-slate-800 font-bold truncate block">
                                {log.createdBy?.name || 'Production Operator'}
                              </strong>
                            </div>
                          </div>

                          {log.remarks && (
                            <div className={`p-2 rounded-xl border font-mono text-[11px] ${
                              isRejection ? 'bg-rose-100/60 text-rose-900 border-rose-300' : 'bg-white text-slate-700 border-slate-200'
                            }`}>
                              <span className="font-extrabold uppercase mr-1">Remarks:</span>
                              <span>{log.remarks}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  RF ELECTRO TECH ERP • ISO Traceability System
                </span>
                <button
                  onClick={() => {
                    setHistoryModalJob(null);
                    setHistoryLogs([]);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
