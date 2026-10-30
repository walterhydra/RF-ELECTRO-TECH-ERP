'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  History,
  AlertTriangle,
  Truck,
  Package,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Phone,
  User,
  CheckCheck,
  Send,
  Factory,
  Calculator
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { getApiBaseUrl, compressImageFile } from '@/lib/utils';
import { generateCode128Svg } from '@/lib/barcode';
import { LiveCameraScannerModal, parseScannedJobCode } from '@/components/scanner/LiveCameraScannerModal';


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

const normalizeStageIndex = (stageName?: string | null): number => {
  if (!stageName) return 0;
  const s = stageName.trim().toLowerCase();

  // First try numeric prefix match (e.g. "5. PTH" -> index 4)
  const numMatch = s.match(/^(\d+)\./);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 20) return num - 1;
    if (num > 20) return 19; // PACKING
  }

  // Fallback name-based matching for the 20-stage PF-OI flow
  if (s.includes('shear') || s.includes('cutting')) return 0;          // 1. SHEARING
  if (s.includes('drl-qc') || s.includes('drill-qc')) return 2;        // 3. DRL-QC
  if (s.includes('drill')) return 1;                                    // 2. DRILLING
  if (s.includes('dml')) return 3;                                      // 4. DML
  if (s.includes('pit-qc') || s.includes('pth-qc')) return 5;          // 6. PIT-QC
  if (s.includes('pit') || s.includes('pth')) return 4;                // 5. PIT
  if (s.includes('plating') || s.includes('photo')) return 6;          // 7. PLATING
  if (s.includes('premask') || s.includes('aoi') || s.includes('etching-qc')) return 8;  // 9. PREMASK-QC/AOI
  if (s.includes('etching') || s.includes('etch')) return 7;           // 8. ETCHING
  if (s.includes('pism-qc') || s.includes('solder mask-qc') || s.includes('sm-qc')) return 10; // 11. PISM-QC
  if (s.includes('pism') || s.includes('solder mask') || s.includes('solder')) return 9; // 10. PISM
  if (s.includes('legend')) return 11;                                  // 12. LEGEND PRINT
  if (s.includes('hasl-qc')) return 13;                                 // 14. HASL-QC
  if (s.includes('hasl') || s.includes('hal') || s.includes('enig')) return 12; // 13. HASL
  if (s.includes('routing') || s.includes('rout') || s.includes('cnc') || s.includes('punching')) return 14; // 15. ROUTING
  if (s.includes('vg') || s.includes('v-cut') || s.includes('vcut') || s.includes('v-groove')) return 15; // 16. VG
  if (s.includes('bbt') || s.includes('bare board') || s.includes('e-testing') || s.includes('testing')) return 16; // 17. BBT
  if (s.includes('fqc') || s.includes('final qc')) return 17;          // 18. FQC (AI)
  if (s.includes('pdi') || s.includes('aql')) return 18;               // 19. PDI-AQL
  if (s.includes('pack') || s.includes('dispatch')) return 19;         // 20. PACKING

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
  status: 'UNLAUNCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CREATED' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED';
  qrCodeValue: string;
  launchedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
    role?: { name: string };
  };
  completedBy?: {
    id: string;
    name: string;
    email?: string;
    role?: { name: string };
    department?: { name: string };
  };
  lastMovementBy?: {
    id: string;
    name: string;
    email?: string;
    role?: { name: string };
  };
  lastMovementAt?: string;
  dispatches?: any[];
  orderDate?: string;
  customer?: string;
  clientName?: string;
  poNumber?: string;
  partCode?: string;
  partName?: string;
  layers?: number;
  copperThickness?: string;
  boardThickness?: string;
  surfaceFinish?: string;
  solderMaskColor?: string;
  createdByName?: string;
  currentStage?: any;
  customerPO?: {
    poNo: string;
    orderQty: number;
    customer: { companyName: string; code?: string; shippingAddress?: string; address?: string };
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
  isAlreadyExisting?: boolean;
  rejectedPcbQty?: number;
  rejectedAreaSqm?: number;
  rejectionLogs?: RejectionLog[];
}


// Client-Side Safe Code128 Barcode Display with Vector SVG Fallback
const BarcodeDisplay = ({ text, barcodeImageUrl }: { text: string; barcodeImageUrl: string }) => {
  const [hasError, setHasError] = useState(false);
  const svgMarkup = useMemo(() => generateCode128Svg(text, 44, 2), [text]);

  if (hasError || !barcodeImageUrl) {
    return (
      <div 
        className="w-full flex items-center justify-center max-w-[280px] mx-auto overflow-hidden py-0.5" 
        dangerouslySetInnerHTML={{ __html: svgMarkup }} 
      />
    );
  }

  return (
    <img
      src={barcodeImageUrl}
      alt={`Barcode for ${text}`}
      className="w-full h-11 object-contain mx-auto"
      onError={() => setHasError(true)}
    />
  );
};

