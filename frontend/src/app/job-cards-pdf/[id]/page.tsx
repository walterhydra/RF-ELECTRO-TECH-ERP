'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Cpu,
  Calendar,
  Building2,
  Split,
  QrCode,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

interface JobCardPdfData {
  jobCardNo: string;
  customerCode: string;
  customerName: string;
  customerPoNo: string;
  customerPartNo: string;
  rfePartCode: string;
  productName: string;
  layers: number;
  thickness: string;
  copperWeight: string;
  solderMask: string;
  surfaceFinish: string;
  panelSize: string;
  qtyPerPanel: number;
  prodPnlQty: number;
  totalPcbQty: number;
  prodPnlAreaSqm: number;
  priority: string;
  targetDate: string;
  currentStage: string;
  status: string;
  jobFlow: string;
}

const PF01_STAGES_FULL = [
  { id: 1, code: 'SH-01', name: '1. SHEARING & CUTTING', department: 'Pre-Production' },
  { id: 2, code: 'DR-02', name: '2. CNC DRILLING', department: 'Drilling' },
  { id: 3, code: 'PTH-03', name: '3. DESMEAR & PTH PLATING', department: 'Plating' },
  { id: 4, code: 'IMG-04', name: '4. DRY FILM / PHOTO IMAGING', department: 'Imaging' },
  { id: 5, code: 'PAT-05', name: '5. PATTERN PLATING (CU & TIN)', department: 'Plating' },
  { id: 6, code: 'ETCH-06', name: '6. OUTER ETCHING & STRIPPING', department: 'Etch' },
  { id: 7, code: 'AOI-07', name: '7. AOI OPTICAL INSPECTION', department: 'Quality' },
  { id: 8, code: 'SM-08', name: '8. SOLDER MASK PRINTING', department: 'Masking' },
  { id: 9, code: 'SM-EXP', name: '9. SOLDER MASK EXPOSURE & DEV', department: 'Masking' },
  { id: 10, code: 'LEG-10', name: '10. LEGEND / SILKSCREEN PRINT', department: 'Legend' },
  { id: 11, code: 'BAKE-11', name: '11. FINAL CURE / BAKING', department: 'Baking' },
  { id: 12, code: 'SURF-12', name: '12. SURFACE FINISH (HASL/ENIG)', department: 'Finishing' },
  { id: 13, code: 'CNC-13', name: '13. CNC ROUTING / V-SCORING', department: 'Routing' },
  { id: 14, code: 'ETEST-14', name: '14. E-TESTING (FLYING PROBE/FIXTURE)', department: 'Testing' },
  { id: 15, code: 'FQC-15', name: '15. FINAL QC & DIMENSION CHECK', department: 'Quality' },
  { id: 16, code: 'MICRO-16', name: '16. MICRO-SECTION & SOLDERABILITY', department: 'Lab' },
  { id: 17, code: 'WASH-17', name: '17. ULTRASONIC WASHING & DRYING', department: 'Washing' },
  { id: 18, code: 'PACK-18', name: '18. VACUUM PACKAGING & LABELS', department: 'Packing' },
  { id: 19, code: 'FGS-19', name: '19. FGS STORE & DESPATCH', department: 'Dispatch' },
];

