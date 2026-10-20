'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  FileText,
  Layers,
  Cpu,
  Building2,
  Split,
  ArrowLeft,
  QrCode,
  AlertCircle,
  Camera,
  Eye,
  X,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';
import { generateCode128Svg } from '@/lib/barcode';

interface SubLotItem {
  id: string;
  subJobCardNo: string;
  totalPcbQty?: number;
  qty?: number;
}

interface ProcessStageItem {
  id: number;
  code: string;
  name: string;
  department: string;
}

interface JobCardPdfData {
  jobCardNo: string;
  customerCode: string;
  customerName: string;
  customerPoNo: string;
  customerPartNo: string;
  rfePartCode: string;
  productName: string;
  layers: number | string;
  thickness: string;
  copperWeight: string;
  solderMask: string;
  surfaceFinish: string;
  panelSize: string;
  qtyPerPanel: number | string;
  prodPnlQty: number | string;
  totalPcbQty: number | string;
  prodPnlAreaSqm: string;
  priority: string;
  targetDate: string;
  createdDate: string;
  currentStage: string;
  status: string;
  jobFlow: string;
  stages: ProcessStageItem[];
  subJobCards: SubLotItem[];
  stageMovements: { stageName: string; qtyIn: number; passQty: number; rejQty: number }[];
  photoUrl?: string;
}

const DEFAULT_PF01_STAGES: ProcessStageItem[] = [
  { id: 1,  code: 'SHR-01',   name: '1. SHEARING',       department: 'Pre-Production' },
  { id: 2,  code: 'DRL-02',   name: '2. DRILLING',        department: 'Drilling' },
  { id: 3,  code: 'DRL-QC',   name: '3. DRL-QC',          department: 'Quality' },
  { id: 4,  code: 'DML-04',   name: '4. DML',             department: 'Drilling' },
  { id: 5,  code: 'PIT-05',   name: '5. PIT',             department: 'Plating' },
  { id: 6,  code: 'PIT-QC',   name: '6. PIT-QC',          department: 'Quality' },
  { id: 7,  code: 'PLT-07',   name: '7. PLATING',         department: 'Plating' },
  { id: 8,  code: 'ETC-08',   name: '8. ETCHING',         department: 'Etch' },
  { id: 9,  code: 'PM-QC',    name: '9. PREMASK-QC/AOI',  department: 'Quality' },
  { id: 10, code: 'PISM-10',  name: '10. PISM',           department: 'Masking' },
  { id: 11, code: 'PISM-QC',  name: '11. PISM-QC',        department: 'Quality' },
  { id: 12, code: 'LEG-12',   name: '12. LEGEND PRINT',   department: 'Legend' },
  { id: 13, code: 'HASL-13',  name: '13. HASL',           department: 'Finishing' },
  { id: 14, code: 'HASL-QC',  name: '14. HASL-QC',        department: 'Quality' },
  { id: 15, code: 'RTE-15',   name: '15. ROUTING',        department: 'Routing' },
  { id: 16, code: 'VG-16',    name: '16. VG',             department: 'Routing' },
  { id: 17, code: 'BBT-17',   name: '17. BBT',            department: 'Testing' },
  { id: 18, code: 'FQC-18',   name: '18. FQC (AI)',       department: 'Quality' },
  { id: 19, code: 'PDI-19',   name: '19. PDI-AQL',        department: 'Quality' },
  { id: 20, code: 'PKG-20',   name: '20. PACKING',        department: 'Packing' },
];