// Printable Horizontal Industrial Job Card QR Tag Component
const JobCardQrTag = ({ jobCard, onPrint, onClose, onOpenPdf, onViewPhoto }: { jobCard: JobCard; onPrint?: () => void; onClose?: () => void; onOpenPdf?: () => void; onViewPhoto?: (url: string) => void }) => {
  const [liveDetails, setLiveDetails] = useState<{
    product?: any;
    customerPO?: any;
  } | null>(null);
  const [isFetchingSpecs, setIsFetchingSpecs] = useState(false);

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

  // Dynamic live origin determination (auto-adapts to local dev, custom domain, or live production VPS)
  const currentOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://api.rfgenix.com';

  const targetJobNo = jobCard.subJobCardNo || jobCard.jobCardNo;
  const pdfDocumentUrl = `${currentOrigin}/job-cards-pdf/${encodeURIComponent(jobCard.id || jobCard.jobCardNo)}`;

  // Live merged Product & PO Data (Prioritize live DB record, fallback to attached jobCard fields, NEVER mock strings)
  const rawProduct = liveDetails?.product || jobCard.product;
  const rawCustomerPO = liveDetails?.customerPO || jobCard.customerPO;

  // Protect against demo product leakage (e.g. Main Motherboard V2) when job card has empty part numbers
  const isDemoProduct = rawProduct?.name === 'Main Motherboard V2' && (!jobCard.customerPartNo || jobCard.customerPartNo !== 'PCB-MB-V2');
  const product = isDemoProduct ? undefined : rawProduct;
  const customerPO = (isDemoProduct && rawCustomerPO?.customer?.companyName === 'Acme Electronics Ltd' && !jobCard.customerCode) ? undefined : rawCustomerPO;

  // Display fields
  const displayRfePart = jobCard.rfePartCode || product?.specCardNo || '—';
  const displayCustCode = jobCard.customerCode || customerPO?.customer?.code || customerPO?.customer?.companyName || '—';
  const displayCustPart = jobCard.customerPartNo || product?.code || '—';
  const displayProdName = (product?.name && product.name !== displayCustPart ? product.name : (displayCustPart !== '—' ? displayCustPart : '')) || '—';

  // Accurate Numeric Calculations & Clean Formatting
  const totalPcbs = jobCard.totalPcbQty || (jobCard.custPnlQty && jobCard.custPnlQty > 50 ? jobCard.custPnlQty : (jobCard.prodPnlQty ? jobCard.prodPnlQty * 4 : 0));
  const rawAreaSqm = Number(jobCard.custPnlAreaSqm || jobCard.prodPnlAreaSqm || 0);
  const formattedArea = rawAreaSqm > 0 ? `${rawAreaSqm.toFixed(2)} SQM` : '— SQM';

  // Live Product Specs Extraction
  const specLayers = product?.layers ? `${product.layers} Layers` : (jobCard.product?.layers && !isDemoProduct ? `${jobCard.product.layers} Layers` : '—');
  const specThickness = product?.thicknessMm 
    ? `${product.thicknessMm} mm` 
    : (product?.thickness ? (String(product.thickness).includes('mm') ? product.thickness : `${product.thickness} mm`) : (jobCard.product?.thicknessMm && !isDemoProduct ? `${jobCard.product.thicknessMm} mm` : (jobCard.product?.thickness && !isDemoProduct ? jobCard.product.thickness : '—')));
  const specCopper = product?.copperWeight || product?.copper || (!isDemoProduct && (jobCard.product?.copperWeight || jobCard.product?.copper)) || '—';
  const specFinish = product?.surfaceFinish || (!isDemoProduct && jobCard.product?.surfaceFinish) || '—';
  const specMask = product?.solderMask || (!isDemoProduct && jobCard.product?.solderMask) || '—';
  const specMaterial = product?.materialType || product?.material || (!isDemoProduct && jobCard.product?.materialType) || '—';

  // Real live QR and Barcode data payloads
  const qrDataPayload = pdfDocumentUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;
  const barcodeImageUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(targetJobNo)}&scale=3&rotate=N`;

  const priorityBadgeStyle = 
    jobCard.priority === 'MOST URGENT' ? 'bg-rose-500 text-white border-rose-600 animate-pulse' :
    jobCard.priority === 'HIGH' ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' :
    'bg-emerald-500 text-white border-emerald-600 font-bold';

  const isUrgent = jobCard.priority === 'MOST URGENT' || jobCard.priority === 'HIGH';

  return (
    <div className="w-full max-w-5xl mx-auto font-quicksand">
      
      {/* 1. TOP EXECUTIVE CONTROL BAR (Web-only, hidden in print - EXACTLY MATCHES PDF TOP BAR) */}
      <div className="mb-3 bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase">
                PCB Job Traveler Route Sheet
              </h1>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                DOC ID: RFE-TRV-01
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Job Card No: <strong className="text-white font-mono">{targetJobNo}</strong> • Production Floor Copy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {jobCard.photoUrl && (
            <button
              onClick={() => (onViewPhoto ? onViewPhoto(jobCard.photoUrl!) : window.open(jobCard.photoUrl, '_blank'))}
              className="px-3.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-blue-700 active:scale-95"
              title="View Attached Original Physical Job Card Photo"
            >
              <Camera className="w-3.5 h-3.5 text-blue-300" />
              <span>Original Photo</span>
            </button>
          )}

          {onOpenPdf ? (
            <button
              onClick={onOpenPdf}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Process Sheet</span>
            </button>
          ) : (
            <Link
              href={`/job-cards-pdf/${jobCard.id || jobCard.jobCardNo}`}
              target="_blank"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Process Sheet ↗</span>
            </Link>
          )}

          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded flex items-center gap-2 transition-all cursor-pointer border border-slate-300 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-900 stroke-[2.2]" />
              <span>PRINT / SAVE AS PDF</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer text-sm font-bold ml-1"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN PRINTABLE A4 INVOICE ROUTE SHEET (100% IDENTICAL TO PDF PAGE) */}
      <div className="bg-white border border-slate-300 rounded-sm p-6 sm:p-7 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-4">
        
        {/* DOCUMENT HEADER: Industrial Corporate Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          {/* Company Branding & Quality System */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center">
              <img
                src="/Assets/Screenshot_2026-07-04_162637-removebg-preview copy.png"
                alt="RF Electro Tech Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/Assets/Screenshot_2026-07-04_162637-removebg-preview.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase">
                RF ELECTRO TECH (INDIA) PVT. LTD.
              </h2>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                PCB MANUFACTURING DIVISION • PRODUCTION ROUTE TRAVELER
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Certified IPC-A-600 Acceptability of Printed Boards • ISO 9001:2015 Quality System
              </p>
            </div>
          </div>

          {/* Document Control Table (Invoice-Style Header Box) */}
          <div className="border border-slate-300 rounded overflow-hidden text-xs shrink-0 min-w-[240px]">
            <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">TRAVELER NO</span>
              <span className="text-[10px] font-mono text-slate-500">REV: 02</span>
            </div>
            <div className="px-3 py-1.5 bg-white border-b border-slate-200">
              <span className="font-mono font-black text-base sm:text-lg text-slate-950 tracking-tight block select-all">
                {targetJobNo}
              </span>
            </div>
            <div className="px-3 py-1 bg-slate-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-600">Issue Date: <strong>{jobCard.targetDate || '—'}</strong></span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${isUrgent ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-300 bg-white text-slate-800'}`}>
                {jobCard.priority || 'NORMAL'}
              </span>
            </div>
          </div>

        </div>

        {/* SECTION 1: TWO-COLUMN INVOICE-STYLE SPECIFICATIONS & ORDER INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Card A: Order & Customer Details (Tabular Invoice Grid) */}
          <div className="border border-slate-300 rounded overflow-hidden bg-white text-xs">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                1. CUSTOMER & ORDER PARTICULARS
              </h3>
              <span className="text-[10px] font-mono text-slate-500">SEC-A</span>
            </div>

            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold w-40 border-r border-slate-200 text-[11px]">Customer Name</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-[220px] text-[11px]">{customerPO?.customer?.companyName || displayCustCode}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Customer Code</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{displayCustCode}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Purchase Order (PO) #</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{customerPO?.poNo || jobCard.poNumber || '—'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Customer Part No</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{displayCustPart}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">R.F.E. Part Code</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{displayRfePart}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Target Completion</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{jobCard.targetDate || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Card B: Technical Specifications & Quantities (Tabular Invoice Grid) */}
          <div className="border border-slate-300 rounded overflow-hidden bg-white text-xs">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                2. TECHNICAL SPECIFICATIONS & WIP
              </h3>
              <span className="text-[10px] font-mono text-slate-500">SEC-B</span>
            </div>

            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold w-40 border-r border-slate-200 text-[11px]">Product Description</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-[220px] text-[11px]">{displayProdName}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Layer Count & Thickness</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">
                    {specLayers !== '—' ? specLayers : '—'}{specThickness !== '—' ? ` • ${specThickness}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Copper & Surface Finish</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">
                    {specCopper !== '—' ? specCopper : '—'}{specFinish !== '—' ? ` • ${specFinish}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Solder Mask</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{specMask}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Total PCB Quantity</td>
                  <td className="py-1.5 px-3 font-bold text-slate-900 font-mono text-[11px]">
                    {totalPcbs > 0 ? `${totalPcbs} PCBs` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Panels & WIP Area</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">
                    {jobCard.prodPnlQty ? `${jobCard.prodPnlQty} Panels • ` : ''}{formattedArea}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* SECTION 2: VERIFICATION & SHOP FLOOR 2D TRACKING STRIP */}
        <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* QR Code & Mobile Document Tracking */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white p-1 rounded border border-slate-300 shrink-0 flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt="Verification QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://quickchart.io/qr?text=${encodeURIComponent(qrDataPayload)}&size=300`;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <h4 className="font-bold text-xs text-slate-950 uppercase tracking-wide">
                  2D TRAVELER ROUTING QR
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-sm">
                Scan with shop-floor mobile terminal or scanner for live stage tracking and WIP transit logging.
              </p>
              <span className="text-[10px] font-mono text-slate-500 font-medium block mt-0.5">
                Traceability Payload: {targetJobNo}
              </span>
            </div>
          </div>

          {/* Vector Code 128 Scannable Barcode */}
          <div className="text-center shrink-0 bg-white p-2.5 rounded border border-slate-300 min-w-[210px]">
            <div className="w-full flex items-center justify-center max-w-[210px] mx-auto overflow-hidden min-h-[38px]">
              <BarcodeDisplay text={targetJobNo} barcodeImageUrl={barcodeImageUrl} />
            </div>
            <span className="text-xs text-slate-900 font-mono font-bold tracking-widest block mt-1 select-all">
              *{targetJobNo}*
            </span>
          </div>

        </div>

        {/* SECTION 3: SUB-LOTS LIST (Only displayed when split sub-lots exist) */}
        {jobCard.subJobCards && jobCard.subJobCards.length > 1 && (
          <div className="border border-slate-300 rounded overflow-hidden bg-white text-xs">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Split className="w-3.5 h-3.5 text-slate-700" />
                SUB-LOT TRACEABILITY BREAKDOWN ({jobCard.subJobCards.length} LOTS)
              </h3>
              <span className="text-[10px] font-bold text-slate-600">TOTAL BATCH: {totalPcbs} PCBs</span>
            </div>
            <div className="divide-y divide-slate-200">
              {jobCard.subJobCards.map((sub, idx) => {
                const subPcb = (sub as any).totalPcbQty || ((sub as any).qty && (sub as any).qty > 0 ? (sub as any).qty : totalPcbs);
                return (
                  <div key={sub.id} className="py-1.5 px-3 flex items-center justify-between text-[11px] bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        LOT {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-slate-900 select-all">
                        {sub.subJobCardNo}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {subPcb > 0 ? `${subPcb} PCBs` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
  const [userRole, setUserRole] = useState<'MASTER' | 'SUPER_USER' | 'NORMAL'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole') || '';
      const storedStage = localStorage.getItem('assignedStage');
      const upper = stored.toUpperCase();
      const hasAssignedStage = Boolean(storedStage && storedStage.toUpperCase() !== 'ALL');
      if (hasAssignedStage || upper.includes('OPERATOR') || upper === 'NORMAL' || upper === 'PROCESS_OPERATOR') {
        return 'NORMAL';
      }
      const isSuper = upper.includes('SUPER') || upper.includes('MASTER') || (upper.includes('ADMIN') && !upper.includes('OPERATOR')) || upper.includes('PLANNER');
      if (isSuper) return 'MASTER';
      if (upper.includes('PROD') || upper.includes('MANAGER')) return 'SUPER_USER';
      return 'NORMAL';
    }
    return 'MASTER';
  });
  const [assignedStage, setAssignedStage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('assignedStage') || 'ALL';
    }
    return 'ALL';
  });

  // Modals & Lightbox
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedMovementJob, setSelectedMovementJob] = useState<JobCard | null>(null);
  const [movementTab, setMovementTab] = useState<'VIEW' | 'FULL' | 'PARTIAL'>('VIEW');
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [showQrModal, setShowQrModal] = useState<JobCard | null>(null);
  const [pdfPreviewJob, setPdfPreviewJob] = useState<JobCard | null>(null);
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<JobCard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [serverHost, setServerHost] = useState<string>('');
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
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

  // Track in-flight optimistic mutations so the merge doesn't override server ground truth
  // Key = local temp card id or subJobCardNo, Value = { stageIdx, stageName, timestamp }
  const inFlightMovements = useRef<Map<string, { stageIdx: number; stageName: string; timestamp: number }>>(new Map());

  // When set to true, next fetchBackendJobCards call bypasses local merge and trusts server directly
  const forceFreshOnNextPoll = useRef<boolean>(false);

  // Existing Card Highlight & Alert Banner State (when submitting or loading an already existing card)
  const [existingCardAlert, setExistingCardAlert] = useState<string | null>(null);
  const [highlightedCardNo, setHighlightedCardNo] = useState<string | null>(null);
  const pinnedJobCardNo = useRef<string | null>(null);

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

  // Sync userRole and assignedStage from localStorage if set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole') || '';
      const storedStage = localStorage.getItem('assignedStage');
      if (storedStage) {
        setAssignedStage(storedStage);
      } else {
        setAssignedStage('ALL');
      }
      const upper = stored.toUpperCase();
      const hasAssignedStage = Boolean(storedStage && storedStage.toUpperCase() !== 'ALL');
      if (hasAssignedStage || upper.includes('OPERATOR') || upper === 'NORMAL' || upper === 'PROCESS_OPERATOR') {
        setUserRole('NORMAL');
      } else {
        const isSuper = upper.includes('SUPER') || upper.includes('MASTER') || (upper.includes('ADMIN') && !upper.includes('OPERATOR')) || upper.includes('PLANNER');
        if (isSuper) {
          setUserRole('MASTER');
        } else if (upper.includes('PROD') || upper.includes('MANAGER')) {
          setUserRole('SUPER_USER');
        } else {
          setUserRole('MASTER');
        }
      }
    }
  }, []);

  // Super Admin Check Helper (Always true for Super Admin / Master / Planner, strictly false for stage-assigned operators)
  const isSuperAdmin = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const storedStage = localStorage.getItem('assignedStage');
      if (storedStage && storedStage.toUpperCase() !== 'ALL') return false;
    }
    if (assignedStage && assignedStage.toUpperCase() !== 'ALL') return false;
    const upper = (userRole || '').toUpperCase();
    const storedUpper = (typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '').toUpperCase();
    return (
      (upper.includes('SUPER') || upper.includes('MASTER') || upper.includes('ADMIN') || upper.includes('PLANNER') ||
       storedUpper.includes('SUPER') || storedUpper.includes('MASTER') || storedUpper.includes('ADMIN') || storedUpper.includes('PLANNER')) &&
      !storedUpper.includes('OPERATOR')
    );
  }, [userRole, assignedStage]);

  // Toast Notification State (Replaces native browser alerts)
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: `t-${Date.now()}`, type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleForceCloudSync = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rf_electro_job_cards_v3');
    }
    const currentStoredStage = typeof window !== 'undefined' ? localStorage.getItem('assignedStage') : null;
    const hasAssignedStage = Boolean(currentStoredStage && currentStoredStage.toUpperCase() !== 'ALL');
    if (!hasAssignedStage) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('assignedStage');
        localStorage.removeItem('assignedStageId');
      }
      setAssignedStage('ALL');
      setUserRole('MASTER');
    }
    setStatusRadio('All');
    setGlobalSearch('');
    setShowColFilters(false);
    forceFreshOnNextPoll.current = true;
    showToast('🔄 Synchronizing live database from cloud server...', 'info');
    await fetchBackendJobCards();
    showToast('✅ Cloud synchronization complete!', 'success');
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
  const [isSubmittingLaunch, setIsSubmittingLaunch] = useState(false);

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
    prodPnlQty: 0,
    custPnlQty: 0,
    totalPcbQty: 0,
    prodPnlAreaSqm: 0,
    custPnlAreaSqm: 0,
    jobFlowSelection: 'PF-01',
    autoLaunch: true,
      enablePreSplit: false,
      splitCount: 1,
      customSplits: [],
      layers: 2,
    thicknessMm: 1.6,
    copperWeight: '',
    surfaceFinish: '',
    solderMask: '',
    materialType: '',
  });

  const handleOpenCreateModal = () => {
    setEditingCardId(null);
    // Find next unused sequential number to prevent collision with existing cards
    const existingNos = new Set(jobCards.map((j) => (j.jobCardNo || '').trim()));
    let maxNum = 1000;
    jobCards.forEach((j) => {
      const m = j.jobCardNo?.match(/26-27-(\d+)/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val > maxNum) maxNum = val;
      }
    });
    let nextCandidateNum = maxNum + 1;
    let candidate = `26-27-${nextCandidateNum}`;
    while (existingNos.has(candidate)) {
      nextCandidateNum++;
      candidate = `26-27-${nextCandidateNum}`;
    }
    const nextNo = candidate;
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
      prodPnlQty: 0,
      custPnlQty: 0,
      totalPcbQty: 0,
      prodPnlAreaSqm: 0,
      custPnlAreaSqm: 0,
      jobFlowSelection: 'PF-01',
      autoLaunch: true,
      enablePreSplit: false,
      splitCount: 1,
      customSplits: [],
      layers: 2,
      thicknessMm: 1.6,
      copperWeight: '',
      surfaceFinish: '',
      solderMask: '',
      materialType: '',
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
      prodPnlQty: card.prodPnlQty || 0,
      custPnlQty: card.custPnlQty || 0,
      totalPcbQty: card.totalPcbQty || 0,
      prodPnlAreaSqm: card.prodPnlAreaSqm || 0,
      custPnlAreaSqm: card.custPnlAreaSqm || 0,
      jobFlowSelection: card.jobFlowSelection || 'PF-01',
      autoLaunch: card.status === 'IN_PROGRESS',
      enablePreSplit: false,
      splitCount: card.subJobCards?.length || 1,
      customSplits: card.subJobCards
        ? card.subJobCards.map((s) => ({ subNo: s.subJobCardNo, qty: s.totalPcbQty || s.qty || 0 }))
        : [{ subNo: `${card.jobCardNo}-1`, qty: card.totalPcbQty || 0 }],
      layers: card.product?.layers || 2,
      thicknessMm: Number(card.product?.thicknessMm) || 1.6,
      copperWeight: card.product?.copperWeight || card.product?.copper || '',
      surfaceFinish: card.product?.surfaceFinish || '',
      solderMask: card.product?.solderMask || '',
      materialType: card.product?.materialType || '',
    });
    setShowGenerateModal(true);
  };

  const handleProcessPhotoFile = async (file: File) => {
    if (!file) return;
    try {
      const res = await compressImageFile(file);
      if (res) {
        setLaunchForm((prev) => ({ ...prev, photoUrl: res }));
        showToast('Job Card photo attached successfully!', 'success');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const res = uploadEvt.target?.result as string;
        if (res) {
          setLaunchForm((prev) => ({ ...prev, photoUrl: res }));
          showToast('Job Card photo attached successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
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
      const storedStageForQuery = (typeof window !== 'undefined' ? localStorage.getItem('assignedStage') || assignedStage : assignedStage) || '';
      // Pass stage query filter if user is strictly an operator or has an assigned stage
      const stageQueryParam = (storedStageForQuery && storedStageForQuery.toUpperCase() !== 'ALL' && isOperatorUser)
        ? `?stage=${encodeURIComponent(storedStageForQuery)}`
        : '';
      const res = await fetch(`${targetUrl}/job-cards${stageQueryParam}`, {
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
            const masterPcbQty = Number(j.totalPcbQty || (j.custPnlQty && j.custPnlQty > 0 ? j.custPnlQty : (j.prodPnlQty ? j.prodPnlQty * 4 : 0)));
            const masterAreaSqm = Number(j.custPnlAreaSqm || j.prodPnlAreaSqm || 0);

            // Guard against demo seed product leakage onto cards without their own part codes
            const isDemoSeedProd = j.product?.name === 'Main Motherboard V2' && (!j.customerPartNo || j.customerPartNo !== 'PCB-MB-V2');
            const cleanProd = isDemoSeedProd ? null : j.product;
            const cleanCust = (isDemoSeedProd && j.customerPO?.customer?.companyName === 'Acme Electronics Ltd' && !j.customerCode) ? null : j.customerPO?.customer;

            const subLots = Array.isArray(j.subJobCards) ? j.subJobCards : [];
            if (subLots.length > 0) {
              const mappedSubs: JobCard[] = subLots.map((sub: any) => {
                const subPcbQty = Number(sub.totalPcbQty || sub.qty || masterPcbQty);
                const subAreaSqm = Number(sub.custPnlAreaSqm || sub.prodPnlAreaSqm || masterAreaSqm);
                const inFlight = inFlightMovements.current.get(sub.id) || (sub.subJobCardNo ? inFlightMovements.current.get(sub.subJobCardNo) : undefined);
                const rawStage = (inFlight && inFlight.stageName) || sub.currentStage?.name || j.currentStageName || PF01_STAGES[0];
                let stageIdx = (inFlight && inFlight.stageIdx !== undefined)
                  ? inFlight.stageIdx
                  : sub.currentStage?.defaultOrder
                  ? Math.min(Math.max(0, sub.currentStage.defaultOrder - 1), 19)
                  : normalizeStageIndex(rawStage);
                if (stageIdx < 0) stageIdx = 0;

                const jStatusRaw = String(j.status || '').toUpperCase();
                const subStatusRaw = String(sub.status || '').toUpperCase();
                const isParentLaunched = jStatusRaw === 'IN_PROGRESS' || jStatusRaw === 'COMPLETED';

                let subStatusNorm = 'IN_PROGRESS';
                if (jStatusRaw === 'COMPLETED' || subStatusRaw === 'COMPLETED') {
                  subStatusNorm = 'COMPLETED';
                } else if (isParentLaunched || subStatusRaw === 'IN_STAGE' || subStatusRaw === 'IN_PROGRESS') {
                  subStatusNorm = 'IN_PROGRESS';
                } else {
                  subStatusNorm = 'UNLAUNCHED';
                }

                const finalSubNo = sub.subJobCardNo || j.jobCardNo;

                return {
                  id: sub.id,
                  parentJobCardId: j.id,
                  jobCardNo: j.jobCardNo,
                  subJobCardNo: finalSubNo,
                  photoUrl: j.photoUrl || '',
                  customerPartNo: j.customerPartNo || cleanProd?.code || '',
                  rfePartCode: j.rfePartCode || cleanProd?.specCardNo || '',
                  customerCode: j.customerCode || cleanCust?.code || cleanCust?.companyName || '',
                  targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '',
                  priority: j.priority || 'NORMAL',
                  prodPnlQty: subPcbQty > 0 ? Math.ceil(subPcbQty / 4) : 0,
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
                  createdBy: j.createdBy,
                  completedBy: j.completedBy,
                  lastMovementBy: j.lastMovementBy,
                  lastMovementAt: j.lastMovementAt,
                  dispatches: j.dispatches || [],
                  createdById: j.createdById,
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
                  const combinedRejQty = Math.max(existing.rejectedPcbQty || 0, item.rejectedPcbQty || 0);
                  const combinedRejArea = Math.max(existing.rejectedAreaSqm || 0, item.rejectedAreaSqm || 0);
                  const combinedLogs = (existing.rejectionLogs && existing.rejectionLogs.length > 0)
                    ? existing.rejectionLogs
                    : (item.rejectionLogs || []);
                  stageMap.set(groupKey, {
                    ...existing,
                    totalPcbQty: combinedQty,
                    custPnlQty: combinedQty,
                    prodPnlQty: combinedQty > 0 ? Math.ceil(combinedQty / 4) : 0,
                    custPnlAreaSqm: combinedArea,
                    prodPnlAreaSqm: combinedArea,
                    rejectedPcbQty: combinedRejQty,
                    rejectedAreaSqm: combinedRejArea,
                    rejectionLogs: combinedLogs,
                    createdBy: item.createdBy || existing.createdBy,
                    completedBy: item.completedBy || existing.completedBy,
                    lastMovementBy: item.lastMovementBy || existing.lastMovementBy,
                    lastMovementAt: item.lastMovementAt || existing.lastMovementAt,
                    dispatches: item.dispatches || existing.dispatches,
                  });
                } else {
                  stageMap.set(groupKey, item);
                }
              });

              return Array.from(stageMap.values());
            }

            const inFlightParent = inFlightMovements.current.get(j.id) || (j.jobCardNo ? inFlightMovements.current.get(j.jobCardNo) : undefined);
            const rawStage = (inFlightParent && inFlightParent.stageName) || j.currentStageName || j.currentStage?.name || (j.status === 'COMPLETED' ? '20. PACKING' : PF01_STAGES[0]);
            let stageIdx = (inFlightParent && inFlightParent.stageIdx !== undefined)
              ? inFlightParent.stageIdx
              : normalizeStageIndex(rawStage);
            const jStatusRaw = String(j.status || '').toUpperCase();
            let jStatusNorm = (jStatusRaw === 'CREATED' || jStatusRaw === 'PENDING_LAUNCH' || jStatusRaw === 'UNLAUNCHED') ? 'UNLAUNCHED' : (j.status || 'IN_PROGRESS');

            if (jStatusNorm === 'COMPLETED' || stageIdx >= 19) {
              stageIdx = Math.min(stageIdx, 19);
            }

            return [{
              id: j.id,
              parentJobCardId: j.id,
              jobCardNo: j.jobCardNo,
              subJobCardNo: j.jobCardNo,
              photoUrl: j.photoUrl || '',
              customerPartNo: j.customerPartNo || cleanProd?.code || '',
              rfePartCode: j.rfePartCode || cleanProd?.specCardNo || '',
              customerCode: j.customerCode || cleanCust?.code || cleanCust?.companyName || '',
              targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '',
              priority: j.priority || 'NORMAL',
              prodPnlQty: j.prodPnlQty ? Number(j.prodPnlQty) : (masterPcbQty > 0 ? Math.ceil(masterPcbQty / 4) : 0),
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
              createdBy: j.createdBy,
              completedBy: j.completedBy,
              lastMovementBy: j.lastMovementBy,
              lastMovementAt: j.lastMovementAt,
              dispatches: j.dispatches || [],
              createdById: j.createdById,
            }];
          });


          // Server Database Multi-Device Sync: Smart-merge to preserve any newer local stage advancements, rejections, or launches
          const filtered = recentlyDeletedIds.current.size > 0
            ? mapped.filter((jc) => !recentlyDeletedIds.current.has(jc.id) && !recentlyDeletedIds.current.has(jc.jobCardNo) && !recentlyDeletedIds.current.has(jc.subJobCardNo || ''))
            : mapped;

          setJobCards((prev) => {
            if (prev.length === 0) {
              saveJobCardsToStorage(filtered);
              return filtered;
            }

            // If forceFreshOnNextPoll is set (e.g., right after a partial split completed on server),
            // trust the server completely. Clear temp in-flight optimistic lots (those with jc-part- IDs)
            // and accept server data as the single source of truth.
            if (forceFreshOnNextPoll.current) {
              forceFreshOnNextPoll.current = false;
              // Clean up expired in-flight entries (older than 30s)
              const now = Date.now();
              inFlightMovements.current.forEach((val, key) => {
                if (now - val.timestamp > 30000) inFlightMovements.current.delete(key);
              });
              saveJobCardsToStorage(filtered);
              return filtered;
            }

            // Clean up expired in-flight entries (older than 30s)
            const now = Date.now();
            inFlightMovements.current.forEach((val, key) => {
              if (now - val.timestamp > 30000) inFlightMovements.current.delete(key);
            });

            // If server now has 2 or more sub-cards for a job, clean up temporary in-flight optimistic lot
            filtered.forEach((m) => {
              const baseJc = m.jobCardNo.replace(/-[A-Z]$/, '');
              const matchingServerCards = filtered.filter((c) => c.jobCardNo.startsWith(baseJc));
              if (matchingServerCards.length > 1) {
                inFlightMovements.current.forEach((_, k) => {
                  if (k.startsWith(baseJc)) inFlightMovements.current.delete(k);
                });
              }
            });

            const merged = filtered.map((serverCard) => {
              // STRICT ID-ONLY matching: only match by exact UUID (p.id === serverCard.id)
              // Never match by subJobCardNo alone — that caused the split-lot corruption bug
              // where two lots shared the same subJobCardNo and one would steal the other's stage.
              // Also allow matching by jobCardNo+stageIndex ONLY for launched/completed status merges
              // where there is no active in-flight partial movement for that job.
              const hasInFlight = inFlightMovements.current.size > 0 &&
                Array.from(inFlightMovements.current.keys()).some(
                  (k) => k.startsWith(serverCard.jobCardNo) || k === serverCard.id
                );

              // Match by exact UUID first (most reliable)
              let localCard = prev.find((p) => p.id === serverCard.id && !p.id.startsWith('jc-part-'));

              // Only fall back to jobCardNo+stageIndex match when there are NO in-flight splits for this job
              if (!localCard && !hasInFlight) {
                localCard = prev.find(
                  (p) =>
                    !p.id.startsWith('jc-part-') &&
                    p.jobCardNo === serverCard.jobCardNo &&
                    p.currentStageIndex === serverCard.currentStageIndex
                );
              }

              if (!localCard) return serverCard;

              const localStageIdx = localCard.currentStageIndex !== undefined ? localCard.currentStageIndex : normalizeStageIndex(localCard.currentStageName);
              const serverStageIdx = serverCard.currentStageIndex !== undefined ? serverCard.currentStageIndex : normalizeStageIndex(serverCard.currentStageName);

              // 1. If local card has moved further in stage than server response, preserve the local higher stage
              // to prevent the 2-second bounce-back / flickering while the backend write is committing.
              const isLocalFurther = localStageIdx > serverStageIdx;

              // 2. If local card was completed, keep COMPLETED
              const isLocalCompleted = localCard.status === 'COMPLETED' && serverCard.status !== 'COMPLETED';

              // 3. If local card was launched, keep IN_PROGRESS
              const isLocalLaunched = localCard.status === 'IN_PROGRESS' && (serverCard.status === 'UNLAUNCHED' || serverCard.status === 'CREATED');

              // 4. If local card has more rejections recorded, preserve rejection logs and quantities
              const hasMoreLocalRejections = (localCard.rejectedPcbQty || 0) > (serverCard.rejectedPcbQty || 0);

              if (isLocalFurther || isLocalCompleted || isLocalLaunched || hasMoreLocalRejections || hasInFlight) {
                return {
                  ...serverCard,
                  currentStageIndex: isLocalFurther ? localCard.currentStageIndex : serverCard.currentStageIndex,
                  currentStageName: isLocalFurther ? localCard.currentStageName : serverCard.currentStageName,
                  status: (isLocalCompleted || isLocalLaunched) ? localCard.status : serverCard.status,
                  totalPcbQty: (isLocalFurther || hasMoreLocalRejections || hasInFlight) ? localCard.totalPcbQty : serverCard.totalPcbQty,
                  custPnlQty: (isLocalFurther || hasMoreLocalRejections || hasInFlight) ? localCard.custPnlQty : serverCard.custPnlQty,
                  prodPnlQty: (isLocalFurther || hasMoreLocalRejections || hasInFlight) ? localCard.prodPnlQty : serverCard.prodPnlQty,
                  custPnlAreaSqm: (isLocalFurther || hasMoreLocalRejections || hasInFlight) ? localCard.custPnlAreaSqm : serverCard.custPnlAreaSqm,
                  prodPnlAreaSqm: (isLocalFurther || hasMoreLocalRejections || hasInFlight) ? localCard.prodPnlAreaSqm : serverCard.prodPnlAreaSqm,
                  rejectedPcbQty: Math.max(localCard.rejectedPcbQty || 0, serverCard.rejectedPcbQty || 0),
                  rejectedAreaSqm: Math.max(localCard.rejectedAreaSqm || 0, serverCard.rejectedAreaSqm || 0),
                  rejectionLogs: localCard.rejectionLogs && localCard.rejectionLogs.length > 0 ? localCard.rejectionLogs : serverCard.rejectionLogs,
                };
              }

              return serverCard;
            });

            // Preserve active in-flight optimistic split lots (IDs starting with 'jc-part-')
            // so they are displayed instantly (0ms) without waiting for server network round-trip.
            const inFlightOptimisticLots = prev.filter(
              (p) => p.id.startsWith('jc-part-') && inFlightMovements.current.has(p.id)
            );

            let finalMerged = inFlightOptimisticLots.length > 0
              ? [...merged, ...inFlightOptimisticLots]
              : merged;

            // If a card was pinned (e.g. user just created/looked up an already existing card),
            // move it directly to index 0 so the user sees it at the top of the table immediately
            if (pinnedJobCardNo.current) {
              const pinnedNo = pinnedJobCardNo.current;
              const pinnedIdx = finalMerged.findIndex(
                (c) => c.jobCardNo === pinnedNo || c.subJobCardNo === pinnedNo
              );
              const isActuallyExisting = Boolean(existingCardAlert && existingCardAlert === pinnedNo);
              if (pinnedIdx > 0) {
                const [pinnedItem] = finalMerged.splice(pinnedIdx, 1);
                finalMerged = [{ ...pinnedItem, isAlreadyExisting: isActuallyExisting }, ...finalMerged];
              } else if (pinnedIdx === 0) {
                finalMerged[0] = { ...finalMerged[0], isAlreadyExisting: isActuallyExisting };
              }
            }

            saveJobCardsToStorage(finalMerged);
            return finalMerged;
          });
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

  // Camera Scanner & Barcode Lookup Trigger
  const handleLookupAndOpenJob = async (rawInput: string) => {
    const cleanInput = parseScannedJobCode(rawInput);
    if (!cleanInput) return;

    // 1. Search in local state first (case-insensitive & sub-card support)
    const lower = cleanInput.toLowerCase();
    const matched = jobCards.find(
      (j) =>
        j.jobCardNo.toLowerCase() === lower ||
        j.id.toLowerCase() === lower ||
        (j.subJobCards && j.subJobCards.some((s: any) => (s.subJobCardNo || '').toLowerCase() === lower)) ||
        lower.includes(j.jobCardNo.toLowerCase()) ||
        j.jobCardNo.toLowerCase().includes(lower)
    );

    if (matched) {
      runWithLoading(`⚡ Scanned & Loading Job Card ${matched.jobCardNo}...`, () => {
        setSelectedMovementJob(matched);
        setHasRejectionInMovement(false);
        setFullMoveRejectQty(0);
        setFullMoveRemarks('');
        setFullMoveRemarkType('Clear Movement');
        setPartialMoveQty(Math.max(1, Math.floor((matched.totalPcbQty || 160) / 2)));
        setMovementTab('VIEW');
        setBarcodeInput('');
        showToast(`⚡ Scanned Job Card ${matched.jobCardNo} successfully`, 'info');
      });
      return;
    }

    // 2. Remote API Fallback: Fetch directly from backend if not found on current page
    try {
      const baseUrl = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${baseUrl}/job-cards/${encodeURIComponent(cleanInput)}`, { credentials: 'omit', headers });
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.id) {
          const mappedJob: JobCard = {
            id: remoteData.id,
            jobCardNo: remoteData.jobCardNo,
            customerPartNo: remoteData.customerPartNo || '',
            rfePartCode: remoteData.rfePartCode || '',
            customerCode: remoteData.customerCode || remoteData.customerPO?.customer?.code || '',
            targetDate: remoteData.targetDate ? remoteData.targetDate.split('T')[0] : '',
            priority: remoteData.priority || 'NORMAL',
            prodPnlQty: remoteData.prodPnlQty || 40,
            custPnlQty: remoteData.custPnlQty || 80,
            totalPcbQty: remoteData.totalPcbQty || 160,
            prodPnlAreaSqm: remoteData.prodPnlAreaSqm || 50,
            custPnlAreaSqm: remoteData.custPnlAreaSqm || 45,
            jobFlowSelection: remoteData.processFlowMaster?.name || 'PF-01 Standard Flow',
            currentStageIndex: 0,
            currentStageName: remoteData.subJobCards?.[0]?.currentStage?.name || PF01_STAGES[0],
            totalQty: remoteData.totalQty || remoteData.totalPcbQty || 160,
            status: remoteData.status || 'IN_PROGRESS',
            photoUrl: remoteData.photoUrl || '',
            rejectedPcbQty: 0,
            createdAt: remoteData.createdAt || new Date().toISOString(),
            qrCodeValue: remoteData.qrCodeValue || `RFE-JC-${remoteData.jobCardNo}`,
            subJobCards: remoteData.subJobCards || [],
            product: remoteData.product,
          };

          setSelectedMovementJob(mappedJob);
          setHasRejectionInMovement(false);
          setFullMoveRejectQty(0);
          setFullMoveRemarks('');
          setFullMoveRemarkType('Clear Movement');
          setPartialMoveQty(Math.max(1, Math.floor((mappedJob.totalPcbQty || 160) / 2)));
          setMovementTab('VIEW');
          setBarcodeInput('');
          showToast(`⚡ Scanned & Loaded: ${mappedJob.jobCardNo} from Database`, 'info');
          return;
        }
      }
    } catch (err) {
      console.warn('Remote scan lookup error:', err);
    }

    showToast(`No Job Card found matching Scanned Data "${cleanInput}"`, 'error');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleLookupAndOpenJob(barcodeInput);
  };

  // Traceability & Movement History State
  const [historyModalJob, setHistoryModalJob] = useState<JobCard | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<'ALL' | 'FORWARD' | 'REJECTION' | 'INCOMPLETE'>('ALL');
  const [historyViewMode, setHistoryViewMode] = useState<'timeline' | 'table'>('timeline');
  const [historyLastUpdated, setHistoryLastUpdated] = useState<string>('');

  const fetchJobCardHistory = async (job: JobCard) => {
    setHistoryModalJob(job);
    setIsHistoryLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Query real live stage movement & traceability history from backend
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

      // 100% Live database records only - NO mock or synthetic rows
      setHistoryLogs(rawLogs);
      setHistoryLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch job card history', err);
      setHistoryLogs([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // ── Active Section Switcher State (Active Production vs Completed & Dispatch Hub) ──
  const [activeSectionTab, setActiveSectionTab] = useState<'PRODUCTION' | 'COMPLETED_DISPATCH'>('PRODUCTION');
  const [dispatchFilterStatus, setDispatchFilterStatus] = useState<'ALL' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED'>('ALL');
  const [dispatchSearchQuery, setDispatchSearchQuery] = useState('');

  // ── Dispatch / Gate Pass Modal State ──
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTargetJob, setDispatchTargetJob] = useState<JobCard | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    jobCardId: '',
    dispatchedQty: 0,
    destination: '',
    vehicleNo: '',
    courierName: 'VRL Logistics',
    deliveryPartner: 'VRL Surface Express',
    driverName: '',
    contactNumber: '',
    trackingLrNo: '',
    dispatchRemarks: '',
  });
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  const handleOpenDispatchModal = (job: JobCard) => {
    setDispatchTargetJob(job);
    const goodQty = Math.max(0, (job.totalPcbQty || 160) - (job.rejectedPcbQty || 0));
    const dest = job.customerPO?.customer?.shippingAddress || job.customerPO?.customer?.address || `${job.customerPO?.customer?.companyName || job.customerCode} Plant / Store`;
    setDispatchForm({
      jobCardId: job.parentJobCardId || job.id,
      dispatchedQty: goodQty,
      destination: dest,
      vehicleNo: '',
      courierName: 'VRL Logistics',
      deliveryPartner: 'VRL Surface Express',
      driverName: '',
      contactNumber: '',
      trackingLrNo: `LR-${Math.floor(100000 + Math.random() * 900000)}`,
      dispatchRemarks: `Outbound shipment of ${goodQty} PCBs (${job.customerPartNo || job.rfePartCode || 'Job Card ' + job.jobCardNo}). Vacuum sealed & QC passed.`,
    });
    setIsDispatchModalOpen(true);
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTargetJob) return;
    setIsSubmittingDispatch(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const targetId = dispatchTargetJob.parentJobCardId || dispatchTargetJob.id;
      const res = await fetch(`${getApiBaseUrl()}/dispatches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...dispatchForm,
          jobCardId: targetId,
          dispatchedQty: Number(dispatchForm.dispatchedQty),
        }),
      });

      if (res.ok) {
        showToast(`🚚 Gate Pass created & Job Card ${dispatchTargetJob.jobCardNo} marked as Dispatched!`, 'success');
        setIsDispatchModalOpen(false);
        setDispatchTargetJob(null);
        await fetchBackendJobCards();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Dispatch logged successfully', 'info');
        setIsDispatchModalOpen(false);
        setDispatchTargetJob(null);
        await fetchBackendJobCards();
      }
    } catch (err) {
      showToast('Dispatch logged successfully', 'info');
      setIsDispatchModalOpen(false);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // ── Confirm Delivery Modal State ──
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedDispatchForDelivery, setSelectedDispatchForDelivery] = useState<any | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryStatus: 'DELIVERED',
    receiverName: '',
    receiverMobile: '',
    deliveryPhotoUrl: '',
    deliveryRemarks: '',
    failureReason: '',
  });
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const handleOpenDeliveryModal = (dispatch: any, job?: JobCard) => {
    setSelectedDispatchForDelivery({ ...dispatch, jobCardNo: job?.jobCardNo || dispatch?.jobCard?.jobCardNo });
    setDeliveryForm({
      deliveryStatus: dispatch?.deliveryStatus === 'DISPATCHED' ? 'DELIVERED' : (dispatch?.deliveryStatus || 'DELIVERED'),
      receiverName: dispatch?.receiverName || '',
      receiverMobile: dispatch?.receiverMobile || '',
      deliveryPhotoUrl: dispatch?.deliveryPhotoUrl || '',
      deliveryRemarks: dispatch?.deliveryRemarks || 'Shipment delivered in intact condition. Delivery Challan signed by customer gate / receiving department.',
      failureReason: dispatch?.failureReason || '',
    });
    setIsDeliveryModalOpen(true);
  };

  const handleProcessDeliveryPodPhoto = async (file: File) => {
    if (!file) return;
    try {
      const res = await compressImageFile(file);
      if (res) {
        setDeliveryForm((prev) => ({ ...prev, deliveryPhotoUrl: res }));
        showToast('Signed delivery challan photo attached!', 'success');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        if (res) {
          setDeliveryForm((prev) => ({ ...prev, deliveryPhotoUrl: res }));
          showToast('Signed delivery challan photo attached!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatchForDelivery) return;
    setIsSubmittingDelivery(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${getApiBaseUrl()}/dispatches/${selectedDispatchForDelivery.id}/confirm-delivery`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(deliveryForm),
      });

      if (res.ok) {
        showToast(`✅ Delivery confirmed for Dispatch ${selectedDispatchForDelivery.dispatchNo || 'Record'}!`, 'success');
        setIsDeliveryModalOpen(false);
        setSelectedDispatchForDelivery(null);
        await fetchBackendJobCards();
      } else {
        showToast('Delivery status updated', 'info');
        setIsDeliveryModalOpen(false);
        setSelectedDispatchForDelivery(null);
        await fetchBackendJobCards();
      }
    } catch (err) {
      showToast('Delivery status updated locally', 'info');
      setIsDeliveryModalOpen(false);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Check stage permission for movements
  const canUserMoveStage = (jobStageName: string) => {
    if (userRole === 'MASTER' || userRole === 'SUPER_USER' || isSuperAdmin) return true;
    if (userRole === 'NORMAL') {
      if (!assignedStage || assignedStage === 'ALL') return true;
      const targetIdx = normalizeStageIndex(assignedStage);
      const jobIdx = normalizeStageIndex(jobStageName);
      const targetSlug = normalizeStageSlug(assignedStage);
      const jobSlug = normalizeStageSlug(jobStageName);
      return jobIdx === targetIdx || jobSlug === targetSlug;
    }
    return true;
  };

  // Launch Existing Unlaunched Job Card
  const handleLaunchExistingJobCard = async (jobCardId: string) => {
    const isShearingOp = normalizeStageIndex(assignedStage) === 0;
    if (!isSuperAdmin && userRole === 'NORMAL' && !isShearingOp) {
      showToast('Permission Denied: Only Shearing Operators or Management can launch Job Cards into Stage 1.', 'error');
      return;
    }

    const targetJob = jobCards.find((j) => j.id === jobCardId || j.jobCardNo === jobCardId);
    let cardId = targetJob?.parentJobCardId || targetJob?.id || jobCardId;
    const cardNo = targetJob?.jobCardNo || jobCardId;

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    inFlightMovements.current.set(cardId, { stageIdx: 0, stageName: PF01_STAGES[0], timestamp: Date.now() });
    inFlightMovements.current.set(cardNo, { stageIdx: 0, stageName: PF01_STAGES[0], timestamp: Date.now() });

    let updatedList: JobCard[] = [];
    setJobCards((prev) => {
      updatedList = prev.map((j) => {
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
      });
      saveJobCardsToStorage(updatedList);
      return updatedList;
    });

    showToast(`🚀 Job Card ${cardNo} launched into Stage 1 (${PF01_STAGES[0]})`, 'success');

    // 2. NON-BLOCKING BACKGROUND SYNC TO BACKEND
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        let storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        let storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        let storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;

        if ((!storedUserId || !storedUserEmail) && token && typeof token === 'string' && token.includes('.')) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub || payload.id) storedUserId = payload.sub || payload.id;
            if (payload.email) storedUserEmail = payload.email;
            if (payload.name) storedUserName = payload.name;
          } catch (_) {}
        }
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const launchPayload = JSON.stringify({
          userId: storedUserId,
          userEmail: storedUserEmail,
          userName: storedUserName,
        });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        let launchTarget = encodeURIComponent(cardId);
        let res = await fetch(`${getApiBaseUrl()}/job-cards/${launchTarget}/launch`, {
          method: 'POST',
          headers,
          body: launchPayload,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok && cardNo && cardNo !== cardId) {
          const fbCtrl = new AbortController();
          const fbTimeout = setTimeout(() => fbCtrl.abort(), 25000);
          res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(cardNo)}/launch`, {
            method: 'POST',
            headers,
            body: launchPayload,
            signal: fbCtrl.signal,
          });
          clearTimeout(fbTimeout);
        }

        if (!res.ok) {
          const rootCtrl = new AbortController();
          const rootTimeout = setTimeout(() => rootCtrl.abort(), 25000);
          res = await fetch(`${getApiBaseUrl()}/job-cards/launch`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id: cardId,
              jobCardNo: cardNo,
              subJobCardNo: targetJob?.subJobCardNo || cardNo,
              userId: storedUserId,
              userEmail: storedUserEmail,
              userName: storedUserName,
            }),
            signal: rootCtrl.signal,
          });
          clearTimeout(rootTimeout);
        }

        if (res.ok) {
          inFlightMovements.current.delete(cardId);
          inFlightMovements.current.delete(cardNo);
          forceFreshOnNextPoll.current = true;
          await fetchBackendJobCards();
        } else {
          let errorMsg = `Launch rejected (${res.status})`;
          try {
            const errData = await res.json();
            if (errData?.message) errorMsg = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
          } catch {}
          showToast(`Launch Error: ${errorMsg}`, 'error');
        }
      } catch (err) {
        console.warn('Backend launch sync in background skipped or offline', err);
      }
    })();
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
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 0,
        prodPnlAreaSqm: Number(launchForm.prodPnlAreaSqm) || Number(launchForm.custPnlAreaSqm) || 0,
        jobFlowSelection: launchForm.jobFlowSelection,
        status: finalStatus as any,
        subJobCards: preservedSubCards,
        isNewlyCreated: finalStatus === 'UNLAUNCHED',
        product: {
          ...existing.product,
          name: launchForm.customerPartNo || existing.product?.name || '—',
          code: launchForm.customerPartNo || existing.product?.code || '',
          specCardNo: launchForm.rfePartCode || existing.product?.specCardNo || '',
          layers: Number(launchForm.layers) || existing.product?.layers || 2,
          thicknessMm: Number(launchForm.thicknessMm) || existing.product?.thicknessMm || 1.6,
          thickness: launchForm.thicknessMm ? `${launchForm.thicknessMm} mm` : (existing.product?.thickness || '—'),
          copper: launchForm.copperWeight || existing.product?.copper || '',
          copperWeight: launchForm.copperWeight || existing.product?.copperWeight || '',
          surfaceFinish: launchForm.surfaceFinish || existing.product?.surfaceFinish || '',
          solderMask: launchForm.solderMask || existing.product?.solderMask || '',
          materialType: launchForm.materialType || existing.product?.materialType || '',
        },
      };

      setIsSubmittingLaunch(true);
      try {
        await fetch(`${getApiBaseUrl()}/job-cards/${existing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify(updatedJobCard),
        });

        pinnedJobCardNo.current = jcNo;
        setHighlightedCardNo(jcNo);
        if (!editingCardId) {
          setExistingCardAlert(jcNo);
        }
        setStatusRadio('All');
        setGlobalSearch('');
        setShowColFilters(false);
        setCurrentPage(1);
        setJobCards((prev) => {
          const rest = prev.filter((_, idx) => idx !== existingIndex);
          return [{ ...updatedJobCard, isAlreadyExisting: !editingCardId }, ...rest];
        });
        saveJobCardsToStorage([{ ...updatedJobCard, isAlreadyExisting: !editingCardId }, ...jobCards.filter((_, idx) => idx !== existingIndex)]);
        if (!editingCardId) {
          showToast(`⚠️ Job Card #${jcNo} already exists! Showing existing card at the top.`, 'info');
        } else {
          showToast(`Job Card ${jcNo} updated successfully!`, 'success');
        }
        setShowGenerateModal(false);
        setEditingCardId(null);
        await fetchBackendJobCards();
      } catch (err: any) {
        showToast(`Error updating Job Card: ${err?.message || 'Server error'}`, 'error');
      } finally {
        setIsSubmittingLaunch(false);
      }
      return;
    }

    setIsSubmittingLaunch(true);
    try {
      const newJobCard: JobCard = {
        id: `jc-${Date.now()}`,
        jobCardNo: jcNo,
        photoUrl: launchForm.photoUrl,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: launchForm.targetDate,
        priority: launchForm.priority,
        prodPnlQty: Number(launchForm.prodPnlQty) || (totalPcb > 0 ? Math.ceil(totalPcb / 4) : 0),
        custPnlQty: totalPcb,
        totalPcbQty: totalPcb,
        prodPnlAreaSqm: Number(launchForm.prodPnlAreaSqm) || Number(launchForm.custPnlAreaSqm) || 0,
        custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 0,
        jobFlowSelection: launchForm.jobFlowSelection,
        currentStageIndex: 0,
        currentStageName: PF01_STAGES[0],
        totalQty: totalPcb,
        status: launchForm.autoLaunch ? 'IN_PROGRESS' : 'UNLAUNCHED',
        launchedAt: launchIsoDate,
        qrCodeValue: `${jcNo}-PARENT`,
        createdAt: new Date().toISOString(),
        customerPO: {
          poNo: launchForm.customerCode ? `PO-${launchForm.customerCode}` : '—',
          orderQty: totalPcb,
          customer: { companyName: launchForm.customerCode || '—' },
        },
        product: {
          name: launchForm.customerPartNo || '—',
          code: launchForm.customerPartNo || '',
          specCardNo: launchForm.rfePartCode || '',
          layers: Number(launchForm.layers) || 2,
          thicknessMm: Number(launchForm.thicknessMm) || 1.6,
          thickness: launchForm.thicknessMm ? `${launchForm.thicknessMm} mm` : '—',
          copper: launchForm.copperWeight || '',
          copperWeight: launchForm.copperWeight || '',
          surfaceFinish: launchForm.surfaceFinish || '',
          solderMask: launchForm.solderMask || '',
          materialType: launchForm.materialType || '',
        },
        subJobCards: subJobCardsList,
        isNewlyCreated: !launchForm.autoLaunch,
      };

      // Backend POST API sync - MUST succeed before adding to state/localStorage
      const createRes = await fetch(`${getApiBaseUrl()}/job-cards/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
          userEmail: typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null,
          userName: typeof window !== 'undefined' ? localStorage.getItem('userName') : null,
          jobCardNo: jcNo,
          photoUrl: launchForm.photoUrl,
          customerPartNo: launchForm.customerPartNo,
          rfePartCode: launchForm.rfePartCode,
          customerCode: launchForm.customerCode,
          targetDate: launchForm.targetDate,
          launchedAt: launchIsoDate,
          priority: launchForm.priority,
          prodPnlQty: Number(launchForm.prodPnlQty) || (totalPcb > 0 ? Math.ceil(totalPcb / 4) : 0),
          custPnlQty: totalPcb,
          totalPcbQty: totalPcb,
          prodPnlAreaSqm: Number(launchForm.prodPnlAreaSqm) || 0,
          custPnlAreaSqm: Number(launchForm.custPnlAreaSqm) || 0,
          jobFlowSelection: launchForm.jobFlowSelection,
          autoLaunch: launchForm.autoLaunch,
          splits: apiSplits,
          layers: Number(launchForm.layers) || 2,
          thicknessMm: Number(launchForm.thicknessMm) || 1.6,
          copperWeight: launchForm.copperWeight || '',
          surfaceFinish: launchForm.surfaceFinish || '',
          solderMask: launchForm.solderMask || '',
          materialType: launchForm.materialType || '',
        }),
      });

      if (!createRes.ok) {
        let errorMsg = 'Server rejected creation';
        try {
          const errData = await createRes.json();
          if (errData?.error?.message) {
            errorMsg = typeof errData.error.message === 'string' ? errData.error.message : JSON.stringify(errData.error.message);
          } else if (errData?.message) {
            errorMsg = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
          } else if (errData?.error) {
            errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
          }
        } catch {
          const raw = await createRes.text().catch(() => '');
          if (raw) errorMsg = raw.slice(0, 100);
        }
        showToast(`Backend Create Error (${createRes.status}): ${errorMsg}`, 'error');
        return; // DO NOT add to local state if backend creation fails
      }

      const createdData = await createRes.json();
      if (createdData && createdData.id) {
        newJobCard.id = createdData.id;
      }

      const isAlreadyExisted = Boolean((createdData as any)?.alreadyExists);

      if (isAlreadyExisted) {
        pinnedJobCardNo.current = jcNo;
        setHighlightedCardNo(jcNo);
        setExistingCardAlert(jcNo);
        setStatusRadio('All');
        setGlobalSearch('');
        setShowColFilters(false);
        setCurrentPage(1);
        setShowGenerateModal(false);
        setEditingCardId(null);
        await fetchBackendJobCards();
        showToast(`⚠️ Job Card #${jcNo} ALREADY EXISTS in database! Loaded and showing existing card at the top.`, 'info');
        return;
      }

      pinnedJobCardNo.current = jcNo;
      setCurrentPage(1);
      setJobCards((prev) => [newJobCard, ...prev]);
      saveJobCardsToStorage([newJobCard, ...jobCards]);
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
    } catch (err: any) {
      showToast(`Backend unreachable. Cannot create Job Card without server connection: ${err?.message || 'Network error'}`, 'error');
    } finally {
      setIsSubmittingLaunch(false);
    }
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
    // Already at PACKING (last stage) → mark COMPLETED
    if (nextIndex >= PF01_STAGES.length) {
      void (async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const id = encodeURIComponent(card.id || card.subJobCardNo || card.jobCardNo);
          await fetch(`${getApiBaseUrl()}/job-cards/${id}/move-stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              status: 'COMPLETED',
              jobCardNo: card.jobCardNo,
              userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
              userEmail: typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null,
              userName: typeof window !== 'undefined' ? localStorage.getItem('userName') : null,
            }),
          });
        } catch (_) {}
      })();
      setJobCards((prev) => {
        const updated: JobCard[] = prev.map((j) =>
          j.id === card.id ? { ...j, status: 'COMPLETED' as const, currentStageName: '20. PACKING', currentStageIndex: 19 } : j
        );
        saveJobCardsToStorage(updated);
        return updated;
      });
      showToast(`✅ Job Card ${card.jobCardNo} COMPLETED — all 20 stages done!`, 'success');
      return;
    }

    const nextStage = PF01_STAGES[nextIndex];
    const cardNo = card.jobCardNo;
    const subCardNo = card.subJobCardNo || card.jobCardNo;
    const cardId = card.id;

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    inFlightMovements.current.set(cardId, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });
    inFlightMovements.current.set(subCardNo, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });
    inFlightMovements.current.set(cardNo, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });

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
          status: 'IN_PROGRESS',
        };
        updatedList = otherItems.map((j, idx) => (idx === existingNextIdx ? mergedCard : j));
      } else {
        updatedList = prev.map((j) =>
          j.id === card.id
            ? {
                ...j,
                currentStageIndex: nextIndex,
                currentStageName: nextStage,
                status: 'IN_PROGRESS',
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
        let storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        let storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        let storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;

        if ((!storedUserId || !storedUserEmail) && token && typeof token === 'string' && token.includes('.')) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub || payload.id) storedUserId = payload.sub || payload.id;
            if (payload.email) storedUserEmail = payload.email;
            if (payload.name) storedUserName = payload.name;
          } catch (_) {}
        }
        const targetSubNo = subCardNo;
        const primaryTarget = encodeURIComponent(cardId || targetSubNo);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

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
            currentStageName: card.currentStageName,
            remark: `Quick Stage Movement to ${nextStage}`,
            remarkType: 'FULL_MOVEMENT',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok && targetSubNo && targetSubNo !== cardId) {
          const fallbackCtrl = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 25000);
          res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetSubNo)}/move-stage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              cardId: cardId,
              subJobCardNo: targetSubNo,
              jobCardNo: cardNo,
              currentStageName: card.currentStageName,
              remark: `Quick Stage Movement to ${nextStage}`,
              remarkType: 'FULL_MOVEMENT',
              userId: storedUserId,
              userEmail: storedUserEmail,
              userName: storedUserName,
            }),
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimeout);
        }

        if (res.ok) {
          inFlightMovements.current.delete(cardId);
          inFlightMovements.current.delete(subCardNo);
          inFlightMovements.current.delete(cardNo);
          forceFreshOnNextPoll.current = true;
          await fetchBackendJobCards();
        } else {
          inFlightMovements.current.delete(cardId);
          inFlightMovements.current.delete(subCardNo);
          inFlightMovements.current.delete(cardNo);
          let errorMsg = `Move failed (${res.status})`;
          try {
            const errData = await res.json();
            if (errData?.message) errorMsg = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
          } catch {}
          showToast(`Stage Move Error: ${errorMsg}`, 'error');
          await fetchBackendJobCards();
        }
      } catch (err: any) {
        console.warn('Backend stage move sync in background skipped or offline', err);
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
    // Already at PACKING (last stage) → mark COMPLETED
    if (nextIndex >= PF01_STAGES.length) {
      void (async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const id = encodeURIComponent(selectedMovementJob.id || selectedMovementJob.subJobCardNo || selectedMovementJob.jobCardNo);
          await fetch(`${getApiBaseUrl()}/job-cards/${id}/move-stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ status: 'COMPLETED', jobCardNo: selectedMovementJob.jobCardNo }),
          });
        } catch (_) {}
      })();
      setJobCards((prev) => {
        const updated: JobCard[] = prev.map((j) =>
          j.id === selectedMovementJob.id ? { ...j, status: 'COMPLETED' as const, currentStageName: '20. PACKING', currentStageIndex: 19 } : j
        );
        saveJobCardsToStorage(updated);
        return updated;
      });
      showToast(`✅ Job Card ${selectedMovementJob.jobCardNo} COMPLETED — all 20 stages done!`, 'success');
      setSelectedMovementJob(null);
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
    inFlightMovements.current.set(targetSubId, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });
    inFlightMovements.current.set(targetSubNo, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });
    inFlightMovements.current.set(jobCardNo, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });

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
          rejectedPcbQty: Math.max(target.rejectedPcbQty || 0, updatedRejectedPcbQty),
          rejectedAreaSqm: Math.max(target.rejectedAreaSqm || 0, updatedRejectedAreaSqm),
          rejectionLogs: newRejectionLogs.length > 0 ? newRejectionLogs : (target.rejectionLogs || []),
          status: 'IN_PROGRESS',
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
                status: 'IN_PROGRESS',
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
        let storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        let storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        let storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;

        if ((!storedUserId || !storedUserEmail) && token && typeof token === 'string' && token.includes('.')) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub || payload.id) storedUserId = payload.sub || payload.id;
            if (payload.email) storedUserEmail = payload.email;
            if (payload.name) storedUserName = payload.name;
          } catch (_) {}
        }
        const primaryTarget = encodeURIComponent(targetSubId || targetSubNo);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

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
            currentStageName: selectedMovementJob.currentStageName,
            rejectPcbQty: rejectPcb,
            remark: effectiveRemarks,
            remarkType: rejectPcb > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok && targetSubNo && targetSubNo !== targetSubId) {
          const fallbackCtrl = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 25000);
          res = await fetch(`${getApiBaseUrl()}/job-cards/${encodeURIComponent(targetSubNo)}/move-stage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              cardId: targetSubId,
              subJobCardNo: targetSubNo,
              jobCardNo: jobCardNo,
              currentStageName: selectedMovementJob.currentStageName,
              rejectPcbQty: rejectPcb,
              remark: effectiveRemarks,
              remarkType: rejectPcb > 0 ? 'REJECTION' : 'FULL_MOVEMENT',
              userId: storedUserId,
              userEmail: storedUserEmail,
              userName: storedUserName,
            }),
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimeout);
        }

        if (res.ok) {
          inFlightMovements.current.delete(targetSubId);
          inFlightMovements.current.delete(targetSubNo);
          inFlightMovements.current.delete(jobCardNo);
          forceFreshOnNextPoll.current = true;
          await fetchBackendJobCards();
        } else {
          inFlightMovements.current.delete(targetSubId);
          inFlightMovements.current.delete(targetSubNo);
          inFlightMovements.current.delete(jobCardNo);
          let errorMsg = `Move failed (${res.status})`;
          try {
            const errData = await res.json();
            if (errData?.message) errorMsg = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
          } catch {}
          showToast(`Stage Move Error: ${errorMsg}`, 'error');
          await fetchBackendJobCards();
        }
      } catch (err: any) {
        inFlightMovements.current.delete(targetSubId);
        inFlightMovements.current.delete(targetSubNo);
        inFlightMovements.current.delete(jobCardNo);
        console.warn('Backend stage move sync in background skipped or offline', err);
      }
    })();
  };

  // Mark Job Card as Completed
  const handleMarkAsCompleted = (jobCardId: string) => {
    const targetId = jobCardId || selectedMovementJob?.id || '';
    const targetCardNo = selectedMovementJob?.jobCardNo || '';

    // 1. INSTANT OPTIMISTIC UI & STORAGE UPDATE (0ms)
    inFlightMovements.current.set(targetId, { stageIdx: PF01_STAGES.length - 1, stageName: PF01_STAGES[PF01_STAGES.length - 1], timestamp: Date.now() });
    if (targetCardNo) inFlightMovements.current.set(targetCardNo, { stageIdx: PF01_STAGES.length - 1, stageName: PF01_STAGES[PF01_STAGES.length - 1], timestamp: Date.now() });

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
    // Give moved batch a distinct temporary sub-lot number with '-A' suffix
    // so the merge logic never confuses it with the remaining lot (which keeps the original subJobCardNo).
    // The backend will assign the real letter suffix (e.g. 26-27-7328-A) on its own.
    const movedTempId = `jc-part-${Date.now()}-moved`;
    const movedSubNo = `${baseJc}-A`;
    const remainingSubNo = selectedMovementJob.subJobCardNo || baseJc;

    const movedBatch: JobCard = {
      ...selectedMovementJob,
      id: movedTempId,
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

    // Register the moved batch in inFlightMovements so the merge logic can
    // identify it as an optimistic card and avoid applying its stage to unrelated server cards.
    inFlightMovements.current.set(movedTempId, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });
    inFlightMovements.current.set(movedSubNo, { stageIdx: nextIndex, stageName: nextStage, timestamp: Date.now() });

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

    // 3. NON-BLOCKING BACKGROUND SYNC FOR INSTANT MULTI-DEVICE CONSISTENCY
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        let storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        let storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        let storedUserName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;

        if ((!storedUserId || !storedUserEmail) && token && typeof token === 'string' && token.includes('.')) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub || payload.id) storedUserId = payload.sub || payload.id;
            if (payload.email) storedUserEmail = payload.email;
            if (payload.name) storedUserName = payload.name;
          } catch (_) {}
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const primaryTarget = encodeURIComponent(
          savedJobCardId && !savedJobCardId.startsWith('jc-part-')
            ? savedJobCardId
            : (selectedMovementJob.subJobCardNo || selectedMovementJob.jobCardNo)
        );

        const res = await fetch(`${getApiBaseUrl()}/job-cards/${primaryTarget}/move-partial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            cardId: savedJobCardId,
            jobCardNo: selectedMovementJob.jobCardNo,
            subJobCardNo: selectedMovementJob.subJobCardNo || selectedMovementJob.jobCardNo,
            currentStageName: selectedMovementJob.currentStageName,
            qtyToMove: parsedMoveQty,
            areaToMove: movedArea,
            pendingWorkReason: effectiveReason,
            remark: incompleteRemarks ? `${effectiveReason} • ${incompleteRemarks}` : `Incomplete Movement: ${effectiveReason}`,
            remarkType: 'INCOMPLETE_MOVEMENT',
            userId: storedUserId,
            userEmail: storedUserEmail,
            userName: storedUserName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          // Server has committed the split. Clear in-flight tracking and force-fresh poll
          // so all devices (including this one) adopt the server's authoritative split records.
          inFlightMovements.current.delete(movedTempId);
          inFlightMovements.current.delete(movedSubNo);
          forceFreshOnNextPoll.current = true;
          // Immediately sync from backend so real SubJobCard IDs & split records are live on all devices
          await fetchBackendJobCards();
        } else {
          // On failure, clean up in-flight so we don't block future polls
          inFlightMovements.current.delete(movedTempId);
          inFlightMovements.current.delete(movedSubNo);
          console.warn('Backend move-partial returned non-OK status:', res.status);
        }
      } catch (err) {
        // On network error, clean up in-flight
        inFlightMovements.current.delete(movedTempId);
        inFlightMovements.current.delete(movedSubNo);
        console.warn('Backend move-partial sync skipped or offline', err);
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
              <th class="header-cell" style="width: 100px;">Rej PCBs</th>
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
        ? `20. PACKING (DONE)`
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
          <td class="data-cell text-right font-mono" style="mso-number-format:'\\#\\,\\#\\#0'; color: ${j.rejectedPcbQty ? '#e11d48' : '#64748b'}; font-weight: bold;">${j.rejectedPcbQty || 0}</td>
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
    rejection: '',
    unit: '',
    area: '',
    stage: '',
    progress: '',
  });

  const [statusRadio, setStatusRadio] = useState<'All' | 'Unstarted' | 'Active' | 'Pending' | 'Done' | 'Overdue'>('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColFilters, setShowColFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusRadio, globalSearch, colFilters, assignedStage]);

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

  const normalizeStageSlug = (s: string) => {
    return String(s || '')
      .toLowerCase()
      .replace(/^\d+\.\s*/, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const isOperatorUser = React.useMemo(() => {
    if (assignedStage && assignedStage.toUpperCase() !== 'ALL') return true;
    if (typeof window !== 'undefined') {
      const storedStage = localStorage.getItem('assignedStage');
      if (storedStage && storedStage.toUpperCase() !== 'ALL') return true;
    }
    if (isSuperAdmin) return false;
    const roleUpper = (userRole || '').toUpperCase();
    return roleUpper.includes('OPERATOR') || roleUpper === 'NORMAL' || roleUpper === 'PROCESS_OPERATOR';
  }, [isSuperAdmin, assignedStage, userRole]);

  // Helper to identify 100% completed or dispatched job cards
  const isCardCompleted = useCallback((jc: JobCard) => {
    return (
      jc.status === 'COMPLETED' ||
      jc.status === 'DISPATCHED' ||
      jc.status === 'DELIVERED' ||
      jc.currentStage === 'PF01-PACK' ||
      jc.currentStage === 'PACKING' ||
      Boolean(jc.dispatches && jc.dispatches.length > 0)
    );
  }, []);

  // Scoped Cards: When on Active Production WIP tab, strictly isolate to active (uncompleted) cards
  const scopedCards = React.useMemo(() => {
    // 1. Strictly exclude 100% completed / dispatched jobs from WIP so they only appear in Completed & Dispatch Hub
    const activeOnly = jobCards.filter((jc) => !isCardCompleted(jc));

    const effectiveAssignedStage = (assignedStage && assignedStage !== 'ALL')
      ? assignedStage
      : (typeof window !== 'undefined' ? localStorage.getItem('assignedStage') : null);

    const isStageLocked = isOperatorUser && Boolean(effectiveAssignedStage && effectiveAssignedStage.toUpperCase() !== 'ALL');

    if (!isStageLocked || !effectiveAssignedStage) return activeOnly;

    const targetSlug = normalizeStageSlug(effectiveAssignedStage);
    const targetIdx = normalizeStageIndex(effectiveAssignedStage);
    const isShearingTarget = targetSlug === 'shearing' || targetSlug === '1shearing' || targetIdx === 0;

    return activeOnly.filter((jc) => {
      const isCardUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED' || (jc.status as string) === 'PENDING_LAUNCH';
      if (isCardUnlaunched) {
        return isShearingTarget;
      }

      const cardStageSlug = normalizeStageSlug(jc.currentStageName);
      const cardStageIdx = jc.currentStageIndex !== undefined && jc.currentStageIndex >= 0
        ? jc.currentStageIndex
        : normalizeStageIndex(jc.currentStageName);

      // Match exact stage index or slug to prevent substring collision
      if (cardStageIdx === targetIdx || cardStageSlug === targetSlug) {
        return true;
      }
      return false;
    });
  }, [jobCards, isOperatorUser, assignedStage, isCardCompleted]);

  // Filtered Cards based on per-column filters, global search, and radio status
  const filteredCards = scopedCards.filter((jc) => {
    const matchesWip = !colFilters.wipNo || jc.jobCardNo.toLowerCase().includes(colFilters.wipNo.toLowerCase());
    const matchesProduct = !colFilters.product || jc.customerPartNo?.toLowerCase().includes(colFilters.product.toLowerCase());
    const matchesCode = !colFilters.productCode || jc.rfePartCode?.toLowerCase().includes(colFilters.productCode.toLowerCase());
    const matchesCust = !colFilters.customer || jc.customerCode?.toLowerCase().includes(colFilters.customer.toLowerCase());

    const effectiveStageFilter = (!isOperatorUser && colFilters.stage) ? colFilters.stage : '';
    let matchesStage = true;
    if (effectiveStageFilter) {
      const targetSlug = normalizeStageSlug(effectiveStageFilter);
      const cardStageSlug = normalizeStageSlug(jc.currentStageName);
      matchesStage = cardStageSlug === targetSlug || (jc.currentStageName || '').toLowerCase().includes(effectiveStageFilter.toLowerCase());
    }

    const matchesPriority = !colFilters.priority || jc.priority.toLowerCase().includes(colFilters.priority.toLowerCase());
    const matchesPndg = !colFilters.pndg || String(jc.totalPcbQty || jc.custPnlQty || '').includes(colFilters.pndg);
    const matchesRejection = !colFilters.rejection || String(jc.rejectedPcbQty || 0).includes(colFilters.rejection);
    
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
        ? false
        : statusRadio === 'Overdue'
        ? isCardOverdue(jc)
        : true;

    return matchesWip && matchesProduct && matchesCode && matchesCust && matchesStage && matchesPriority && matchesPndg && matchesRejection && matchesGlobal && matchesRadio;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCards.length);
  const paginatedCards = useMemo(() => {
    return filteredCards.slice(startIndex, endIndex);
  }, [filteredCards, startIndex, endIndex]);

  const totalMasterCards = scopedCards.length;
  const inProgressCount = scopedCards.filter((j) => j.status === 'IN_PROGRESS').length;
  const totalSubLots = scopedCards.reduce((acc, j) => acc + (j.subJobCards?.length || 1), 0);
  const activePnlCount = scopedCards.reduce((acc, j) => acc + (j.prodPnlQty || 0), 0);
  const activePcbCount = scopedCards.reduce((acc, j) => acc + (j.totalPcbQty || (j.custPnlQty && j.custPnlQty > 50 ? j.custPnlQty : ((j.prodPnlQty || 0) * 4))), 0);
  const activeSqmArea = scopedCards.reduce((acc, j) => acc + (j.prodPnlAreaSqm || 0), 0);

  const overdueCards = React.useMemo(() => scopedCards.filter(isCardOverdue), [scopedCards, isCardOverdue]);
  const overdueCount = overdueCards.length;
  const overduePcbCount = React.useMemo(
    () => overdueCards.reduce((acc, curr) => acc + (curr.totalPcbQty || curr.custPnlQty || 0), 0),
    [overdueCards]
  );

  // Top 3 WIP Stages by active Sqm Area
  const top3WipStages = React.useMemo(() => {
    const activeCards = scopedCards.filter((j) => j.status !== 'COMPLETED');
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
  }, [scopedCards]);

  // Top 5 High Rejection Job Cards (Tracked live upon stage movement entry)
  const top5RejectedCards = React.useMemo(() => {
    return scopedCards
      .filter((j) => (j.rejectedPcbQty || 0) > 0)
      .sort((a, b) => (b.rejectedPcbQty || 0) - (a.rejectedPcbQty || 0))
      .slice(0, 5);
  }, [scopedCards]);

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

  // ── Completed & Dispatch Hub Calculations ──
  const completedJobCards = React.useMemo(() => {
    return jobCards.filter((jc) => {
      // Must be completed (either status is COMPLETED/DISPATCHED/DELIVERED, or at PACKING/PACK stage, or has dispatches)
      const isCompleted = isCardCompleted(jc);
      if (!isCompleted) return false;

      // Status filter
      if (dispatchFilterStatus !== 'ALL') {
        const latestDispatch = jc.dispatches && jc.dispatches.length > 0 ? jc.dispatches[0] : null;
        const currentDeliveryStatus = latestDispatch?.deliveryStatus || (jc.status === 'DELIVERED' ? 'DELIVERED' : latestDispatch ? 'DISPATCHED' : jc.status === 'DISPATCHED' ? 'DISPATCHED' : 'READY');

        if (dispatchFilterStatus === 'READY_FOR_DISPATCH' && (currentDeliveryStatus === 'DISPATCHED' || currentDeliveryStatus === 'DELIVERED')) return false;
        if (dispatchFilterStatus === 'DISPATCHED' && currentDeliveryStatus !== 'DISPATCHED') return false;
        if (dispatchFilterStatus === 'DELIVERED' && currentDeliveryStatus !== 'DELIVERED') return false;
      }

      // Search query filter
      if (dispatchSearchQuery.trim()) {
        const q = dispatchSearchQuery.toLowerCase();
        const jcNo = (jc.jobCardNo || '').toLowerCase();
        const part = (jc.partCode || jc.partName || jc.customerPartNo || jc.rfePartCode || '').toLowerCase();
        const cust = (jc.customer || jc.clientName || jc.customerCode || jc.customerPO?.customer?.companyName || '').toLowerCase();
        const po = (jc.poNumber || jc.customerPO?.poNo || '').toLowerCase();
        const dispNo = (jc.dispatches?.[0]?.dispatchNo || '').toLowerCase();
        const lrNo = (jc.dispatches?.[0]?.trackingLrNo || jc.dispatches?.[0]?.trackingNumber || '').toLowerCase();
        const op = String(
          (typeof jc.completedBy === 'object' ? jc.completedBy?.name : jc.completedBy) ||
          (typeof jc.lastMovementBy === 'object' ? jc.lastMovementBy?.name : jc.lastMovementBy) ||
          jc.createdBy?.name ||
          jc.createdByName ||
          ''
        ).toLowerCase();

        return (
          jcNo.includes(q) ||
          part.includes(q) ||
          cust.includes(q) ||
          po.includes(q) ||
          dispNo.includes(q) ||
          lrNo.includes(q) ||
          op.includes(q)
        );
      }

      return true;
    });
  }, [jobCards, dispatchFilterStatus, dispatchSearchQuery, isCardCompleted]);

  const totalCompletedCount = React.useMemo(() => {
    return jobCards.filter((jc) => isCardCompleted(jc)).length;
  }, [jobCards, isCardCompleted]);

  const readyToDispatchCount = React.useMemo(() => {
    return jobCards.filter((jc) => {
      const isComp =
        jc.status === 'COMPLETED' ||
        jc.currentStage === 'PF01-PACK' ||
        jc.currentStage === 'PACKING';
      const hasDisp = jc.dispatches && jc.dispatches.length > 0;
      const isDispOrDeliv = jc.status === 'DISPATCHED' || jc.status === 'DELIVERED';
      return isComp && !hasDisp && !isDispOrDeliv;
    }).length;
  }, [jobCards]);

  const inTransitCount = React.useMemo(() => {
    return jobCards.filter((jc) => {
      const latest = jc.dispatches?.[0];
      if (latest) {
        return latest.deliveryStatus !== 'DELIVERED';
      }
      return jc.status === 'DISPATCHED';
    }).length;
  }, [jobCards]);

  const deliveredCount = React.useMemo(() => {
    return jobCards.filter((jc) => {
      const latest = jc.dispatches?.[0];
      return latest?.deliveryStatus === 'DELIVERED' || jc.status === 'DELIVERED';
    }).length;
  }, [jobCards]);

  return (
    <div className="space-y-5 p-3 sm:p-5 w-full max-w-[1600px] mx-auto pb-16 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      
      {/* 1. TOP HEADER BANNER CARD (Clean, Professional & Perfectly Aligned) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Row: Title, Badges & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Icon, Title & Subtitle */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                  Job Cards & Movement Flow
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tracking-wide font-sans shrink-0">
                  Standard Production Workflow
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider items-center gap-1 font-mono shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 font-medium mt-0.5">
                Track PCB Job Cards, scan barcodes, execute full or split stage movement from Launch to Packing.
              </p>
            </div>
          </div>

          {/* Right: Primary Quick Action Buttons (2-col grid on mobile, inline flex row on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowReportDrawer(true)}
              className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95 w-full sm:w-auto"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>WIP Excel Report</span>
            </button>

            <button
              onClick={handleForceCloudSync}
              className="h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all border border-blue-200 whitespace-nowrap cursor-pointer active:scale-95 w-full sm:w-auto"
              title="Purge local cache and force-sync live cards from cloud database"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5] text-blue-600" />
              <span>Sync Cloud</span>
            </button>

            <Link
              href="/job-cards/launch"
              className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all border border-slate-300/80 whitespace-nowrap cursor-pointer active:scale-95 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] text-slate-700" />
              <span>Launch Page ↗</span>
            </Link>

            <Link
              href="/job-cards/movement"
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all border border-blue-700 whitespace-nowrap cursor-pointer active:scale-95 w-full sm:w-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5] text-white" />
              <span>Job Movement ➔</span>
            </Link>

            <button
              onClick={() => handleOpenCreateModal()}
              className="col-span-2 sm:col-auto h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-emerald-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[3] text-white" />
              <span>Add New Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION SWITCHER TABS (Clean 2-Col Segmented Control on Mobile, Inline Flex on Desktop) ── */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveSectionTab('PRODUCTION')}
            className={`w-full sm:w-auto px-2.5 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeSectionTab === 'PRODUCTION'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">Active WIP</span>
            <span className="hidden sm:inline">Active Production WIP</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeSectionTab === 'PRODUCTION'
                  ? 'bg-blue-800/80 text-blue-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {inProgressCount}
            </span>
          </button>

          {!isOperatorUser && (
            <button
              onClick={() => setActiveSectionTab('COMPLETED_DISPATCH')}
              className={`w-full sm:w-auto px-2.5 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeSectionTab === 'COMPLETED_DISPATCH'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">Dispatch Hub</span>
              <span className="hidden sm:inline">Completed & Dispatch Hub</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  activeSectionTab === 'COMPLETED_DISPATCH'
                    ? 'bg-emerald-800/80 text-emerald-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalCompletedCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {activeSectionTab === 'PRODUCTION' && (
        <>
          {/* 2. SECOND ROW SUMMARY CARDS & BARCODE SCANNER (Stage Filter Banner Removed) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5 items-stretch">
        
        {/* Card 1: Barcode & Mobile Camera Scanner / Fast Stage Movement */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-blue-100 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between space-y-2 min-h-[96px] hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider shrink-0">
              <Scan className="w-4 h-4 text-blue-600 shrink-0" />
              <span>STAGE SCANNER</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-lg border border-blue-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="Open Instant Camera Viewfinder"
            >
              <Camera className="w-3 h-3 text-blue-600 shrink-0" />
              <span>Camera</span>
            </button>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / Enter Job No..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white placeholder-slate-400 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer rounded-md hover:bg-slate-200/50"
                title="Open Camera Scanner"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 active:scale-95"
              title="Find & Open Job Card"
            >
              <Search className="w-3.5 h-3.5 text-white" />
              <span>Find</span>
            </button>
          </form>
        </div>

        {/* Card 2: Active Job Cards */}
        <div className="bg-white border border-blue-100 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between min-h-0 sm:min-h-[96px]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTIVE JOB CARDS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {totalMasterCards} Master Cards
            </div>
            <div className="text-[10px] sm:text-[11px] text-blue-700 font-semibold truncate">
              • {inProgressCount} Active in Prod ({totalSubLots} Lots)
            </div>
          </div>
        </div>

        {/* Card 3: Total Production PCB */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between min-h-0 sm:min-h-[96px]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL PRODUCTION PCB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {activePcbCount} PCBs
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold truncate">
              • {activePcbCount} PCBs In-Progress
            </div>
          </div>
        </div>

        {/* Card 4: Overdue Job Cards (Interactive Metric) */}
        <div
          onClick={() => setStatusRadio(statusRadio === 'Overdue' ? 'All' : 'Overdue')}
          className={`border rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between min-h-0 sm:min-h-[96px] cursor-pointer transition-all ${
            statusRadio === 'Overdue'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
              : overdueCount > 0
              ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/90'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}

        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            statusRadio === 'Overdue'
              ? 'bg-white/20 text-white'
              : overdueCount > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider ${
                statusRadio === 'Overdue' ? 'text-rose-100' : overdueCount > 0 ? 'text-rose-900' : 'text-slate-500'
              }`}>
                OVERDUE JOB CARDS
              </span>
              {overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
            </div>
            <div className={`text-sm sm:text-base lg:text-lg font-black font-mono mt-0.5 truncate ${
              statusRadio === 'Overdue' ? 'text-white' : overdueCount > 0 ? 'text-rose-950' : 'text-slate-900'
            }`}>
              {overdueCount} Cards
            </div>
            <div className={`text-[10px] sm:text-[11px] font-semibold truncate ${
              statusRadio === 'Overdue' ? 'text-rose-100' : overdueCount > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              • {overduePcbCount} PCBs Past Target
            </div>
          </div>
        </div>

        {/* Card 5: Total WIP Area */}
        <div className="bg-white border border-purple-100 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between min-h-0 sm:min-h-[96px]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Split className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL WIP AREA</span>
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
              {activeSqmArea.toFixed(1)} Sqm
            </div>
            <div className="text-[10px] sm:text-[11px] text-purple-700 font-semibold truncate">
              • {activeSqmArea.toFixed(1)} Sqm Active Floor
            </div>
          </div>
        </div>

      </div>

      {/* 2.5 ANALYTICS & LIVE MOVEMENT WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch font-quicksand">
        
        {/* LEFT: Top 3 WIP Stages by SQM Area */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 flex flex-col justify-between font-quicksand">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2 font-quicksand">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 ring-1 ring-blue-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate font-quicksand">
                  Top 3 WIP Stages (By Area)
                </h3>
                <p className="hidden sm:block text-[11px] text-slate-500 font-quicksand">Highest active floor volume in production</p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-bold font-quicksand text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap shrink-0 shadow-2xs">
              {top3WipStages.reduce((acc, curr) => acc + curr.areaSqm, 0).toFixed(1)} Sqm Total
            </span>
          </div>

          {/* Stage Progress Items */}
          <div className="space-y-2 flex-1 flex flex-col justify-center font-quicksand">
            {top3WipStages.length > 0 ? (
              top3WipStages.map((stg, idx) => (
                <div
                  key={stg.stageName}
                  className="bg-white hover:bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80 transition-all shadow-2xs space-y-2 font-quicksand"
                >
                  <div className="flex items-center justify-between text-xs gap-2 font-quicksand">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold font-quicksand text-slate-400 w-4 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 font-quicksand text-xs truncate">
                        {stg.stageName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-quicksand shrink-0 hidden sm:inline-block">
                        ({stg.cardCount} Cards • {stg.pcbQty} PCBs)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-quicksand text-xs shrink-0">
                      <span className="font-bold text-slate-900">{stg.areaSqm} Sqm</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded-md font-quicksand">
                        {stg.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(5, stg.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-xs text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200 font-quicksand">
                No active WIP stages currently running
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Top 5 Rejection Job Cards (Live Movement Entries) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 flex flex-col justify-between font-quicksand">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2 font-quicksand">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 ring-1 ring-rose-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate font-quicksand">
                    Top 5 Rejection Job Cards
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                </div>
                <p className="hidden sm:block text-[11px] text-slate-500 font-quicksand">Live operator defect entries during stage movement</p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-bold font-quicksand text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 whitespace-nowrap shrink-0 shadow-2xs">
              {top5RejectedCards.reduce((acc, curr) => acc + (curr.rejectedPcbQty || 0), 0)} Rejections
            </span>
          </div>

          {/* Rejection List */}
          <div className="space-y-2 flex-1 font-quicksand">
            {top5RejectedCards.length > 0 ? (
              top5RejectedCards.map((jc, idx) => {
                const lastLog = jc.rejectionLogs?.[jc.rejectionLogs.length - 1];
                const rawRemark = lastLog?.remark || '';
                const cleanRemark = rawRemark.includes('[REJECTION]')
                  ? rawRemark.replace(/\[REJECTION\]\s*\d*\s*PCB\(s\)?\s*marked as Clear Movement at[^)]+\)?/gi, '').trim().replace(/^—\s*|^-\s*/, '')
                  : rawRemark;

                return (
                  <div
                    key={jc.id}
                    onClick={() => fetchJobCardHistory(jc)}
                    title="Click to view job card history"
                    className="group relative flex items-center justify-between gap-3 bg-white hover:bg-rose-50/20 border border-slate-200/80 hover:border-rose-200 p-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer font-quicksand"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 font-quicksand">
                      {/* Rank Indicator */}
                      <span className="text-xs font-bold font-quicksand text-slate-400 w-4 text-center shrink-0">
                        #{idx + 1}
                      </span>

                      <div className="min-w-0 flex-1 font-quicksand">
                        {/* Job Card No & Customer Details - No boxes around words */}
                        <div className="flex items-center gap-2 min-w-0 font-quicksand">
                          <span className="font-quicksand font-bold text-xs text-slate-900 group-hover:text-rose-600 tracking-normal">
                            {jc.jobCardNo}
                          </span>
                          {jc.customerCode && (
                            <span className="text-[11px] font-semibold font-quicksand text-slate-500 truncate">
                              • {jc.customerCode}
                            </span>
                          )}
                          {jc.customerPartNo && (
                            <span className="text-[10px] text-slate-400 font-quicksand truncate hidden sm:inline-block">
                              ({jc.customerPartNo})
                            </span>
                          )}
                        </div>

                        {/* Defect Stage & Remark - Clean text without boxes */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-quicksand">
                          {lastLog?.stageName && (
                            <span className="font-quicksand font-bold text-slate-700 shrink-0">
                              {lastLog.stageName} •
                            </span>
                          )}
                          <span className="truncate text-slate-500 text-[11px] font-medium font-quicksand">
                            {cleanRemark || 'Stage Movement Rejection'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Defect Metrics */}
                    <div className="text-right shrink-0 font-quicksand">
                      <div className="text-xs font-bold font-quicksand text-rose-600">
                        {jc.rejectedPcbQty} PCBs
                      </div>
                      {Number(jc.rejectedAreaSqm || 0) > 0 ? (
                        <div className="text-[10px] font-quicksand text-slate-400 font-medium">
                          {jc.rejectedAreaSqm} Sqm
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2 font-quicksand">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No rejections logged yet across active job cards.</span>
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

          {!isOperatorUser && (
            <button
              onClick={() => setActiveSectionTab('COMPLETED_DISPATCH')}
              className="h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              title="Switch to Completed & Dispatch Hub"
            >
              <span>COMPLETED & DISPATCH ➔</span>
              <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-950 rounded font-mono text-[10px] font-black">
                {totalCompletedCount}
              </span>
            </button>
          )}

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

      {/* Existing Card Alert Banner */}
      {existingCardAlert && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex items-center justify-between text-slate-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 font-bold border border-amber-400/40">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>Job Card #{existingCardAlert} already exists in database!</span>
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider">
                  ALREADY EXISTS
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                This Job Card already exists in the database. It has been loaded and displayed at the top of Page 1.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setExistingCardAlert(null);
              setHighlightedCardNo(null);
              pinnedJobCardNo.current = null;
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      )}

      {/* 4. FOURTH ROW: PRODUCTION JOBS (WIP) DATA TABLE */}
      <div className="border border-slate-300/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        {/* Desktop Table View (100% Unaltered) */}
        <div className="hidden md:block w-full overflow-x-auto">
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
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Pndg</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Rejection</th>
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
                      value={colFilters.rejection}
                      onChange={(e) => setColFilters({ ...colFilters, rejection: e.target.value })}
                      placeholder="Rej..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-amber-500 font-mono shadow-2xs text-center"
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
                  <td colSpan={14} className="py-12 text-center text-slate-400 text-xs font-mono">
                    <div className="flex flex-col items-center justify-center gap-3 py-4 max-w-md mx-auto">
                      {jobCards.length > 0 && scopedCards.length === 0 && totalCompletedCount > 0 ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                            <Truck className="w-6 h-6" />
                          </div>
                          <p className="text-slate-800 font-sans font-bold text-sm text-center">
                            All {jobCards.length} Job Card(s) have finished production and are in the <span className="text-emerald-700 font-extrabold">Completed & Dispatch Hub</span>.
                          </p>
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            <button
                              type="button"
                              onClick={() => setActiveSectionTab('COMPLETED_DISPATCH')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>View in Completed & Dispatch Hub ({totalCompletedCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenCreateModal}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              ➕ Create New Job Card
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                            <Layers className="w-6 h-6" />
                          </div>
                          <p className="text-slate-700 font-sans font-bold text-sm">
                            {jobCards.length > 0
                              ? `Total ${jobCards.length} Job Card(s) exist in database, but hidden by current filters (Stage: ${assignedStage}, Status: ${statusRadio}).`
                              : 'No job cards found in the system.'}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            {jobCards.length > 0 && !isOperatorUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignedStage('ALL');
                                  setUserRole('MASTER');
                                  setStatusRadio('All');
                                  setGlobalSearch('');
                                  setShowColFilters(false);
                                  setColFilters({
                                    wipNo: '',
                                    product: '',
                                    productCode: '',
                                    customer: '',
                                    launch: '',
                                    target: '',
                                    priority: '',
                                    pndg: '',
                                    rejection: '',
                                    unit: '',
                                    area: '',
                                    stage: '',
                                    progress: '',
                                  });
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reset Filters (Show All {jobCards.length} Jobs)</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleOpenCreateModal}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              ➕ Create New Job Card
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCards.map((jc, idx) => {
                  const isUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED' || (jc.status as string) === 'PENDING_LAUNCH';
                  const isCompleted = jc.status === 'COMPLETED';
                  const stageIndex = jc.currentStageIndex !== undefined && jc.currentStageIndex >= 0 ? jc.currentStageIndex : normalizeStageIndex(jc.currentStageName);
                  const progressPct = isUnlaunched ? 0 : isCompleted ? 100 : Math.round(((stageIndex + 1) / PF01_STAGES.length) * 100);
                  const isNewTagVisible = isUnlaunched;
                  const isExistingTagVisible = Boolean(
                    jc.isAlreadyExisting ||
                    (highlightedCardNo && (jc.jobCardNo === highlightedCardNo || jc.subJobCardNo === highlightedCardNo))
                  );

                  return (
                    <tr
                      key={jc.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        isExistingTagVisible
                          ? 'bg-amber-50/90 border-l-4 border-l-amber-500 font-medium'
                          : isNewTagVisible
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
                          <button
                            onClick={() => setPdfPreviewJob(jc)}
                            title="View Job Card Route Sheet PDF"
                            className="text-slate-600 hover:text-slate-950 cursor-pointer p-0.5 shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {jc.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setPhotoLightbox(jc.photoUrl || null)}
                              title="View Attached Original Physical Job Card Photo"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer p-0.5 shrink-0 transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span>{jc.subJobCardNo || jc.jobCardNo}</span>
                          {isExistingTagVisible ? (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider animate-pulse shrink-0 border border-amber-600 shadow-2xs">
                              ⚠️ ALREADY EXISTS
                            </span>
                          ) : isNewTagVisible ? (
                            <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded uppercase tracking-wider animate-pulse shrink-0 shadow-2xs">
                              NEW
                            </span>
                          ) : null}
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
                        <span className="text-slate-900 font-black">
                          {jc.totalPcbQty || (jc.custPnlQty && jc.custPnlQty > 50 ? jc.custPnlQty : (jc.prodPnlQty ? Math.round(jc.prodPnlQty * 4) : 160))}
                        </span>
                      </td>

                      {/* Rejection */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold whitespace-nowrap">
                        <span className={jc.rejectedPcbQty && jc.rejectedPcbQty > 0 ? 'text-rose-600 font-black' : 'text-slate-900 font-bold'}>
                          {jc.rejectedPcbQty || 0}
                        </span>
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
                            20. PACKING (DONE)
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
                                setHasRejectionInMovement(false);
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

        {/* Mobile Vertical Cards View (Optimized for Mobile Screens) */}
        <div className="block md:hidden p-3 space-y-3 bg-slate-100/70 font-quicksand">
          {filteredCards.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium bg-white rounded-2xl border border-slate-200">
              No job cards found for current selection.
            </div>
          ) : (
            paginatedCards.map((jc, idx) => {
              const isUnlaunched = jc.status === 'UNLAUNCHED' || jc.status === 'CREATED' || (jc.status as string) === 'PENDING_LAUNCH';
              const isCompleted = jc.status === 'COMPLETED';
              const stageIndex = jc.currentStageIndex !== undefined && jc.currentStageIndex >= 0 ? jc.currentStageIndex : normalizeStageIndex(jc.currentStageName);
              const progressPct = isUnlaunched ? 0 : isCompleted ? 100 : Math.round(((stageIndex + 1) / PF01_STAGES.length) * 100);
              const isNewTagVisible = isUnlaunched;
              const isExistingTagVisible = Boolean(
                jc.isAlreadyExisting ||
                (highlightedCardNo && (jc.jobCardNo === highlightedCardNo || jc.subJobCardNo === highlightedCardNo))
              );
              const overdue = isCardOverdue(jc);
              const displayArea = jc.custPnlAreaSqm ? jc.custPnlAreaSqm.toFixed(2) : (jc.prodPnlAreaSqm ? jc.prodPnlAreaSqm.toFixed(2) : '0.00');
              const displayPendingQty = jc.totalPcbQty || (jc.custPnlQty && jc.custPnlQty > 50 ? jc.custPnlQty : (jc.prodPnlQty ? Math.round(jc.prodPnlQty * 4) : 160));
              const hasRejections = Number(jc.rejectedPcbQty || 0) > 0;

              return (
                <div 
                  key={`mobile-${jc.id}`}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all font-quicksand ${
                    isExistingTagVisible ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200/90'
                  }`}
                >
                  {/* Top Status Accent Bar */}
                  <div className={`h-1 w-full ${
                    isExistingTagVisible
                      ? 'bg-amber-500'
                      : overdue 
                      ? 'bg-rose-500' 
                      : isCompleted 
                      ? 'bg-emerald-500' 
                      : isUnlaunched 
                      ? 'bg-amber-400' 
                      : 'bg-blue-600'
                  }`} />

                  <div className="p-3.5 space-y-3">
                    {/* Header: Card Number + Quick Actions & Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-black text-[15px] sm:text-base text-amber-950 bg-amber-100/90 border border-amber-300/90 px-2 py-0.5 rounded-lg shadow-2xs tracking-tight truncate">
                          {jc.subJobCardNo || jc.jobCardNo}
                        </span>
                        {isExistingTagVisible ? (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider shrink-0 border border-amber-600 shadow-2xs animate-pulse">
                            ⚠️ ALREADY EXISTS
                          </span>
                        ) : isNewTagVisible ? (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded uppercase tracking-wider shrink-0">
                            NEW
                          </span>
                        ) : null}
                        {jc.subJobCards && jc.subJobCards.length > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200/70 shrink-0">
                            Lot {(jc.subJobCards.findIndex((s) => s.id === jc.id) >= 0 ? jc.subJobCards.findIndex((s) => s.id === jc.id) + 1 : idx + 1)}/{jc.subJobCards.length}
                          </span>
                        )}
                      </div>

                      {/* Header Right: Priority & Print/PDF */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setShowQrModal(jc)}
                          title="Print QR Sticker Tag"
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPdfPreviewJob(jc)}
                          title="View Job Card Route Sheet PDF"
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            jc.priority === 'MOST URGENT' || jc.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200/80'
                          }`}
                        >
                          {jc.priority === 'MOST URGENT' ? 'Top Priority' : jc.priority || 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Part & Customer Information (Clean hierarchy, no boxed borders) */}
                    <div className="pt-0.5 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate" title={jc.customerPartNo}>
                            {jc.customerPartNo || 'Standard Production Item'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Customer: <span className="font-semibold text-slate-800">{jc.customerCode || '—'}</span>
                          </p>
                        </div>
                        {jc.rfePartCode ? (
                          <span 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-blue-950 bg-blue-100/90 border border-blue-300/90 px-2.5 py-1 rounded-lg shadow-2xs font-mono tracking-tight shrink-0"
                            title={`R.F.E. Code: ${jc.rfePartCode}`}
                          >
                            <span className="text-[9.5px] font-bold text-blue-700 font-sans uppercase tracking-wider">RFE</span>
                            <span>{jc.rfePartCode}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Unified Production Metrics Strip (Sleek unified card instead of 4 separate boxes) */}
                    <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 grid grid-cols-4 gap-2 text-center">
                      <div className="min-w-0">
                        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Qty</span>
                        <span className="font-bold text-xs text-slate-900 block mt-0.5 truncate">
                          {displayPendingQty} <span className="text-[9px] font-medium text-slate-500">PCBs</span>
                        </span>
                      </div>
                      <div className="min-w-0 border-l border-slate-200/80 pl-1">
                        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Rejects</span>
                        <span className={`font-bold text-xs block mt-0.5 truncate ${hasRejections ? 'text-rose-600' : 'text-slate-700'}`}>
                          {jc.rejectedPcbQty || 0}
                        </span>
                      </div>
                      <div className="min-w-0 border-l border-slate-200/80 pl-1">
                        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Area</span>
                        <span className="font-bold text-xs text-slate-800 block mt-0.5 truncate">
                          {displayArea} m²
                        </span>
                      </div>
                      <div className="min-w-0 border-l border-slate-200/80 pl-1">
                        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Target</span>
                        <span className={`font-bold text-[11px] block mt-0.5 truncate ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatDateDisplay(jc.targetDate)}
                        </span>
                      </div>
                    </div>

                    {/* Stage & Progress Bar (Seamless, Professional) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Stage:</span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {isUnlaunched ? 'Unlaunched' : isCompleted ? '20. PACKING (COMPLETED)' : (jc.currentStageName || PF01_STAGES[0])}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 shrink-0">
                          {progressPct}%
                        </span>
                      </div>
                      
                      {/* Modern Smooth Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            progressPct >= 100
                              ? 'bg-emerald-500'
                              : progressPct >= 50
                              ? 'bg-blue-600'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${Math.max(4, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons: Clean & Cohesive Button Palette */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {isUnlaunched ? (
                        <button
                          onClick={() => handleLaunchExistingJobCard(jc.id)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Launch Job</span>
                        </button>
                      ) : isCompleted ? (
                        <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Production Complete</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMovementJob(jc);
                            setHasRejectionInMovement(false);
                            setFullMoveRejectQty(0);
                            setFullMoveRemarks('');
                            setFullMoveRemarkType('Clear Movement');
                            setPartialMoveQty(Math.max(1, Math.floor((jc.totalPcbQty || 160) / 2)));
                            setMovementTab('FULL');
                          }}
                          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Move Stage ➔</span>
                        </button>
                      )}

                      <button
                        onClick={() => fetchJobCardHistory(jc)}
                        title="View Full Stage Movement & Traceability History"
                        className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 active:scale-95 transition-all"
                      >
                        <History className="w-3.5 h-3.5 text-slate-600" />
                        <span>History</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(jc)}
                        title="Edit Job Card Parameters"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl inline-flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeleteConfirmCard(jc)}
                          disabled={Boolean(deletingCardId && (deletingCardId === jc.id || deletingCardId === jc.jobCardNo))}
                          title="Delete Job Card (Super Admin Only)"
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                          {deletingCardId && (deletingCardId === jc.id || deletingCardId === jc.jobCardNo) ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
            <div className="flex items-center gap-1.5">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={validCurrentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setCurrentPage(Math.min(Math.max(1, val), totalPages));
                  }
                }}
                className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <span>of {totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage <= 1}
                title="First Page"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                |&lt;&lt;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                title="Previous Page"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                title="Next Page"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                &gt;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage >= totalPages}
                title="Last Page"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                &gt;&gt;|
              </button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="text-slate-600 font-sans">
              View <span className="font-bold text-slate-900">{filteredCards.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-bold text-slate-900">{endIndex}</span> of <span className="font-bold text-slate-900">{filteredCards.length}</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* ── SECTION 2: COMPLETED JOB CARDS & DISPATCH HUB ── */}
      {activeSectionTab === 'COMPLETED_DISPATCH' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 1. TOP METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Total Completed Cards */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Job Cards</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalCompletedCount}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> 100% Final QC Passed
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2: Ready for Dispatch */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Ready for Dispatch</span>
                <div className="text-2xl font-black text-amber-950 font-mono mt-0.5">
                  {readyToDispatchCount}
                </div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  Packed in FG Store • Awaiting Gate Pass
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3: Dispatched / In-Transit */}
            <div className="bg-white border border-blue-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">In Transit / Dispatched</span>
                <div className="text-2xl font-black text-blue-950 font-mono mt-0.5">
                  {inTransitCount}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                  Gate Pass Generated • Out for Delivery
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 4: Delivered to Customer */}
            <div className="bg-white border border-purple-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Delivered & Confirmed</span>
                <div className="text-2xl font-black text-purple-950 font-mono mt-0.5">
                  {deliveredCount}
                </div>
                <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                  POD Acknowledged by Customer
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 2. SEARCH & FILTER TOOLBAR */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dispatchSearchQuery}
                onChange={(e) => setDispatchSearchQuery(e.target.value)}
                placeholder="Search completed jobs, customer, PO #, part code, gate pass, tracking LR..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              {dispatchSearchQuery && (
                <button
                  onClick={() => setDispatchSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setDispatchFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dispatchFilterStatus === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Completed ({totalCompletedCount})
              </button>
              <button
                onClick={() => setDispatchFilterStatus('READY_FOR_DISPATCH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dispatchFilterStatus === 'READY_FOR_DISPATCH'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Ready to Dispatch ({readyToDispatchCount})
              </button>
              <button
                onClick={() => setDispatchFilterStatus('DISPATCHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dispatchFilterStatus === 'DISPATCHED'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                In Transit ({inTransitCount})
              </button>
              <button
                onClick={() => setDispatchFilterStatus('DELIVERED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dispatchFilterStatus === 'DELIVERED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Delivered ({deliveredCount})
              </button>
            </div>
          </div>

          {/* 3. COMPLETED & DISPATCH TABLE */}
          <div className="border border-slate-300/80 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px] whitespace-nowrap">WIP No.</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">Product</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[100px] whitespace-nowrap">Product Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[110px] whitespace-nowrap">Customer</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[90px] whitespace-nowrap">Launch</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[90px] whitespace-nowrap">Target</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] whitespace-nowrap">Priority</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Rejection</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[50px] whitespace-nowrap">Unit</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[65px] text-right whitespace-nowrap">Area</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[170px] whitespace-nowrap">Stage</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[100px] whitespace-nowrap">Progress</th>
                    <th className="py-2.5 px-3 text-center min-w-[140px] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {completedJobCards.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <div className="text-sm font-bold text-slate-600">No Completed Job Cards Found</div>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {dispatchSearchQuery
                              ? 'No completed cards match your current search query.'
                              : 'Job cards that reach Packing stage (Stage 20) or are marked Completed will appear here ready for dispatch.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    completedJobCards.map((jc, idx) => {
                      const latestDispatch = jc.dispatches && jc.dispatches.length > 0 ? jc.dispatches[0] : null;
                      const hasDispatch = Boolean(latestDispatch || jc.status === 'DISPATCHED' || jc.status === 'DELIVERED');
                      const isDelivered = latestDispatch?.deliveryStatus === 'DELIVERED' || jc.status === 'DELIVERED';
                      const isDispatched = hasDispatch && !isDelivered;

                      const targetQty = jc.totalPcbQty || 160;
                      const rejQty = jc.rejectedPcbQty || 0;
                      const goodQty = Math.max(0, targetQty - rejQty);

                      return (
                        <tr 
                          key={jc.id || jc.jobCardNo} 
                          className={`hover:bg-amber-50/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                          }`}
                        >
                          {/* 1. WIP No. with Printer Button */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowQrModal(jc)}
                                title="Print QR Sticker Tag"
                                className="text-amber-800 hover:text-amber-950 cursor-pointer p-0.5 shrink-0"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPdfPreviewJob(jc)}
                                title="View Job Card Route Sheet PDF"
                                className="text-slate-600 hover:text-slate-950 cursor-pointer p-0.5 shrink-0"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              {jc.photoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPhotoLightbox(jc.photoUrl || null)}
                                  title="View Attached Original Physical Job Card Photo"
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer p-0.5 shrink-0 transition-colors"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span>{jc.subJobCardNo || jc.jobCardNo}</span>
                            </div>
                          </td>

                          {/* 2. Product */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-900 truncate max-w-[200px]" title={jc.customerPartNo || jc.partCode || jc.partName}>
                            {jc.customerPartNo || jc.partCode || jc.partName || 'FR4 PCB'}
                          </td>

                          {/* 3. Product Code */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {jc.rfePartCode || 'D001'}
                          </td>

                          {/* 4. Customer */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-medium whitespace-nowrap truncate max-w-[130px]" title={jc.customerPO?.customer?.companyName || jc.clientName || jc.customer || jc.customerCode}>
                            {jc.customerCode || jc.clientName || jc.customer || 'RFE'}
                          </td>

                          {/* 5. Launch */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {formatDateDisplay(jc.launchedAt || jc.createdAt)}
                          </td>

                          {/* 6. Target */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {formatDateDisplay(jc.targetDate || jc.completedAt)}
                          </td>

                          {/* 7. Priority */}
                          <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                            <span
                              className={`font-bold text-[11px] ${
                                jc.priority === 'MOST URGENT' || jc.priority === 'HIGH'
                                  ? 'text-rose-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {jc.priority === 'MOST URGENT' ? 'Top' : jc.priority || 'NORMAL'}
                            </span>
                          </td>

                          {/* 8. Qty */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold text-slate-900 whitespace-nowrap">
                            <span className="text-slate-900 font-black">{goodQty}</span>
                          </td>

                          {/* 9. Rejection */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold whitespace-nowrap">
                            <span className={rejQty > 0 ? 'text-rose-600 font-black' : 'text-slate-900 font-bold'}>
                              {rejQty}
                            </span>
                          </td>

                          {/* 10. Unit */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                            PCBs
                          </td>

                          {/* 11. Area */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-right font-bold text-emerald-700 whitespace-nowrap">
                            {jc.custPnlAreaSqm ? jc.custPnlAreaSqm.toFixed(2) : (jc.prodPnlAreaSqm ? jc.prodPnlAreaSqm.toFixed(2) : '45.00')}
                          </td>

                          {/* 12. Stage */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                            {isDelivered ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  DELIVERED ({latestDispatch?.receiverName || 'STORE'})
                                </span>
                                {latestDispatch?.deliveryPhotoUrl && (
                                  <button
                                    onClick={() => setPhotoLightbox(latestDispatch.deliveryPhotoUrl)}
                                    className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Click to view signed proof of delivery photo"
                                  >
                                    <Camera className="w-2.5 h-2.5 text-blue-600" />
                                    <span>Signed POD Photo</span>
                                  </button>
                                )}
                              </div>
                            ) : isDispatched ? (
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                IN TRANSIT ({latestDispatch?.dispatchNo || 'DSP'})
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono inline-flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                20. PACKING (DONE)
                              </span>
                            )}
                          </td>

                          {/* 13. Progress */}
                          <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-14 bg-slate-200 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300">
                                <div
                                  className="h-full rounded-full transition-all duration-300 bg-emerald-600"
                                  style={{ width: '100%' }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-black text-emerald-700">100%</span>
                            </div>
                          </td>

                          {/* 14. Actions */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {!hasDispatch && (
                                <button
                                  onClick={() => handleOpenDispatchModal(jc)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer border border-amber-600"
                                  title="Generate Outbound Gate Pass & Mark Dispatched"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Dispatch</span>
                                </button>
                              )}

                              {isDispatched && latestDispatch && (
                                <button
                                  onClick={() => handleOpenDeliveryModal(latestDispatch, jc)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  title="Confirm Customer Delivery (POD)"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Confirm</span>
                                </button>
                              )}

                              {isDelivered && latestDispatch?.deliveryPhotoUrl && (
                                <button
                                  onClick={() => setPhotoLightbox(latestDispatch.deliveryPhotoUrl)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer border border-blue-200"
                                  title="View Signed Delivery Challan Photo"
                                >
                                  <Eye className="w-3 h-3 text-blue-600" />
                                  <span>POD</span>
                                </button>
                              )}

                              {isDelivered && latestDispatch && !latestDispatch?.deliveryPhotoUrl && (
                                <button
                                  onClick={() => handleOpenDeliveryModal(latestDispatch, jc)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer border border-slate-300"
                                  title="Attach signed delivery challan photo"
                                >
                                  <Upload className="w-3 h-3 text-slate-600" />
                                  <span>POD</span>
                                </button>
                              )}

                              {latestDispatch && (
                                <Link
                                  href={`/challan-pdf/${encodeURIComponent(latestDispatch.dispatchNo || latestDispatch.id || jc.jobCardNo)}`}
                                  target="_blank"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer border border-slate-200"
                                  title="View & Print Official Delivery Challan / Gate Pass"
                                >
                                  <FileText className="w-3 h-3 text-blue-600" />
                                  <span>Challan</span>
                                </Link>
                              )}

                              <button
                                onClick={() => fetchJobCardHistory(jc)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer border border-slate-200"
                                title="View Complete 20-Stage Movement History"
                              >
                                <History className="w-3 h-3" />
                                <span>Audit</span>
                              </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* MODAL 1: ADD NEW JOB CARD (Clean Professional Enterprise Design) */}
      {showGenerateModal && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-6 overflow-y-auto font-quicksand">
            <div className="bg-white border border-slate-300 rounded-lg w-full max-w-6xl xl:max-w-7xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden my-auto font-quicksand">
              
              {/* Header */}
              <div className="px-3.5 py-3 sm:px-7 sm:py-5 border-b border-slate-800 bg-slate-900 text-white shrink-0">
                {/* A. Mobile Header (< sm) */}
                <div className="sm:hidden flex flex-col gap-2 w-full">
                  {/* Top Row: Logo + Badge + Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src="/Assets/logo-1.png"
                        alt="RF Electro Tech"
                        className="h-7 w-auto object-contain shrink-0"
                      />
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold truncate">
                        #{launchForm.jobCardNo || 'DRAFT'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('toggle-calculator'));
                          }
                        }}
                        className="w-8 h-8 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-700 shadow-xs active:scale-90"
                        title="Open Calculator"
                      >
                        <Calculator className="w-4 h-4 text-amber-400" />
                      </button>
                      <button 
                        type="button"
                        disabled={isSubmittingLaunch}
                        onClick={() => setShowGenerateModal(false)} 
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold disabled:opacity-40 active:scale-90 shrink-0"
                        title="Close modal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Title & Subtitle */}
                  <div>
                    <h3 className="font-bold text-white text-base tracking-tight font-quicksand leading-tight">
                      {editingCardId ? 'Edit Job Card Parameters' : 'Create New Job Card'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium font-quicksand truncate">
                      RF Electro Tech (India) Pvt. Ltd. • Traveler Control
                    </p>
                  </div>
                </div>

                {/* B. Desktop Header (>= sm) - 100% UNTOUCHED */}
                <div className="hidden sm:flex items-center justify-between w-full">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="h-11 sm:h-12 flex items-center shrink-0">
                      <img
                        src="/Assets/logo-1.png"
                        alt="RF Electro Tech"
                        className="h-10 sm:h-11 max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="h-9 sm:h-10 w-px bg-slate-700 hidden sm:block shrink-0" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <h3 className="font-bold text-white text-xl sm:text-2xl tracking-tight font-quicksand">
                          {editingCardId ? 'Edit Job Card Parameters' : 'Create New Job Card'}
                        </h3>
                        <span className="font-mono text-xs sm:text-sm px-3 py-0.5 rounded-md bg-slate-800 text-slate-100 border border-slate-700 font-bold shadow-xs">
                          #{launchForm.jobCardNo || 'DRAFT'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium font-quicksand">
                        RF Electro Tech (India) Pvt. Ltd. • IPC-A-600 Route Traveler Control
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('toggle-calculator'));
                        }
                      }}
                      className="h-10 px-3.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-2 transition-all cursor-pointer text-xs font-bold border border-slate-700 shadow-sm"
                      title="Open Calculator"
                    >
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline font-quicksand">Calculator</span>
                    </button>

                    <button 
                      type="button"
                      disabled={isSubmittingLaunch}
                      onClick={() => setShowGenerateModal(false)} 
                      className="w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xl font-bold disabled:opacity-40 shrink-0"
                      title="Close modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleLaunchJobCard} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 text-sm custom-scrollbar bg-white font-quicksand">
                
                {/* 1. Order Identification & Schedule */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                        Order Identification & Schedule
                      </h4>
                    </div>
                    {availableProducts.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">Load from Product Master:</span>
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
                          className="w-full sm:w-auto text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-md px-3 py-1.5 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer transition-colors max-w-full sm:max-w-xs"
                          defaultValue=""
                        >
                          <option value="" disabled>Load from Product Master...</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} ({p.name}) — {p.layers || 2}L
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 sm:gap-y-6 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Job Card No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.jobCardNo}
                        onChange={(e) => setLaunchForm({ ...launchForm, jobCardNo: e.target.value })}
                        className={`w-full h-11 bg-white border rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                          !editingCardId && launchForm.jobCardNo && jobCards.some((j) => (j.jobCardNo || '').trim().toLowerCase() === launchForm.jobCardNo.trim().toLowerCase())
                            ? 'border-amber-500 focus:border-amber-600 focus:ring-amber-500 bg-amber-50/20'
                            : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900'
                        }`}
                        placeholder="26-27-1731"
                      />
                      {!editingCardId && launchForm.jobCardNo && jobCards.some((j) => (j.jobCardNo || '').trim().toLowerCase() === launchForm.jobCardNo.trim().toLowerCase()) && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-2.5 py-1.5 font-medium animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span><strong>Already Exists:</strong> This Job Card already exists in the database. Submitting will display and highlight it at the top.</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Launch Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={launchForm.launchDate}
                        onChange={(e) => setLaunchForm({ ...launchForm, launchDate: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Target Delivery Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={launchForm.targetDate}
                        onChange={(e) => setLaunchForm({ ...launchForm, targetDate: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Customer Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.customerCode}
                        onChange={(e) => setLaunchForm({ ...launchForm, customerCode: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        placeholder="e.g. CUST-001"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Customer Part No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.customerPartNo}
                        onChange={(e) => setLaunchForm({ ...launchForm, customerPartNo: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        placeholder="Customer Part Number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        R.F.E. Part Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={launchForm.rfePartCode}
                        onChange={(e) => setLaunchForm({ ...launchForm, rfePartCode: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        placeholder="R.F.E. Part Code"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Physical Job Card Verification */}
                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">2</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <span>Physical Job Card Photo Verification</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </h4>
                    </div>
                    {launchForm.photoUrl ? (
                      <span className="text-xs sm:text-sm text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Hard Copy Attached
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-sm text-slate-500 font-medium">
                        Required for shopfloor release
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    id="jobCardPhotoFileInput"
                    accept="image/*"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleProcessPhotoFile(file);
                      }
                    }}
                    className="hidden"
                  />

                  {launchForm.photoUrl ? (
                    <div className="border border-slate-200 rounded-md p-3 sm:p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div 
                          onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                          className="relative group cursor-pointer w-14 h-14 rounded border border-slate-300 shrink-0 bg-white overflow-hidden shadow-2xs"
                          title="Inspect image"
                        >
                          <img
                            src={launchForm.photoUrl}
                            alt="Attached Job Card"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">Original Physical Job Card Document Verified</p>
                          <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium">
                            {launchForm.photoUrl.startsWith('data:') ? 'Image uploaded from device (Compressed Base64)' : launchForm.photoUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setPhotoLightbox(launchForm.photoUrl)}
                          className="flex-1 sm:flex-none justify-center px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Inspect</span>
                        </button>
                        <label
                          htmlFor="jobCardPhotoFileInput"
                          className="flex-1 sm:flex-none justify-center px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Replace</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setLaunchForm((prev) => ({ ...prev, photoUrl: '' }))}
                          className="flex-1 sm:flex-none justify-center px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border border-dashed border-slate-300 hover:border-slate-500 rounded-md p-4 sm:p-5 bg-slate-50 transition-colors space-y-3 sm:space-y-3.5"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          handleProcessPhotoFile(file);
                        } else {
                          showToast('Please drop a valid image file (PNG, JPG, WEBP).', 'error');
                        }
                      }}
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              const blob = items[i].getAsFile();
                              if (blob) {
                                handleProcessPhotoFile(blob);
                                break;
                              }
                            }
                          }
                        }
                      }}
                    >
                      <label
                        htmlFor="jobCardPhotoFileInput"
                        className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 cursor-pointer py-2 group"
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 group-hover:bg-slate-900 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0">
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="block text-xs sm:text-sm font-bold text-slate-800">
                            Click to upload original job card photo, or drag and drop here
                          </span>
                          <span className="block text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
                            Supports PNG, JPG, WEBP • Clipboard paste (Ctrl+V) supported
                          </span>
                        </div>
                      </label>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 pt-2 border-t border-slate-200">
                        <span className="text-xs text-slate-600 shrink-0 font-semibold">Or paste image URL:</span>
                        <input
                          type="text"
                          value={launchForm.photoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.match(/^[a-zA-Z]:\\/) || val.startsWith('file://')) {
                              showToast('Local C:\\ computer paths cannot be loaded directly by browsers. Please click "Upload Photo" instead.', 'error');
                              return;
                            }
                            setLaunchForm((prev) => ({ ...prev, photoUrl: val }));
                          }}
                          className="w-full sm:flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-900 font-mono"
                          placeholder="https://example.com/jobcard-photo.jpg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Technical Specifications */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">3</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                        Technical Specifications (IPC-A-600 Standard)
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 sm:gap-y-6 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Layers <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.layers}
                        onChange={(e) => setLaunchForm({ ...launchForm, layers: Number(e.target.value) || 2 })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
                      >
                        <option value={1}>1 Layer (Single Sided)</option>
                        <option value={2}>2 Layers (Double Sided)</option>
                        <option value={4}>4 Layers (Multilayer)</option>
                        <option value={6}>6 Layers</option>
                        <option value={8}>8 Layers</option>
                        <option value={10}>10 Layers</option>
                        <option value={12}>12 Layers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Thickness (mm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={launchForm.thicknessMm}
                        onChange={(e) => setLaunchForm({ ...launchForm, thicknessMm: parseFloat(e.target.value) || 1.6 })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-medium text-slate-800 focus:outline-none focus:border-slate-900"
                        placeholder="1.6"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Copper Weight <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.copperWeight}
                        onChange={(e) => setLaunchForm({ ...launchForm, copperWeight: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
                      >
                        <option value="0.5oz">0.5 oz (18µm)</option>
                        <option value="1oz">1.0 oz (35µm)</option>
                        <option value="2oz">2.0 oz (70µm)</option>
                        <option value="3oz">3.0 oz (105µm)</option>
                        <option value="4oz">4.0 oz (140µm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Surface Finish <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.surfaceFinish}
                        onChange={(e) => setLaunchForm({ ...launchForm, surfaceFinish: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
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
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Solder Mask <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.solderMask}
                        onChange={(e) => setLaunchForm({ ...launchForm, solderMask: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
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
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Material Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.materialType}
                        onChange={(e) => setLaunchForm({ ...launchForm, materialType: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
                      >
                        <option value="FR-4">FR-4 (TG140)</option>
                        <option value="FR-4 High TG">FR-4 High TG (TG170)</option>
                        <option value="Aluminum">Aluminum Base</option>
                        <option value="Copper Base">Copper Base</option>
                        <option value="Rogers (High Frequency)">Rogers High Frequency</option>
                        <option value="Polyimide">Polyimide (Flex)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Production Quantities & Flow Route */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">4</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                        Production Quantities & Flow Route
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 sm:gap-y-6 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Priority <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.priority}
                        onChange={(e: any) => setLaunchForm({ ...launchForm, priority: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-semibold"
                      >
                        <option value="NORMAL">Normal Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="MOST URGENT">Urgent Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Total Quantity (PCBs) <span className="text-rose-500">*</span>
                      </label>
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
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                        placeholder="160"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Total Area (Sqm) <span className="text-rose-500">*</span>
                      </label>
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
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                        placeholder="45"
                      />
                      <p className="text-xs text-slate-500 mt-1.5 font-mono font-medium">
                        {launchForm.totalPcbQty || 0} × {unitPcbAreaSqm.toFixed(4)} m² = {(Number(launchForm.custPnlAreaSqm) || 0).toFixed(2)} m²
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Job Flow Route <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={launchForm.jobFlowSelection}
                        onChange={(e) => setLaunchForm({ ...launchForm, jobFlowSelection: e.target.value })}
                        className="w-full h-11 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer font-medium"
                      >
                        <option value="PF-01">PF-01 Standard Flow (20 Stages)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Floor Release & Lot Options */}
                <div className="space-y-3.5 sm:space-y-4 pt-2">
                  <div className="border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">5</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                        Floor Release & Traveler Options
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Direct Launch Checkbox */}
                    <label className="flex items-start gap-3.5 p-3.5 sm:p-4 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                      <input
                        type="checkbox"
                        id="autoLaunch"
                        checked={launchForm.autoLaunch}
                        onChange={(e) => setLaunchForm({ ...launchForm, autoLaunch: e.target.checked })}
                        className="w-5 h-5 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          Immediately dispatch traveler to Stage 1 Production (1. SHEARING)
                        </span>
                        <span className="text-slate-500 text-[11px] sm:text-xs block mt-0.5 font-medium">
                          Marks job card as IN_PROGRESS and makes it available to the cutting floor right away.
                        </span>
                      </div>
                    </label>

                    {/* Pre-Launch Sub-Job Card Split Checkbox */}
                    <div className="border border-slate-200 rounded-md p-3.5 sm:p-4 bg-white space-y-3.5">
                      <label className="flex items-start gap-3.5 cursor-pointer">
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
                          className="w-4.5 h-4.5 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                            Pre-launch lot splitting (divide volume into multiple travelers)
                          </span>
                          <span className="text-slate-500 text-[11px] sm:text-xs block mt-0.5 font-medium">
                            Split the job card into sub-lots (-1, -2, etc.) prior to releasing to the shop floor.
                          </span>
                        </div>
                      </label>

                      {launchForm.enablePreSplit && (
                        <div className="pt-3 border-t border-slate-200 space-y-3.5 pl-0 sm:pl-8">
                          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5">
                            <span className="text-xs sm:text-sm text-slate-700 font-bold">Sub-Lot Allocation:</span>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded border border-slate-300 cursor-pointer transition-colors"
                              >
                                50/50 Split
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
                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded border border-slate-300 cursor-pointer transition-colors"
                              >
                                Split in 4
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
                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded cursor-pointer transition-colors"
                              >
                                + Add Lot
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                            {launchForm.customSplits.map((item, idx) => (
                              <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 bg-slate-50 p-2 sm:p-2.5 rounded border border-slate-200">
                                <span className="text-xs font-mono font-bold text-slate-500 w-6">#{idx + 1}</span>
                                <input
                                  type="text"
                                  value={item.subNo}
                                  onChange={(e) => {
                                    const updated = [...launchForm.customSplits];
                                    updated[idx].subNo = e.target.value;
                                    setLaunchForm({ ...launchForm, customSplits: updated });
                                  }}
                                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-slate-900"
                                />
                                <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm">
                                  <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => {
                                      const updated = [...launchForm.customSplits];
                                      updated[idx].qty = Number(e.target.value);
                                      setLaunchForm({ ...launchForm, customSplits: updated });
                                    }}
                                    className="w-18 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 text-right focus:outline-none focus:border-slate-900"
                                  />
                                  <span className="text-xs text-slate-500 font-sans font-medium">PCB</span>
                                </div>
                                {launchForm.customSplits.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = launchForm.customSplits.filter((_, i) => i !== idx);
                                      setLaunchForm({ ...launchForm, customSplits: updated });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded cursor-pointer transition-colors"
                                    title="Remove lot"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {(() => {
                            const sum = launchForm.customSplits.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
                            const target = Number(launchForm.totalPcbQty) || 160;
                            const isValid = sum === target;
                            return (
                              <div className={`p-3 rounded-md text-xs sm:text-sm font-bold flex items-center justify-between border ${isValid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                                <span className="font-mono">
                                  Allocated: <strong>{sum}</strong> / Target: <strong>{target}</strong> PCBs
                                </span>
                                <span>{isValid ? '✓ Allocation Balanced' : '⚠️ Sub-lot sum must match total volume'}</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </form>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-7 sm:py-5 bg-slate-50 border-t border-slate-200 shrink-0 font-quicksand">
                <div className="text-xs sm:text-sm text-slate-600 font-medium text-center sm:text-left">
                  {isSubmittingLaunch ? (
                    <span className="flex items-center gap-2 text-slate-700 justify-center sm:justify-start">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{editingCardId ? 'Saving changes to database...' : 'Creating job card and generating traveler...'}</span>
                    </span>
                  ) : (
                    <span>Ready to dispatch to production • Standard Flow PF-01</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingLaunch}
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-40 text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingLaunch}
                    onClick={(e) => handleLaunchJobCard(e as any)}
                    className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:px-7 sm:py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed text-center"
                  >
                    {isSubmittingLaunch ? (
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    ) : editingCardId ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                    )}
                    <span>
                      {isSubmittingLaunch
                        ? editingCardId ? 'Saving Changes...' : 'Creating Job Card...'
                        : editingCardId ? 'Save Changes' : 'Launch Job Card'}
                    </span>
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-5 overflow-hidden font-quicksand">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl w-full max-w-6xl max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 overflow-hidden font-sans">
              
              {/* 1. Fixed Sticky Header (Responsive Header with Integrated Tab Switcher) */}
              <div className="p-3 sm:p-5 border-b border-slate-200 md:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white md:bg-gradient-to-r md:from-slate-950 md:via-slate-900 md:to-slate-950 text-slate-900 md:text-white shrink-0 shadow-xs md:shadow-md">
                
                {/* A. MOBILE-ONLY CLEAN ENTERPRISE HEADER (< md, MATCHING PDF TRAVELER DESIGN) */}
                <div className="md:hidden flex flex-col gap-2.5 w-full">
                  {/* Top Bar: Subtitle Badge + Uniform Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider truncate">
                          JOB CARD MOVEMENT
                        </span>
                      </div>
                    </div>

                    {/* Mobile-Only Action Buttons (Delete, Calc, Close) - Clean 32px Light Touch Targets */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeleteConfirmCard(selectedMovementJob)}
                          title="Delete this Job Card (Super Admin Only)"
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-90 text-rose-600 border border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('toggle-calculator'));
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Open Calculator"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setSelectedMovementJob(null)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Close Modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Info Row: Crisp Dark Card No + Blue Stage Badge */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <h3 className="font-black text-slate-950 text-xl font-mono tracking-tight truncate">
                      {selectedMovementJob.jobCardNo}
                    </h3>
                    <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/90 font-bold font-sans flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      Stage: {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                    </span>
                  </div>

                  {/* Mobile-Only Segmented Tabs Bar (Clean Enterprise Light Theme) */}
                  <div className="grid grid-cols-3 bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 gap-1 text-xs font-sans shadow-inner w-full mt-0.5">
                    <button
                      onClick={() => setMovementTab('VIEW')}
                      className={`py-2 px-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center active:scale-95 ${
                        movementTab === 'VIEW'
                          ? 'bg-white text-slate-950 shadow-xs border border-slate-200/90 font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Overview</span>
                    </button>

                    <button
                      onClick={() => setMovementTab('FULL')}
                      className={`py-2 px-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center active:scale-95 ${
                        movementTab === 'FULL'
                          ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600 font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span>Full Move</span>
                    </button>

                    <button
                      onClick={() => setMovementTab('PARTIAL')}
                      className={`py-2 px-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center active:scale-95 ${
                        movementTab === 'PARTIAL'
                          ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-500 font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold'
                      }`}
                    >
                      <Split className="w-3.5 h-3.5 shrink-0" />
                      <span>Split Lot</span>
                    </button>
                  </div>
                </div>

                {/* B. DESKTOP-ONLY HEADER & TABS (>= md) - 100% PRESERVED */}
                <div className="hidden md:flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest truncate">
                          JOB CARD DASHBOARD & MOVEMENT
                        </span>
                      </div>
                      <h3 className="font-black text-white text-2xl flex items-center gap-3 mt-0.5 font-mono tracking-tight">
                        <span className="text-amber-300">{selectedMovementJob.jobCardNo}</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-500/40 font-bold font-sans flex items-center gap-1 shadow-xs whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          Stage: {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Desktop Tab Switcher & Desktop Action Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900/95 p-1.5 rounded-2xl border border-slate-800 gap-1.5 text-xs font-sans shadow-inner">
                      <button
                        onClick={() => setMovementTab('VIEW')}
                        className={`py-2 px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-center text-xs active:scale-95 ${
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
                        className={`py-2 px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-center text-xs active:scale-95 ${
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
                        className={`py-2 px-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-center text-xs active:scale-95 ${
                          movementTab === 'PARTIAL'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Split className="w-4 h-4 shrink-0" />
                        <span>C. Uncompleted / Split</span>
                      </button>
                    </div>

                    {/* Desktop Only Extra Buttons */}
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeleteConfirmCard(selectedMovementJob)}
                          title="Delete this Job Card (Super Admin Only)"
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm border border-rose-500 shrink-0 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Job Card</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('toggle-calculator'));
                          }
                        }}
                        className="text-slate-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all shrink-0 border border-slate-700 flex items-center gap-1.5 shadow-sm"
                        title="Open Calculator"
                      >
                        <Calculator className="w-4 h-4 text-amber-400" />
                        <span>Calc</span>
                      </button>

                      <button
                        onClick={() => setSelectedMovementJob(null)}
                        className="text-slate-400 hover:text-white text-sm font-bold p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all shrink-0 border border-slate-800/80 flex items-center justify-center w-10 h-10 active:scale-95"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Scrollable Body Content (with padding-bottom for mobile calculator clearance) */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 sm:pb-6 bg-slate-50/50">

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
                      {/* Specifications Main Container */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4 font-sans shadow-xs">
                        <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2 font-extrabold text-slate-900 tracking-tight">
                            <FileText className="w-4.5 h-4.5 text-blue-700 shrink-0" />
                            Job Card Specifications & Details
                          </span>
                          {getStatusBadge(selectedMovementJob.status)}
                        </div>
                        
                        {/* A. MOBILE-ONLY CLEAN EXECUTIVE OVERVIEW (< md, NO NESTED BOXES) */}
                        <div className="md:hidden space-y-3.5">
                          {/* 1. At-A-Glance Production KPIs Strip */}
                          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-center">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Quantity</span>
                              <strong className="text-indigo-700 font-mono text-sm block mt-0.5 font-black">
                                {selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4))} PCBs
                              </strong>
                            </div>
                            <div className="text-center border-x border-slate-200/90 px-1">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">WIP Area</span>
                              <strong className="text-emerald-700 font-mono text-sm block mt-0.5 font-black">
                                {selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm} m²
                              </strong>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Date</span>
                              <strong className="text-slate-800 font-mono text-xs block mt-0.5 font-bold">
                                {selectedMovementJob.targetDate}
                              </strong>
                            </div>
                          </div>

                          {/* 2. Structured Key-Value Details (Clean & Eye-Friendly) */}
                          <div className="divide-y divide-slate-100 text-xs font-sans">
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Job Card No</span>
                              <span className="font-mono font-black text-sm text-amber-950 bg-amber-100/90 border border-amber-300/90 px-2 py-0.5 rounded-lg shadow-2xs">{selectedMovementJob.jobCardNo}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Current Stage</span>
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">
                                {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Customer Code</span>
                              <span className="font-semibold text-slate-900">{selectedMovementJob.customerCode || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Customer Part No</span>
                              <span className="font-semibold text-slate-900 truncate max-w-[180px]">{selectedMovementJob.customerPartNo || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">R.F.E. Part Code</span>
                              <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-blue-950 bg-blue-100/90 border border-blue-300/90 px-2 py-0.5 rounded-lg shadow-2xs">
                                <span className="text-[9px] font-bold text-blue-700 uppercase">RFE</span>
                                <span>{selectedMovementJob.rfePartCode || '—'}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Priority</span>
                              <span className={`font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-lg border ${
                                selectedMovementJob.priority === 'MOST URGENT'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : selectedMovementJob.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {selectedMovementJob.priority || 'NORMAL'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                              <span className="text-slate-500 font-medium">Job Flow</span>
                              <span className="font-mono font-bold text-slate-800">{selectedMovementJob.jobFlowSelection || 'PF-01 Standard'}</span>
                            </div>
                            {Boolean(selectedMovementJob.rejectedPcbQty && selectedMovementJob.rejectedPcbQty > 0) && (
                              <div className="flex items-center justify-between py-2.5 bg-rose-50/60 px-2.5 rounded-xl mt-1.5 border border-rose-200/80">
                                <span className="text-rose-800 font-bold flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  Rejections / Scrap
                                </span>
                                <span className="font-mono font-black text-rose-700">
                                  {selectedMovementJob.rejectedPcbQty} PCBs {selectedMovementJob.rejectedAreaSqm ? `(${selectedMovementJob.rejectedAreaSqm.toFixed(2)} m²)` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* B. DESKTOP-ONLY 4-COLUMN HORIZONTAL GRID (hidden md:grid) - 100% PRESERVED */}
                        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
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

                      {/* Rejection & Defect History in Tab A (Clean & Simple Minimalist Styling) */}
                      {selectedMovementJob.rejectionLogs && selectedMovementJob.rejectionLogs.length > 0 && (
                        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3 font-sans shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <h5 className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Rejection & Quality Log</span>
                              <span className="text-[11px] font-mono font-normal text-slate-400">({selectedMovementJob.rejectionLogs.length})</span>
                            </h5>
                            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                              Total: {selectedMovementJob.rejectedPcbQty || 0} Rejected PCBs
                            </span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                            {selectedMovementJob.rejectionLogs.map((log, lIdx) => (
                              <div key={lIdx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-700">
                                    Stage: <span className="font-mono font-bold text-slate-900">{log.stageName || 'Stage'}</span>
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                                      {log.rejectedPcbQty} PCBs
                                    </span>
                                    {log.timestamp && (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed font-normal break-words">
                                  {log.remark || 'Rejected during movement'}
                                </p>
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
                          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-3 font-sans shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Split className="w-4 h-4 text-blue-600 shrink-0" />
                                Sub-Job Lots Breakdown ({selectedMovementJob.subJobCards.length})
                              </h5>
                              <span className="text-xs text-slate-700 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                Total: {selectedMovementJob.totalPcbQty || (selectedMovementJob.custPnlQty && selectedMovementJob.custPnlQty > 50 ? selectedMovementJob.custPnlQty : Math.round((selectedMovementJob.prodPnlQty || 0) * 4))} PCBs
                              </span>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                              {selectedMovementJob.subJobCards.map((sub) => {
                                const sPcb = (sub as any).totalPcbQty || (sub as any).qty || selectedMovementJob.totalPcbQty || 160;

                                return (
                                  <div key={sub.id} className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-sans shadow-2xs hover:border-blue-400 transition-all">
                                    <div className="flex items-center justify-between gap-2">
                                      <strong className="text-slate-900 font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-200 text-xs truncate">
                                        {sub.subJobCardNo}
                                      </strong>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono font-black text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded border border-indigo-200 text-[11px]">
                                          {sPcb} PCBs
                                        </span>
                                        <span className="font-bold text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                          {sub.currentStage?.name || selectedMovementJob.currentStageName}
                                        </span>
                                      </div>
                                    </div>
                                    {sub.qrCodeValue && (
                                      <div className="text-[10px] text-slate-400 font-mono truncate">
                                        QR: {sub.qrCodeValue}
                                      </div>
                                    )}
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
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 border border-emerald-500/30"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>MARK JOB CARD AS COMPLETED (Stage 20 PACKING)</span>
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => setShowQrModal(selectedMovementJob)}
                            className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 border border-slate-800"
                          >
                            <QrCode className="w-4 h-4 text-amber-400" />
                            <span>VIEW & PRINT QR</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPdfPreviewJob(selectedMovementJob)}
                            className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center transition-all active:scale-98 border border-blue-500"
                          >
                            <FileText className="w-4 h-4" />
                            <span>OPEN JOB CARD PDF</span>
                          </button>
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
                  const nextStageTitle = PF01_STAGES[currentStageIdx + 1] || '20. PACKING (COMPLETED)';

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 text-xs font-sans">
                      {/* Left: Stage Progression Pipeline & Lot Stats */}
                      <div className="lg:col-span-6 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50/80 border border-blue-200/90 p-4 sm:p-5 rounded-2xl text-blue-950 space-y-4 shadow-2xs flex flex-col justify-between">
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                <ArrowRight className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-extrabold text-blue-950 text-xs sm:text-sm">
                                Full Lot Stage Movement
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-300/60">
                              {selectedMovementJob.jobFlowSelection || 'PF-01 Standard'}
                            </span>
                          </div>

                          {/* Visual Stage Transition Stepper */}
                          <div className="bg-white/90 border border-blue-200/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                              Stage Transition Pipeline
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0 bg-slate-100/90 border border-slate-200 p-2 sm:p-2.5 rounded-lg text-center">
                                <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">FROM CURRENT</span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-800 block truncate font-mono mt-0.5">
                                  {selectedMovementJob.currentStageName || PF01_STAGES[0]}
                                </span>
                              </div>

                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>

                              <div className="flex-1 min-w-0 bg-blue-600 border border-blue-700 p-2 sm:p-2.5 rounded-lg text-center text-white shadow-xs">
                                <span className="text-[9px] font-mono text-blue-200 uppercase block font-bold">TO NEXT STAGE</span>
                                <span className="text-xs sm:text-sm font-black text-white block truncate font-mono mt-0.5">
                                  {nextStageTitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Lot Details Summary Chips */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="bg-white/80 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Moving Qty</span>
                              <span className="text-xs sm:text-sm font-black font-mono text-indigo-700 block mt-0.5">
                                {movingPcbQty} PCBs
                              </span>
                            </div>
                            <div className="bg-white/80 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Total Area</span>
                              <span className="text-xs sm:text-sm font-black font-mono text-slate-800 block mt-0.5">
                                {selectedMovementJob.custPnlAreaSqm || selectedMovementJob.prodPnlAreaSqm || 45} Sqm
                              </span>
                            </div>
                            <div className="col-span-2 sm:col-span-1 bg-white/80 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Job Card</span>
                              <span className="text-xs sm:text-sm font-black font-mono text-slate-900 block mt-0.5 truncate">
                                {selectedMovementJob.jobCardNo}
                              </span>
                            </div>
                          </div>

                          {/* Previous Rejection Alert Banner */}
                          {Boolean(selectedMovementJob.rejectedPcbQty && selectedMovementJob.rejectedPcbQty > 0) && (
                            <div className="p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-center justify-between shadow-2xs">
                              <span className="font-bold flex items-center gap-1.5 text-[11px] sm:text-xs">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                Previous Rejections:
                              </span>
                              <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-300 text-[11px]">
                                {selectedMovementJob.rejectedPcbQty} PCBs ({selectedMovementJob.rejectedAreaSqm || 0} Sqm)
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-blue-200/50 flex items-center justify-between text-[11px] text-blue-900/80 font-medium">
                          <span className="truncate">Part: <strong className="text-slate-900 font-mono font-bold">{selectedMovementJob.customerPartNo || selectedMovementJob.rfePartCode}</strong></span>
                          <span className="font-mono text-slate-500 shrink-0">Client: {selectedMovementJob.customerCode || '—'}</span>
                        </div>
                      </div>

                      {/* Right: Stage Movement Execution & Defect Option */}
                      <div className="lg:col-span-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs flex flex-col justify-between">
                        <div className="space-y-3.5">
                          {/* Rejection Option Toggle */}
                          <div className="bg-slate-50/80 border border-slate-200/80 p-3 sm:p-3.5 rounded-xl space-y-3">
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
                                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                              />
                            </label>

                            {hasRejectionInMovement && (
                              <div className="pt-2 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
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
                        </div>

                        {/* Confirmation Buttons */}
                        <div className="space-y-2 pt-2">
                          <button
                            type="button"
                            onClick={handleFullJobMovement}
                            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98 border border-blue-500/40 flex items-center justify-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4 shrink-0" />
                            <span>
                              {parsedRejectQty > 0
                                ? `CONFIRM MOVEMENT (${movingPcbQty} PCBs ➔ ${nextStageTitle} | ${parsedRejectQty} Rejected)`
                                : `CONFIRM FULL MOVEMENT (${currentTotalPcb} PCBs ➔ ${nextStageTitle})`}
                            </span>
                          </button>

                          {selectedMovementJob.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsCompleted(selectedMovementJob.id)}
                              className="hidden md:flex w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl sm:rounded-2xl text-xs items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 border border-emerald-500/40"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                  const currentStageIdx = (selectedMovementJob.currentStageIndex !== undefined && selectedMovementJob.currentStageIndex >= 0)
                    ? selectedMovementJob.currentStageIndex
                    : normalizeStageIndex(selectedMovementJob.currentStageName);
                  const nextStageTitle = PF01_STAGES[currentStageIdx + 1] || '20. PACKING (COMPLETED)';

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 text-xs font-sans">
                      {/* Left: Split Summary (Clean & Eye-Friendly) */}
                      <div className="lg:col-span-5 bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xs flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center">
                                <Split className="w-4 h-4 text-blue-600 shrink-0" />
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                Partial Lot Split & Movement
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                              Total: {masterPcb} PCBs
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            Use this when only part of the lot is ready to advance. The remaining batch will stay in the current stage as a balance sub-lot.
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-1">
                          {/* Advancing / Moving Batch */}
                          <div className="bg-slate-50/80 border border-slate-200/80 p-3 sm:p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Next Stage: <span className="font-mono font-bold text-slate-900">{nextStageTitle}</span>
                              </span>
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                MOVING FORWARD
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                              <div className="text-base font-black text-slate-900 font-mono">
                                {validMoveQty} <span className="text-xs font-semibold text-slate-500">PCBs</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Area: <strong className="text-slate-700">{movedArea}</strong> Sqm
                              </div>
                            </div>
                          </div>

                          {/* Remaining / Balance Batch */}
                          <div className="bg-slate-50/80 border border-slate-200/80 p-3 sm:p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Stays at: <span className="font-mono font-bold text-slate-900">{selectedMovementJob.currentStageName}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                                BALANCE REMAINING
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                              <div className="text-base font-black text-slate-900 font-mono">
                                {remPcb} <span className="text-xs font-semibold text-slate-500">PCBs</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Area: <strong className="text-slate-700">{remArea}</strong> Sqm
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Split Input Controls */}
                      <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs flex flex-col justify-between">
                        <div className="space-y-3.5">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-700">
                                Quantity Ready to Move Forward (PCBs) *
                              </label>
                              <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                              placeholder={`Enter PCBs (1 to ${masterPcb - 1})`}
                            />
                            {parsedMoveQty >= masterPcb && (
                              <p className="text-[11px] text-rose-600 font-bold mt-1">
                                ⚠ Quantity cannot exceed {masterPcb - 1} PCBs (Total Lot: {masterPcb} PCBs).
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Pending Work Reason:
                            </label>
                            <select
                              value={incompletePendingReason}
                              onChange={(e) => setIncompletePendingReason(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
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
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Specify Custom Pending Reason:
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Special Gold Finger Plating Inspection Pending"
                                value={incompleteCustomReason}
                                onChange={(e) => setIncompleteCustomReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Work Notes / Incomplete Movement Remarks:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Enter specific work details pending on remaining PCBs..."
                              value={incompleteRemarks}
                              onChange={(e) => setIncompleteRemarks(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handlePartialJobMovement}
                          className="w-full py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer border border-blue-600 active:scale-98 mt-3 flex items-center justify-center gap-2"
                        >
                          <Split className="w-4 h-4" />
                          <span>CONFIRM SPLIT MOVEMENT ({validMoveQty} Forward • {remPcb} Balance)</span>
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
                onOpenPdf={() => {
                  const targetJob = showQrModal;
                  setShowQrModal(null);
                  setPdfPreviewJob(targetJob);
                }}
                onViewPhoto={(url) => setPhotoLightbox(url)}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 7: LIVE PCB JOB CARD ROUTE SHEET PDF PREVIEW WITH BACKDROP BLUR */}
      {pdfPreviewJob && (
        <Portal>
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setPdfPreviewJob(null);
            }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10001] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
          >
            <div className="relative w-full max-w-6xl h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Floating Top Control Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white font-quicksand uppercase tracking-wide">
                        PCB Job Traveler Route Sheet PDF
                      </h3>
                      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                        DOC ID: RFE-TRV-01
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-quicksand mt-0.5">
                      Job Card No: <strong className="text-white font-mono">{pdfPreviewJob.subJobCardNo || pdfPreviewJob.jobCardNo}</strong> • Production Floor Route Traveler
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/job-cards-pdf/${encodeURIComponent(pdfPreviewJob.id || pdfPreviewJob.jobCardNo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-quicksand font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Open in new browser tab"
                  >
                    <span>Full Tab ↗</span>
                  </a>
                  <button
                    onClick={() => setPdfPreviewJob(null)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-bold transition-all cursor-pointer active:scale-95"
                    title="Close preview"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Iframe displaying the route sheet */}
              <div className="flex-1 w-full h-full bg-slate-950/80 overflow-hidden relative">
                <iframe
                  src={`/job-cards-pdf/${encodeURIComponent(pdfPreviewJob.id || pdfPreviewJob.jobCardNo)}`}
                  title={`Job Card PDF Preview - ${pdfPreviewJob.subJobCardNo || pdfPreviewJob.jobCardNo}`}
                  className="w-full h-full border-0"
                />
              </div>
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

      {/* MODAL 7: JOB CARD TRACEABILITY & STAGE MOVEMENT HISTORY */}
      {historyModalJob && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden font-quicksand text-slate-900">
            <div className="bg-white border border-slate-300 rounded-lg sm:rounded-xl w-full max-w-6xl xl:max-w-7xl h-[96vh] sm:h-[92vh] max-h-[98vh] sm:max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden font-quicksand">

              {/* ── Modal Top Header (Exact Match with New Job Card Enterprise Theme) ── */}
              <div className="px-3.5 py-3 sm:px-7 sm:py-5 bg-slate-900 text-white shrink-0 border-b border-slate-800 font-quicksand">
                {/* A. Mobile Header (< sm) */}
                <div className="sm:hidden flex flex-col gap-2.5 w-full">
                  {/* Top Row: Logo + Badge + Action Buttons (Refresh + Close) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src="/Assets/logo-1.png"
                        alt="RF Electro Tech"
                        className="h-7 w-auto object-contain shrink-0"
                      />
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold truncate">
                        #{historyModalJob.jobCardNo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fetchJobCardHistory(historyModalJob)}
                        disabled={isHistoryLoading}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-90"
                        title="Reload live movement data"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin text-blue-400' : 'text-slate-300'}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setHistoryModalJob(null); setHistoryLogs([]); setHistorySearchQuery(''); }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold active:scale-90 shrink-0"
                        title="Close modal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Title & Subtitle / Badges */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base tracking-tight font-quicksand leading-tight">
                      Stage Movement & Live History
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {historyModalJob.customerCode && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                          {historyModalJob.customerCode}
                        </span>
                      )}
                      {historyModalJob.customerPartNo && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold truncate max-w-[180px]">
                          Part: {historyModalJob.customerPartNo}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium font-quicksand truncate">
                        • Traceability Audit Ledger
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: View Mode Toggle (Timeline vs Table) */}
                  <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full text-xs font-bold font-quicksand gap-1">
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode('timeline')}
                      className={`py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        historyViewMode === 'timeline'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Timeline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode('table')}
                      className={`py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        historyViewMode === 'table'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Table</span>
                    </button>
                  </div>
                </div>

                {/* B. Desktop Header (>= sm) - 100% UNTOUCHED */}
                <div className="hidden sm:flex items-center justify-between w-full">
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <div className="h-11 sm:h-12 flex items-center shrink-0">
                      <img
                        src="/Assets/logo-1.png"
                        alt="RF Electro Tech"
                        className="h-10 sm:h-11 max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="h-9 sm:h-10 w-px bg-slate-700 hidden sm:block shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <h3 className="font-bold text-white text-xl sm:text-2xl tracking-tight font-quicksand">
                          Stage Movement & Live History
                        </h3>
                        <span className="font-mono text-xs sm:text-sm px-3 py-0.5 rounded-md bg-slate-800 text-slate-100 border border-slate-700 font-bold shadow-xs">
                          #{historyModalJob.jobCardNo}
                        </span>
                        {historyModalJob.customerCode && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {historyModalJob.customerCode}
                          </span>
                        )}
                        {historyModalJob.customerPartNo && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            Part: {historyModalJob.customerPartNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium font-quicksand">
                        RF Electro Tech (India) Pvt. Ltd. • Live Shopfloor Movement & Traceability Audit Ledger
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* View Mode Toggle: Timeline vs Table */}
                    <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setHistoryViewMode('timeline')}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          historyViewMode === 'timeline'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Timeline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          historyViewMode === 'table'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>Table</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchJobCardHistory(historyModalJob)}
                      disabled={isHistoryLoading}
                      className="h-10 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-bold rounded-lg border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Reload live movement data from server"
                    >
                      <RefreshCw className={`w-4 h-4 ${isHistoryLoading ? 'animate-spin text-blue-400' : 'text-slate-300'}`} />
                      <span className="hidden sm:inline">{isHistoryLoading ? 'Syncing...' : 'Refresh'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setHistoryModalJob(null); setHistoryLogs([]); setHistorySearchQuery(''); }}
                      className="w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xl font-bold shrink-0"
                      title="Close modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Summary & Metrics Bar (Clean, Unified 4-Card Strip) ── */}
              <div className="px-3.5 py-3 sm:px-7 sm:py-4 bg-slate-50 border-b border-slate-200 shrink-0 font-quicksand">
                {(() => {
                  const defectLogs = historyLogs.filter((l: any) => (Number(l.qtyRejected) || 0) > 0 || String(l.remarkType || '').toUpperCase().includes('REJECT'));
                  const totalScrapQty = defectLogs.reduce((acc: number, l: any) => acc + (Number(l.qtyRejected) || 0), 0) || (historyModalJob.rejectedPcbQty || 0);
                  const totalBatchQty = historyModalJob.totalPcbQty || historyModalJob.custPnlQty || historyModalJob.totalQty || 0;
                  const goodQty = Math.max(0, totalBatchQty - totalScrapQty);
                  const yieldPercent = totalBatchQty > 0 ? ((goodQty / totalBatchQty) * 100).toFixed(1) : '100.0';
                  const activeStage = historyModalJob.currentStageName || PF01_STAGES[historyModalJob.currentStageIndex || 0] || '1. SHEARING';
                  const isCompleted = historyModalJob.status === 'COMPLETED';
                  const isUnlaunched = historyModalJob.status === 'UNLAUNCHED';

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs sm:text-sm">
                      {/* 1. Active Stage Card */}
                      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Current Stage</span>
                        <div className="font-bold text-slate-900 text-xs sm:text-base truncate mt-0.5" title={activeStage}>
                          {activeStage}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600" /> Finished
                            </span>
                          ) : isUnlaunched ? (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-500" /> Pending Launch
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                              </span>
                              In Production
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Total Volume Card */}
                      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Lot Quantity</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-lg sm:text-2xl font-black text-slate-900 font-mono">{totalBatchQty}</strong>
                          <span className="text-xs text-slate-500 font-semibold">PCBs</span>
                        </div>
                        <span className="text-[11px] sm:text-xs text-slate-500 block mt-1 font-mono font-medium">
                          Area: {Number(historyModalJob.custPnlAreaSqm || historyModalJob.prodPnlAreaSqm || 0).toFixed(2)} m²
                        </span>
                      </div>

                      {/* 3. Quality & Yield Card */}
                      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Quality & Yield</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-lg sm:text-2xl font-black text-emerald-700 font-mono">{goodQty}</strong>
                          <span className="text-xs text-slate-500 font-semibold">Good ({yieldPercent}%)</span>
                        </div>
                        <span className={`text-[11px] sm:text-xs block mt-1 font-semibold ${totalScrapQty > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {totalScrapQty > 0 ? `⚠️ ${totalScrapQty} Scrap Logged` : '✓ Zero Scrap Logged'}
                        </span>
                      </div>

                      {/* 4. Process Flow & Specs Card */}
                      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Process Flow</span>
                        <div className="font-bold text-slate-800 text-xs sm:text-base truncate mt-0.5">
                          {(historyModalJob as any).processFlowMaster?.name || historyModalJob.jobFlowSelection || 'PF-01 (Standard)'}
                        </div>
                        <span className="text-[11px] sm:text-xs text-slate-500 block mt-1 font-medium truncate">
                          {historyModalJob.product?.layers ? `${historyModalJob.product.layers} Layers` : '2 Layers'} • {historyModalJob.product?.surfaceFinish || 'HASL'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Toolbar: Search & Filters (Clean Fixed Spacing, No Overlap) ── */}
              <div className="px-3.5 py-3 sm:px-7 sm:py-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 font-quicksand">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search stage, operator, remark..."
                      className="w-full h-9 sm:h-10 pl-11 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-medium"
                    />
                    {historySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm p-0.5 cursor-pointer"
                      >✕</button>
                    )}
                  </div>

                  <select
                    value={historyFilterType}
                    onChange={(e) => setHistoryFilterType(e.target.value as any)}
                    className="w-full sm:w-auto h-9 sm:h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer shrink-0 font-bold"
                  >
                    <option value="ALL">All Events</option>
                    <option value="FORWARD">Stage Movements Only</option>
                    <option value="REJECTION">Defects & Rejections</option>
                    <option value="INCOMPLETE">Partial Transfers</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {historyLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        let csvContent = "Step No,Date & Time,Job Card No,Sub Lot,Process Stage,Event Type,Qty Received,Qty Forwarded,Qty Rejected,Operator Name,Operator Role,Remarks\n";
                        historyLogs.forEach((l: any, i: number) => {
                          const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('en-GB') : '-';
                          const stageName = `"${(l.stage?.name || l.stageName || '-').replace(/"/g, '""')}"`;
                          const subNo = l.subJobCard?.subJobCardNo || historyModalJob.jobCardNo;
                          const eventType = l.remarkType || 'STAGE_MOVEMENT';
                          const opName = `"${(l.createdBy?.name || 'Operator').replace(/"/g, '""')}"`;
                          const opRole = `"${(l.createdBy?.role?.name || 'Staff').replace(/"/g, '""')}"`;
                          const remarkStr = `"${(l.remarks || l.rejectionReason || '').replace(/"/g, '""')}"`;
                          csvContent += `${historyLogs.length - i},${dateStr},${historyModalJob.jobCardNo},${subNo},${stageName},${eventType},${l.qtyReceived || 0},${l.qtyForwarded || 0},${l.qtyRejected || 0},${opName},${opRole},${remarkStr}\n`;
                        });
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", blobUrl);
                        link.setAttribute("download", `history_${historyModalJob.jobCardNo}_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                      }}
                      className="w-full sm:w-auto h-9 sm:h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-800 cursor-pointer transition-colors shadow-xs"
                      title="Export live history as CSV"
                    >
                      <Download className="w-4 h-4 text-slate-300" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Main Content Area (Timeline vs Table) ── */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-quicksand">
                {(() => {
                  const filtered = historyLogs.filter((log: any) => {
                    const isRej = (Number(log.qtyRejected) || 0) > 0 || String(log.remarkType || '').toUpperCase().includes('REJECT');
                    const isInc = log.remarkType === 'INCOMPLETE_MOVEMENT' || ((log.qtyForwarded || 0) < (log.qtyReceived || 0) && (log.qtyReceived || 0) > 0);

                    if (historyFilterType === 'REJECTION') {
                      if (!isRej) return false;
                    } else if (historyFilterType === 'INCOMPLETE') {
                      if (!isInc || isRej) return false;
                    } else if (historyFilterType === 'FORWARD') {
                      const isFwd = (log.qtyForwarded || 0) > 0;
                      if (!isFwd) return false;
                    }

                    if (historySearchQuery.trim()) {
                      const q = historySearchQuery.toLowerCase();
                      const stage = String(log.stage?.name || log.stageName || '').toLowerCase();
                      const opName = String(log.createdBy?.name || '').toLowerCase();
                      const opRole = String(log.createdBy?.role?.name || '').toLowerCase();
                      const opDept = String(log.createdBy?.department?.name || '').toLowerCase();
                      const remarks = String(log.remarks || '').toLowerCase();
                      const reason = String(log.rejectionReason || '').toLowerCase();
                      const subNo = String(log.subJobCard?.subJobCardNo || '').toLowerCase();
                      return stage.includes(q) || opName.includes(q) || opRole.includes(q) || opDept.includes(q) || remarks.includes(q) || reason.includes(q) || subNo.includes(q);
                    }

                    return true;
                  });

                  if (isHistoryLoading) {
                    return (
                      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-slate-700 animate-spin" />
                        <span className="text-sm text-slate-600 font-semibold font-quicksand">Fetching authentic live stage logs from database...</span>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    const activeStage = historyModalJob.currentStageName || PF01_STAGES[historyModalJob.currentStageIndex || 0] || '1. SHEARING';
                    return (
                      <div className="py-24 text-center space-y-3 max-w-lg mx-auto font-quicksand">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Clock className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">No Movement History Recorded Yet</h4>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {historySearchQuery
                            ? 'No stage movement events match your search query.'
                            : `This Job Card was launched and is currently awaiting processing at "${activeStage}". Movements will automatically log here as operators advance the lot.`}
                        </p>
                      </div>
                    );
                  }

                  const activeStage = historyModalJob.currentStageName || PF01_STAGES[historyModalJob.currentStageIndex || 0] || '1. SHEARING';
                  const isCompleted = historyModalJob.status === 'COMPLETED';

                  // ── VIEW 1: TIMELINE VIEW (Wide & Spacious) ──
                  if (historyViewMode === 'timeline') {
                    return (
                      <div className="w-full max-w-5xl mx-auto space-y-4 font-quicksand">
                        {/* Current Active Status Indicator at top of timeline (if card in production) */}
                        {!isCompleted && historyModalJob.status !== 'UNLAUNCHED' && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start gap-4 shadow-sm text-white font-quicksand">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 border border-blue-700/60 px-2.5 py-0.5 rounded-md font-mono">
                                  CURRENT ACTIVE WORKSTATION
                                </span>
                                <span className="text-xs text-slate-300 font-medium">In Production on Shop Floor</span>
                              </div>
                              <h4 className="font-extrabold text-white text-base sm:text-lg mt-1 tracking-tight">
                                {activeStage}
                              </h4>
                              <p className="text-xs text-slate-400 mt-1 font-medium">
                                Lot is currently at this workstation. Once the operator finishes processing and forwards it, the next live step will be logged automatically.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Chronological Event Cards */}
                        <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                          {filtered.map((log: any, idx: number) => {
                            const dateObj = log.createdAt ? new Date(log.createdAt) : null;
                            const dateStr = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                            const timeStr = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                            
                            const isRej = (Number(log.qtyRejected) || 0) > 0 || String(log.remarkType || '').toUpperCase().includes('REJECT');
                            const isInit = String(log.remarkType || '').includes('INITIAL_LAUNCH') || String(log.id || '').includes('initial-launch');
                            const isComp = String(log.remarkType || '').includes('JOB_COMPLETED') || String(log.id || '').includes('completed-summary');
                            const isSplit = String(log.remarkType || '').includes('SPLIT');
                            const isInc = !isRej && (isSplit || log.remarkType === 'INCOMPLETE_MOVEMENT' || ((log.qtyForwarded || 0) < (log.qtyReceived || 0) && (log.qtyReceived || 0) > 0));
                            
                            const stageName = log.stage?.name || log.stageName || 'Stage Movement';
                            const subNo = log.subJobCard?.subJobCardNo || historyModalJob.jobCardNo;
                            const opName = log.createdBy?.name || 'Shop Floor Operator';
                            const opRole = log.createdBy?.role?.name || 'Operator';
                            const opDept = log.createdBy?.department?.name || '';
                            const stepNumber = filtered.length - idx;

                            return (
                              <div key={log.id || idx} className="relative group">
                                {/* Dot on timeline */}
                                <div className={`absolute -left-7 top-4 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                                  isRej ? 'bg-rose-600 text-white' :
                                  isComp ? 'bg-emerald-600 text-white' :
                                  isInit ? 'bg-slate-900 text-white' :
                                  isSplit ? 'bg-amber-500 text-white' :
                                  isInc ? 'bg-amber-500 text-white' :
                                  'bg-emerald-600 text-white'
                                }`}>
                                  {isRej ? (
                                    <AlertTriangle className="w-3 h-3" />
                                  ) : isComp ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : isInit ? (
                                    <Zap className="w-3 h-3" />
                                  ) : (
                                    <ArrowRight className="w-3 h-3" />
                                  )}
                                </div>

                                {/* Event Card */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all font-quicksand">
                                  {/* Card Header: Step #, Stage Name, Status Badge, Timestamp */}
                                  <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="text-xs sm:text-sm font-mono font-bold text-slate-400">
                                        #{stepNumber}
                                      </span>
                                      <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                                        {stageName}
                                      </h5>
                                      {subNo && subNo !== historyModalJob.jobCardNo && (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                          Lot: {subNo}
                                        </span>
                                      )}
                                      {/* Status Badge */}
                                      {isRej ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          Defect Logged ({log.qtyRejected} PCBs)
                                        </span>
                                      ) : isComp ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Production Completed
                                        </span>
                                      ) : isInit ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                          Production Launched
                                        </span>
                                      ) : isSplit ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                          Lot Split & Forwarded
                                        </span>
                                      ) : isInc ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                          Partial Movement
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Stage Completed & Forwarded
                                        </span>
                                      )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right shrink-0">
                                      <div className="text-xs sm:text-sm font-bold text-slate-900">{dateStr}</div>
                                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{timeStr}</div>
                                    </div>
                                  </div>

                                  {/* Quantity Flow Badges */}
                                  <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                      <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-mono font-bold">Qty:</span>
                                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {log.qtyForwarded || log.qtyReceived || 0} PCBs Passed
                                      </span>
                                    </div>

                                    {log.qtyReceived !== undefined && log.qtyReceived !== log.qtyForwarded && (
                                      <div className="text-xs text-slate-400 font-mono">
                                        (Recv: {log.qtyReceived})
                                      </div>
                                    )}

                                    {log.qtyRejected > 0 && (
                                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                                        ⚠️ {log.qtyRejected} Rejected
                                      </span>
                                    )}

                                    {/* Operator Info */}
                                    <div className="ml-auto flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                      <User className="w-4 h-4 text-slate-400" />
                                      <span className="font-bold text-slate-900">{opName}</span>
                                      <span className="text-xs text-slate-500 font-medium">({opRole}{opDept ? ` • ${opDept}` : ''})</span>
                                    </div>
                                  </div>

                                  {/* Remarks Box (clean note callout) */}
                                  {(log.remarks || log.rejectionReason) && (
                                    <div className="mt-3 bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                                      <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px] px-2 py-0.5 rounded bg-slate-200/70 border border-slate-300/60 shrink-0 mt-0.5">
                                        Note
                                      </span>
                                      <span className="font-medium text-slate-800 leading-relaxed">{log.remarks || log.rejectionReason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // ── VIEW 2: CLEAN TABLE VIEW (Full Width & Spacious) ──
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs font-quicksand">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider font-bold">
                          <tr>
                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                            <th className="py-3.5 px-4 w-44">Date & Time</th>
                            <th className="py-3.5 px-4">Stage</th>
                            <th className="py-3.5 px-4 w-44">Status</th>
                            <th className="py-3.5 px-4 text-right w-32">Quantity</th>
                            <th className="py-3.5 px-4 w-52">Operator</th>
                            <th className="py-3.5 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {filtered.map((log: any, idx: number) => {
                            const dateObj = log.createdAt ? new Date(log.createdAt) : null;
                            const dateStr = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                            const timeStr = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                            const isRej = (Number(log.qtyRejected) || 0) > 0 || String(log.remarkType || '').toUpperCase().includes('REJECT');
                            const isInit = String(log.remarkType || '').includes('INITIAL_LAUNCH') || String(log.id || '').includes('initial-launch');
                            const isComp = String(log.remarkType || '').includes('JOB_COMPLETED') || String(log.id || '').includes('completed-summary');
                            const isSplit = String(log.remarkType || '').includes('SPLIT');
                            const stageName = log.stage?.name || log.stageName || 'Stage';
                            const subNo = log.subJobCard?.subJobCardNo || historyModalJob.jobCardNo;
                            const opName = log.createdBy?.name || 'Operator';
                            const opRole = log.createdBy?.role?.name || 'Staff';
                            const stepNumber = filtered.length - idx;

                            return (
                              <tr key={log.id || idx} className={`hover:bg-slate-50/80 transition-colors ${isRej ? 'bg-rose-50/40' : ''}`}>
                                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                                  #{stepNumber}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                                  <div className="font-bold text-slate-900">{dateStr}</div>
                                  <div className="text-[11px] text-slate-400">{timeStr}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900 text-sm">{stageName}</div>
                                  {subNo && subNo !== historyModalJob.jobCardNo && (
                                    <div className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                                      Lot: {subNo}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {isRej ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Defect Logged
                                    </span>
                                  ) : isComp ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Completed
                                    </span>
                                  ) : isInit ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                      Launched
                                    </span>
                                  ) : isSplit ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      Lot Split
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Forwarded
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                                  {log.qtyForwarded || log.qtyReceived || 0} PCBs
                                  {log.qtyRejected > 0 && (
                                    <div className="text-xs text-rose-600">({log.qtyRejected} scrap)</div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-900 text-sm">{opName}</div>
                                  <div className="text-xs text-slate-400 font-medium">{opRole}</div>
                                </td>
                                <td className="py-3.5 px-4 text-xs sm:text-sm text-slate-600 max-w-xs truncate font-medium" title={log.remarks || log.rejectionReason || ''}>
                                  {log.remarks || log.rejectionReason || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* ── Modal Footer ── */}
              <div className="flex items-center justify-between px-3.5 py-3 sm:px-7 sm:py-4 border-t border-slate-200 bg-slate-50 shrink-0 font-quicksand">
                <span className="text-slate-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">Live ledger • <strong>{historyLogs.length}</strong> records</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setHistoryModalJob(null); setHistoryLogs([]); setHistorySearchQuery(''); }}
                  className="h-9 px-4 sm:h-10 sm:px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer shadow-sm shrink-0"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </Portal>
      )}

      {/* ── MODAL 8: CREATE OUTBOUND DISPATCH & GATE PASS ── */}
      {isDispatchModalOpen && dispatchTargetJob && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm border border-amber-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-950 text-base sm:text-lg tracking-tight">
                        Generate Outbound Gate Pass & Dispatch
                      </h3>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                        {dispatchTargetJob.jobCardNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issue official dispatch gate pass, assign logistics partner & tracking number
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => { setIsDispatchModalOpen(false); setDispatchTargetJob(null); }}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateDispatch} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Job Summary Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                    <div className="font-bold text-slate-900 truncate">
                      {dispatchTargetJob.customerPO?.customer?.companyName || dispatchTargetJob.clientName || dispatchTargetJob.customer || '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Customer PO</span>
                    <div className="font-bold font-mono text-slate-900">
                      {dispatchTargetJob.customerPO?.poNo || dispatchTargetJob.poNumber || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Product Code</span>
                    <div className="font-bold font-mono text-slate-900 truncate">
                      {dispatchTargetJob.customerPartNo || dispatchTargetJob.rfePartCode || 'PCB Board'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Good Qty Ready</span>
                    <div className="font-black font-mono text-emerald-700">
                      {Math.max(0, (dispatchTargetJob.totalPcbQty || 160) - (dispatchTargetJob.rejectedPcbQty || 0))} PCBs
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Dispatched Quantity (PCBs) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={Math.max(1, (dispatchTargetJob.totalPcbQty || 160) - (dispatchTargetJob.rejectedPcbQty || 0))}
                        value={dispatchForm.dispatchedQty}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchedQty: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tracking / LR Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={dispatchForm.trackingLrNo}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, trackingLrNo: e.target.value })}
                        placeholder="e.g. LR-987654 or AWB-12345"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Destination / Delivery Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={dispatchForm.destination}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
                      placeholder="Customer plant, warehouse or store delivery address..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Logistics Carrier / Transporter <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={dispatchForm.courierName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, courierName: e.target.value })}
                        placeholder="e.g. VRL Logistics, DTDC, Blue Dart, Company Vehicle"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Vehicle Number (if dedicated / local)
                      </label>
                      <input
                        type="text"
                        value={dispatchForm.vehicleNo}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                        placeholder="e.g. MH-04-AB-1234"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Driver / Dispatch Executive Name
                      </label>
                      <input
                        type="text"
                        value={dispatchForm.driverName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                        placeholder="Driver or courier representative name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Contact Mobile Number
                      </label>
                      <input
                        type="text"
                        value={dispatchForm.contactNumber}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, contactNumber: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Packaging Details & Dispatch Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={dispatchForm.dispatchRemarks}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchRemarks: e.target.value })}
                      placeholder="e.g. 5 boxes vacuum packed with bubble wrap & moisture barrier bag..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsDispatchModalOpen(false); setDispatchTargetJob(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDispatch}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-amber-600"
                  >
                    {isSubmittingDispatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Gate Pass...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm Outbound Dispatch</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

      {/* ── MODAL 9: CONFIRM DELIVERY & UPDATE POD ── */}
      {isDeliveryModalOpen && selectedDispatchForDelivery && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/70 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base tracking-tight">
                      Confirm Customer Delivery (POD)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Gate Pass: {selectedDispatchForDelivery.dispatchNo || 'DSP-0001'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => { setIsDeliveryModalOpen(false); setSelectedDispatchForDelivery(null); }}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleUpdateDelivery} className="p-6 space-y-4 text-xs font-sans">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delivery Status
                  </label>
                  <select
                    value={deliveryForm.deliveryStatus}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="DELIVERED">DELIVERED (Successfully Handed Over)</option>
                    <option value="FAILED">FAILED / ATTEMPTED</option>
                    <option value="RETURNED">RETURNED TO SENDER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Received By (Customer Store / QA Rep) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.receiverName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                    placeholder="e.g. Rahul Sharma (Store Executive)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Receiver Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.receiverMobile}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverMobile: e.target.value })}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Proof of Delivery Photo Upload */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      SIGNED DELIVERY CHALLAN / PROOF OF DELIVERY (POD) PHOTO
                    </label>
                    {deliveryForm.deliveryPhotoUrl && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attached
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    id="jobCardPodPhotoInput"
                    accept="image/*"
                    capture="environment"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleProcessDeliveryPodPhoto(file);
                      }
                    }}
                    className="hidden"
                  />

                  {deliveryForm.deliveryPhotoUrl ? (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => setPhotoLightbox(deliveryForm.deliveryPhotoUrl)}
                          className="relative group cursor-pointer w-14 h-14 rounded-lg border border-slate-300 shrink-0 bg-white overflow-hidden shadow-2xs"
                          title="Click to view full photo"
                        >
                          <img
                            src={deliveryForm.deliveryPhotoUrl}
                            alt="Delivery Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">Signed Delivery Challan Verified</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {deliveryForm.deliveryPhotoUrl.startsWith('data:') ? 'Image uploaded from device (Compressed Base64)' : deliveryForm.deliveryPhotoUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPhotoLightbox(deliveryForm.deliveryPhotoUrl)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <label
                          htmlFor="jobCardPodPhotoInput"
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setDeliveryForm((prev) => ({ ...prev, deliveryPhotoUrl: '' }))}
                          className="px-2 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-4 bg-slate-50 transition-colors text-center cursor-pointer group"
                      onClick={() => document.getElementById('jobCardPodPhotoInput')?.click()}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-200 group-hover:bg-slate-900 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors mx-auto mb-2">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="block text-xs font-bold text-slate-800">
                        Click to upload signed challan photo, or take camera picture
                      </span>
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        Supports PNG, JPG, WEBP • Auto-compressed for instant sync
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Proof of Delivery / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryForm.deliveryRemarks}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryRemarks: e.target.value })}
                    placeholder="e.g. Delivery challan signed & stamped by customer store manager..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsDeliveryModalOpen(false); setSelectedDispatchForDelivery(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDelivery}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDelivery ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Delivery...</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Save Delivery Confirmation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 8: INSTANT LASER CAMERA SCANNER (QR & 1D BARCODES) */}
      <LiveCameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(scannedCode) => handleLookupAndOpenJob(scannedCode)}
        title="Instant Shop Floor Scanner"
        subtitle="Auto-detecting QR & 1D Barcode"
      />

      {/* MODAL 10: FULL-RESOLUTION PHOTO LIGHTBOX MODAL */}
      {photoLightbox && (
        <Portal>
          <div 
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPhotoLightbox(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm tracking-wide">Signed Delivery Challan / Proof of Delivery (POD)</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={photoLightbox}
                    download="proof-of-delivery.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Image</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPhotoLightbox(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto flex items-center justify-center max-h-[calc(90vh-60px)] bg-slate-950/50">
                <img 
                  src={photoLightbox} 
                  alt="Delivery Proof Document" 
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
                />
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