export default function JobCardPdfPage() {
  const params = useParams();
  const id = (params?.id as string) || 'jc-1';

  const [card, setCard] = useState<JobCardPdfData | null>(null);

  useEffect(() => {
    // Generate clean job card sheet data matching id or defaults
    const is30 = id.includes('1730');
    setCard({
      jobCardNo: is30 ? '26-27-1730' : '26-27-1729',
      customerCode: is30 ? 'CUST-RF019' : 'CUST-RF045',
      customerName: is30 ? 'PowerTech Systems Pvt Ltd' : 'Apex Electronics Ltd',
      customerPoNo: is30 ? 'PO-2026-003' : 'PO-2026-001',
      customerPartNo: is30 ? 'PSU-3KW-BOOSTER-REV03' : 'EV-900W-WP-TO247-VORS-25082026',
      rfePartCode: is30 ? 'D3633' : 'D3625',
      productName: is30 ? '3KW Booster Power Board' : 'Main Motherboard V2',
      layers: is30 ? 2 : 4,
      thickness: '1.6mm FR4 TG150',
      copperWeight: '1oz / 1oz Outer',
      solderMask: 'Liquid Photo-Imageable Green',
      surfaceFinish: 'HASL Lead-Free (RoHS)',
      panelSize: '450 x 600 mm',
      qtyPerPanel: is30 ? 4 : 4,
      prodPnlQty: is30 ? 60 : 40,
      totalPcbQty: is30 ? 240 : 160,
      prodPnlAreaSqm: is30 ? 75 : 50,
      priority: is30 ? 'HIGH' : 'MOST URGENT',
      targetDate: is30 ? '2026-09-20' : '2026-09-26',
      currentStage: is30 ? '1. SHEARING' : '2. DRILLING',
      status: is30 ? 'UNLAUNCHED' : 'IN_PROGRESS',
      jobFlow: 'PF-01 Standard Double-Sided Flow',
    });
  }, [id]);

  if (!card) return null;

  const qrDataPayload = `http://localhost:3000/job-cards-pdf/${id}\nJobCard:${card.jobCardNo}\nPart:${card.rfePartCode}\nQty:${card.prodPnlQty}PNL`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataPayload)}`;
  const barcodeImageUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(card.jobCardNo)}&scale=3&rotate=N&includetext`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-200 p-4 sm:p-8 font-sans text-slate-900 print:bg-white print:p-0">
      
      {/* Top Floating Control Bar (Hidden when printed) */}
      <div className="max-w-4xl mx-auto mb-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            PDF
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white">Job Card PDF Document Sheet</h1>
            <p className="text-xs text-slate-400 font-mono">Job Card #: {card.jobCardNo} • Ready for Print/Save</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT / SAVE AS PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable A4 PDF Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl print:border-none print:shadow-none print:p-4 print:rounded-none">
        
        {/* Document Header */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-xl border-2 border-amber-400 shadow-md">
              RFE
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-950">RF ELECTRO TECH ERP</h2>
              <p className="text-xs font-extrabold text-slate-600 tracking-widest font-mono uppercase">INDUSTRIAL PCB PRODUCTION ROUTE SHEET</p>
              <p className="text-[10px] text-slate-400 font-mono">Doc Ref: RFE-PCB-JOB-2026 • Quality Approved Document</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="bg-amber-400 text-slate-950 border-2 border-slate-900 px-3.5 py-1 rounded-xl font-mono font-black text-lg shadow-sm">
              {card.jobCardNo}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">PRIORITY:</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 font-black text-[10px] rounded border border-red-300 font-mono uppercase">
                {card.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Customer & Order Details */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            CUSTOMER & ORDER INFORMATION
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">CUSTOMER CODE</span>
              <span className="font-extrabold text-slate-900">{card.customerCode}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">CUSTOMER NAME</span>
              <span className="font-extrabold text-slate-900 truncate block">{card.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">PURCHASE ORDER #</span>
              <span className="font-black text-blue-700">{card.customerPoNo}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">TARGET DATE</span>
              <span className="font-extrabold text-red-700">{card.targetDate}</span>
            </div>

            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">CUSTOMER PART NO</span>
              <span className="font-black text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">{card.customerPartNo}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">R.F.E. PART CODE</span>
              <span className="font-black text-blue-800 text-sm">{card.rfePartCode}</span>
            </div>
          </div>
        </div>

        {/* Section 2: PCB Technical Specifications & Production Quantities */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-700" />
            TECHNICAL SPECIFICATIONS & QUANTITIES
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">PRODUCT NAME</span>
              <span className="font-extrabold text-slate-900">{card.productName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">LAYERS / THICKNESS</span>
              <span className="font-extrabold text-slate-900">{card.layers} L ({card.thickness})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">SURFACE FINISH</span>
              <span className="font-extrabold text-slate-900">{card.surfaceFinish}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">SOLDER MASK</span>
              <span className="font-extrabold text-slate-900">{card.solderMask}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">PANEL SIZE</span>
              <span className="font-extrabold text-slate-900">{card.panelSize}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">PROD PNL QTY</span>
              <span className="font-black text-blue-700 text-sm">{card.prodPnlQty} PNL</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">TOTAL PCB QTY</span>
              <span className="font-black text-emerald-700 text-sm">{card.totalPcbQty} PCS</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">TOTAL WIP AREA</span>
              <span className="font-black text-purple-700 text-sm">{card.prodPnlAreaSqm} SQM</span>
            </div>
          </div>
        </div>

        {/* Section 3: Scannable QR & Barcode Verification Block */}
        <div className="mb-6 bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:border print:border-black print:text-black print:bg-white">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center">
              <img src={qrImageUrl} alt="QR Code" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-400 print:text-black">LIVE DIGITAL SCANNABLE VERIFICATION</h4>
              <p className="text-xs text-slate-300 print:text-slate-700 mt-0.5">Scan with mobile camera to reload or verify live status of Job Card #{card.jobCardNo}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 print:text-emerald-800 rounded-lg text-[10px] font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED AUTHENTIC ERP DOCUMENT
              </div>
            </div>
          </div>

          <div className="text-center shrink-0 bg-white p-2.5 rounded-xl border border-slate-300">
            <img src={barcodeImageUrl} alt="Barcode" className="h-10 object-contain mx-auto" />
            <span className="text-[10px] font-mono text-slate-900 font-black tracking-widest block mt-1">*{card.jobCardNo}*</span>
          </div>
        </div>

        {/* Section 4: Process Flow Route Sheet Table (PF-01 19 Stages) */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3 flex items-center gap-2">
            <Split className="w-4 h-4 text-purple-700" />
            PROCESS FLOW ROUTE SHEET (PF-01 STAGE PROGRESS TRACKING)
          </h3>

          <div className="overflow-x-auto border-2 border-slate-900 rounded-xl">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-slate-950 text-white border-b-2 border-slate-900 print:bg-slate-200 print:text-black">
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400">STAGE NAME & CODE</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-24">DEPT</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-20 text-center">QTY IN</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-20 text-center">PASS QTY</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-20 text-center">REJ QTY</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-400 w-32">OPERATOR SIGN</th>
                  <th className="p-2 w-24 text-center">QC STAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {PF01_STAGES_FULL.map((stg) => (
                  <tr key={stg.id} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/50">
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{stg.id}</td>
                    <td className="p-2 border-r border-slate-300 font-extrabold text-slate-900">
                      {stg.name}
                      <span className="text-[9px] text-slate-500 font-normal ml-1">({stg.code})</span>
                    </td>
                    <td className="p-2 border-r border-slate-300 text-slate-700">{stg.department}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{stg.id === 1 || stg.id === 2 ? `${card.prodPnlQty}` : ''}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-700"></td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-red-700"></td>
                    <td className="p-2 border-r border-slate-300"></td>
                    <td className="p-2 text-center"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Authorization Block */}
        <div className="mt-8 border-t-2 border-slate-900 pt-6 grid grid-cols-3 gap-6 text-center text-xs font-mono">
          <div>
            <div className="h-12 border-b border-slate-400 mb-1" />
            <span className="font-extrabold text-slate-900">PREPARED BY (CAM / PPC)</span>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-1" />
            <span className="font-extrabold text-slate-900">PRODUCTION MANAGER SIGN</span>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-1" />
            <span className="font-extrabold text-slate-900">QUALITY HEAD STAMP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