export default function JobCardPdfPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [card, setCard] = useState<JobCardPdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const API = getApiBaseUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setLoading(true);
    fetch(`${API}/job-cards/${encodeURIComponent(id)}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then((j: any) => {
        const rawProduct = j.product || {};
        const customerPO = j.customerPO || {};
        const rawCustomer = customerPO.customer || {};
        const topSub = (j.subJobCards && j.subJobCards.length > 0) ? j.subJobCards[0] : null;

        // Prevent demo product leakage (e.g. Main Motherboard V2) onto custom job cards
        const isDemoProduct = rawProduct.name === 'Main Motherboard V2' && (!j.customerPartNo || j.customerPartNo !== 'PCB-MB-V2');
        const product = isDemoProduct ? {} : rawProduct;
        const customer = (isDemoProduct && rawCustomer.companyName === 'Acme Electronics Ltd' && !j.customerCode) ? {} : rawCustomer;

        // Total PCB Quantity strictly from genuine data
        const pcbQty = Number(j.totalPcbQty || j.custPnlQty || j.totalQty || 0);

        // Map live stage movements
        const movements: { stageName: string; qtyIn: number; passQty: number; rejQty: number }[] = [];
        if (j.subJobCards) {
          for (const sub of j.subJobCards) {
            const logs = sub.movements || sub.movementLogs || [];
            for (const log of logs) {
              const stageName = log.stage?.name || '';
              movements.push({
                stageName,
                qtyIn: log.qtyReceived || 0,
                passQty: log.qtyForwarded || 0,
                rejQty: log.qtyRejected || 0,
              });
            }
          }
        }

        // Production area & panels
        const rawArea = Number(j.prodPnlAreaSqm || j.custPnlAreaSqm || 0);
        const formattedArea = rawArea > 0 ? `${rawArea.toFixed(2)} SQM` : '—';

        // Display codes - strictly real data, fallback to clean dashes
        const displayPartNo = (j.customerPartNo && j.customerPartNo.trim() !== '') ? j.customerPartNo : (product.code || '—');
        const displayRfeCode = (j.rfePartCode && j.rfePartCode.trim() !== '') ? j.rfePartCode : (product.specCardNo || '—');
        const displayCustCode = (j.customerCode && j.customerCode.trim() !== '') ? j.customerCode : (customer.code || '—');
        const displayCustName = (customer.companyName && customer.companyName !== 'Acme Electronics Ltd')
          ? customer.companyName
          : ((j.customerCode && j.customerCode.trim() !== '') ? j.customerCode : '—');

        // Customer PO: NEVER leak seed demo PO 'PO-2026-001' when customer is unset or blank
        const isSeedDemoPo = customerPO.poNo === 'PO-2026-001' && (!j.customerCode || j.customerCode.trim() === '');
        const displayCustomerPoNo = (isSeedDemoPo || !customerPO.poNo)
          ? ((j.customerPoNo && j.customerPoNo.trim() !== '') ? j.customerPoNo : '—')
          : customerPO.poNo;

        // Product name
        const displayProdName = (product.name && product.name !== displayPartNo && product.name !== 'Main Motherboard V2')
          ? product.name
          : (displayPartNo !== '—' ? displayPartNo : '—');

        const displayLayers = product.layers ? Number(product.layers) : '—';
        const displayThickness = product.thicknessMm ? `${product.thicknessMm} mm` : (product.thickness || '—');
        const displayCopper = product.copperWeight || product.copper || '—';
        const displayMask = product.solderMask || '—';
        const displayFinish = product.surfaceFinish || '—';
        const displayPanelSize = product.panelSize || '—';
        const displayQtyPerPanel = product.qtyPerPanel ? Number(product.qtyPerPanel) : '—';
        const displayProdPnlQty = j.prodPnlQty ? Number(j.prodPnlQty) : '—';

        // Process stages from the specific Process Flow Master attached to this Job Card
        let stagesList: ProcessStageItem[] = DEFAULT_PF01_STAGES;
        if (j.processFlowMaster?.steps && Array.isArray(j.processFlowMaster.steps) && j.processFlowMaster.steps.length > 0) {
          stagesList = j.processFlowMaster.steps.map((st: any, idx: number) => ({
            id: st.stepOrder || idx + 1,
            code: st.stage?.code || `STG-${idx + 1}`,
            name: st.stage?.name || `Stage ${idx + 1}`,
            department: st.stage?.department?.name || 'Production',
          }));
        }

        setCard({
          jobCardNo: j.jobCardNo || id,
          customerCode: displayCustCode,
          customerName: displayCustName,
          customerPoNo: displayCustomerPoNo,
          customerPartNo: displayPartNo,
          rfePartCode: displayRfeCode,
          productName: displayProdName,
          layers: displayLayers,
          thickness: displayThickness,
          copperWeight: displayCopper,
          solderMask: displayMask,
          surfaceFinish: displayFinish,
          panelSize: displayPanelSize,
          qtyPerPanel: displayQtyPerPanel,
          prodPnlQty: displayProdPnlQty,
          totalPcbQty: pcbQty > 0 ? pcbQty : '—',
          prodPnlAreaSqm: formattedArea,
          priority: j.priority || 'NORMAL',
          targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : '—',
          createdDate: j.createdAt ? new Date(j.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          currentStage: topSub?.currentStage?.name || j.currentStageName || DEFAULT_PF01_STAGES[0].name,
          status: j.status || 'IN_PROGRESS',
          jobFlow: j.processFlowMaster?.name || 'PF-01 (Standard Rigid PCB)',
          stages: stagesList,
          subJobCards: j.subJobCards || [],
          stageMovements: movements,
          photoUrl: j.photoUrl || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch job card for PDF:', err);
        setError(`Could not load Job Card "${id}". ${err.message}`);
        setLoading(false);
      });
  }, [id]);

  // Live origin for QR codes
  const liveOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://api.rfgenix.com';

  const qrDataPayload = `${liveOrigin}/job-cards-pdf/${encodeURIComponent(id)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;

  const barcodeSvgMarkup = useMemo(() => {
    if (!card?.jobCardNo) return '';
    return generateCode128Svg(card.jobCardNo, 36, 1.8);
  }, [card?.jobCardNo]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-quicksand p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-slate-300 max-w-sm w-full">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-sm tracking-wide">Loading Route Traveler...</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving verified production specifications</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-quicksand">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center border border-slate-300">
          <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Job Traveler Record Not Found</h2>
          <p className="text-xs text-slate-600 mt-2">{error || 'The requested Job Card record could not be loaded.'}</p>
          <button
            onClick={() => router.push('/job-cards')}
            className="mt-6 px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
          >
            ← Return to Job Cards
          </button>
        </div>
      </div>
    );
  }

  const isUrgent = card.priority === 'MOST URGENT' || card.priority === 'HIGH';

  // Format Panels & Area cleanly
  const hasPanels = card.prodPnlQty !== '—';
  const hasArea = card.prodPnlAreaSqm !== '—';
  let panelsAreaDisplay = '—';
  if (hasPanels && hasArea) {
    panelsAreaDisplay = `${card.prodPnlQty} Panels • ${card.prodPnlAreaSqm}`;
  } else if (hasPanels) {
    panelsAreaDisplay = `${card.prodPnlQty} Panels`;
  } else if (hasArea) {
    panelsAreaDisplay = card.prodPnlAreaSqm;
  }

  return (
    <div className="min-h-screen bg-slate-950/90 text-slate-900 font-quicksand py-6 px-2 sm:px-4 print:p-0 print:bg-white print:m-0 relative overflow-x-hidden">
      
      {/* Ambient background lighting & blur effects behind the PDF sheet (hidden during print) */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl pointer-events-none -z-10 print:hidden" />
      <div className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none -z-10 print:hidden" />
      <div className="fixed -bottom-40 -right-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10 print:hidden" />

      {/* 1. TOP EXECUTIVE CONTROL BAR (Web-only, hidden in print) */}
      <div className="max-w-5xl mx-auto mb-5 bg-slate-900 text-white p-3.5 rounded-lg shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden backdrop-blur-md">
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
              Job Card No: <strong className="text-white font-mono">{card.jobCardNo}</strong> • Production Floor Copy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {card.photoUrl && (
            <button
              onClick={() => setPhotoModal(card.photoUrl || null)}
              className="px-3.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-blue-700 active:scale-95"
              title="View Attached Original Physical Job Card Photo"
            >
              <Camera className="w-3.5 h-3.5 text-blue-300" />
              <span>Original Photo</span>
            </button>
          )}

          <button
            onClick={() => router.push('/job-cards')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Job Cards</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded flex items-center gap-2 transition-all cursor-pointer border border-slate-300 shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-900 stroke-[2.2]" />
            <span>PRINT / SAVE AS PDF</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN PRINTABLE A4 INVOICE ROUTE SHEET */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-300 rounded-sm p-6 sm:p-8 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-4">
        
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
                {card.jobCardNo}
              </span>
            </div>
            <div className="px-3 py-1 bg-slate-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-600">Issue Date: <strong>{card.createdDate}</strong></span>
              <span className={`px-2 py-0.2 rounded font-bold uppercase text-[9px] border ${isUrgent ? 'border-red-400 bg-red-50 text-red-800' : 'border-slate-300 bg-white text-slate-800'}`}>
                {card.priority}
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
                  <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-[220px] text-[11px]">{card.customerName}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Customer Code</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{card.customerCode}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Purchase Order (PO) #</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{card.customerPoNo}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Customer Part No</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{card.customerPartNo}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">R.F.E. Part Code</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">{card.rfePartCode}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Target Completion</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{card.targetDate}</td>
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
                  <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-[220px] text-[11px]">{card.productName}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Layer Count & Thickness</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">
                    {card.layers !== '—' ? `${card.layers} Layers` : '—'}{card.thickness !== '—' ? ` • ${card.thickness}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Copper & Surface Finish</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">
                    {card.copperWeight !== '—' ? card.copperWeight : '—'}{card.surfaceFinish !== '—' ? ` • ${card.surfaceFinish}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Solder Mask</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{card.solderMask}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Total PCB Quantity</td>
                  <td className="py-1.5 px-3 font-bold text-slate-950 text-[12px]">
                    {typeof card.totalPcbQty === 'number' ? `${card.totalPcbQty} PCBs` : card.totalPcbQty}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 text-slate-600 font-semibold border-r border-slate-200 text-[11px]">Panels & WIP Area</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 text-[11px]">{panelsAreaDisplay}</td>
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
                Traceability Payload: {card.jobCardNo}
              </span>
            </div>
          </div>

          {/* Vector Code 128 Scannable Barcode */}
          <div className="text-center shrink-0 bg-white p-2.5 rounded border border-slate-300 min-w-[210px]">
            <div
              className="w-full flex items-center justify-center max-w-[210px] mx-auto overflow-hidden min-h-[38px]"
              dangerouslySetInnerHTML={{ __html: barcodeSvgMarkup }}
            />
            <span className="text-xs text-slate-900 font-mono font-bold tracking-widest block mt-1 select-all">
              *{card.jobCardNo}*
            </span>
          </div>

        </div>

        {/* SECTION 3: SUB-LOTS LIST (Only displayed when split sub-lots actually exist) */}
        {card.subJobCards && card.subJobCards.length > 1 && (
          <div className="border border-slate-300 rounded overflow-hidden bg-white text-xs">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Split className="w-3.5 h-3.5 text-slate-700" />
                SUB-LOT TRACEABILITY BREAKDOWN ({card.subJobCards.length} LOTS)
              </h3>
              <span className="text-[10px] font-bold text-slate-600">TOTAL BATCH: {card.totalPcbQty} PCBs</span>
            </div>
            <div className="divide-y divide-slate-200">
              {card.subJobCards.map((sub, idx) => (
                <div key={sub.id || idx} className="px-3 py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">LOT #{idx + 1}:</span>
                    <span className="font-mono font-bold text-slate-950">{sub.subJobCardNo}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {sub.totalPcbQty || sub.qty || (typeof card.totalPcbQty === 'number' ? Math.round(card.totalPcbQty / card.subJobCards.length) : '—')} PCBs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: PROCESS FLOW ROUTE SHEET TABLE (Clean Corporate Tabular Format) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              3. PROCESS FLOW ROUTE SHEET (STAGE MOVEMENTS & QUALITY GATES)
            </h3>
            <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Routing Flow: {card.jobFlow}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider print:bg-slate-800">
                  <th className="py-2 px-2 border-r border-slate-700 w-10 text-center">#</th>
                  <th className="py-2 px-3 border-r border-slate-700">STAGE NAME & CODE</th>
                  <th className="py-2 px-2.5 border-r border-slate-700 w-28">DEPARTMENT</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-16 text-center">QTY IN</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-16 text-center">PASS</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-16 text-center">REJ</th>
                  <th className="py-2 px-3 border-r border-slate-700 w-36 text-center">OPERATOR SIGN & DATE</th>
                  <th className="py-2 px-3 w-28 text-center">QC STAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {card.stages.map((stg) => {
                  const movement = card.stageMovements?.find((m) =>
                    m.stageName.toLowerCase().includes(stg.name.replace(/^\d+\.\s*/, '').toLowerCase()) ||
                    stg.name.toLowerCase().includes(m.stageName.replace(/^\d+\.\s*/, '').toLowerCase())
                  );
                  return (
                    <tr key={stg.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/40 transition-colors">
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-500 text-[11px]">
                        {stg.id}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {stg.name}
                        <span className="text-[10px] text-slate-500 font-mono font-medium ml-1.5">
                          ({stg.code})
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-600 text-[11px]">
                        {stg.department}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-900">
                        {movement?.qtyIn ? movement.qtyIn : ''}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-900">
                        {movement?.passQty ? movement.passQty : ''}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-700">
                        {movement?.rejQty ? movement.rejQty : ''}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 text-center">
                        {/* Space for physical shop floor ballpoint signature */}
                        <div className="h-5 border-b border-dashed border-slate-300 mx-auto w-full" />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {/* Space for physical QC inspection stamp */}
                        <div className="h-5 border-b border-dashed border-slate-300 mx-auto w-full" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: EXECUTIVE SIGN-OFF & AUTHORIZATION FOOTER */}
        <div className="border-t-2 border-slate-900 pt-4 mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-white border border-slate-300 rounded">
              <div className="h-9 border-b border-slate-400 mb-2" />
              <span className="font-bold text-slate-900 block text-[11px]">1. PREPARED BY (CAM / PPC)</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Signature & Release Date</span>
            </div>

            <div className="p-3 bg-white border border-slate-300 rounded">
              <div className="h-9 border-b border-slate-400 mb-2" />
              <span className="font-bold text-slate-900 block text-[11px]">2. PRODUCTION SUPERVISOR</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Floor Inward Acceptance</span>
            </div>

            <div className="p-3 bg-white border border-slate-300 rounded">
              <div className="h-9 border-b border-slate-400 mb-2" />
              <span className="font-bold text-slate-900 block text-[11px]">3. QUALITY ASSURANCE (QA) HEAD</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Final Inspection Clearance</span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-200">
            <p className="text-[10px] text-slate-500 font-medium">
              RF Electro Tech ERP • Official Shop Floor Manufacturing Route Traveler • IPC-A-600 & ISO 9001:2015 Compliant • This document must accompany the physical lot across all processes.
            </p>
          </div>
        </div>

      </div>

      {/* ORIGINAL PHYSICAL JOB CARD PHOTO LIGHTBOX MODAL */}
      {photoModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 space-y-3 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm font-mono">Original Hard Copy Physical Job Card Photo</h3>
              </div>
              <button
                onClick={() => setPhotoModal(null)}
                className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              <img
                src={photoModal}
                alt="Original Job Card High-Res Photo"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Verification copy for Job Card #{card.jobCardNo}</span>
              <button
                onClick={() => window.open(photoModal, '_blank')}
                className="text-blue-600 hover:underline font-bold"
              >
                Open Original Image ↗
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

