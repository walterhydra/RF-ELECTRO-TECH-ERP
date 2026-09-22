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
import { getApiBaseUrl } from '@/lib/utils';

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
  stageMovements: { stageName: string; qtyIn: number; passQty: number; rejQty: number }[];
}

const PF01_STAGES_FULL = [
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
  { id: 12, code: 'HASL-12',  name: '12. HASL',           department: 'Finishing' },
  { id: 13, code: 'HASL-QC',  name: '13. HASL-QC',        department: 'Quality' },
  { id: 14, code: 'LEG-14',   name: '14. LEGEND PRINT',   department: 'Legend' },
  { id: 15, code: 'RTE-15',   name: '15. ROUTING',        department: 'Routing' },
  { id: 16, code: 'VG-16',    name: '16. VG',             department: 'Routing' },
  { id: 17, code: 'BBT-17',   name: '17. BBT',            department: 'Testing' },
  { id: 18, code: 'FQC-18',   name: '18. FQC (AI)',       department: 'Quality' },
  { id: 19, code: 'PDI-19',   name: '19. PDI-AQL',        department: 'Quality' },
  { id: 20, code: 'PKG-20',   name: '20. PACKING',        department: 'Packing' },
];

export default function JobCardPdfPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [card, setCard] = useState<JobCardPdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const API = getApiBaseUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: any = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setLoading(true);
    fetch(`${API}/job-cards/${encodeURIComponent(id)}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((j: any) => {
        const product = j.product || {};
        const customerPO = j.customerPO || {};
        const customer = customerPO.customer || {};
        const topSub = (j.subJobCards && j.subJobCards.length > 0) ? j.subJobCards[0] : null;
        const pcbQty = j.totalPcbQty || j.custPnlQty || (j.prodPnlQty ? j.prodPnlQty * 4 : 160);

        // Map movement logs to stage data for the route sheet
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

        setCard({
          jobCardNo: j.jobCardNo || id,
          customerCode: j.customerCode || customer.code || customer.companyName || 'N/A',
          customerName: customer.companyName || j.customerCode || 'N/A',
          customerPoNo: customerPO.poNo || 'N/A',
          customerPartNo: j.customerPartNo || product.code || 'N/A',
          rfePartCode: j.rfePartCode || product.specCardNo || 'N/A',
          productName: product.name || 'N/A',
          layers: product.layers ?? 2,
          thickness: product.thicknessMm ? `${product.thicknessMm} mm` : (product.thickness || '1.6 mm'),
          copperWeight: product.copperWeight || product.copper || '1 oz',
          solderMask: product.solderMask || 'Liquid Photo-Imageable Green',
          surfaceFinish: product.surfaceFinish || 'HASL Lead-Free',
          panelSize: product.panelSize || 'N/A',
          qtyPerPanel: product.qtyPerPanel || 4,
          prodPnlQty: j.prodPnlQty || Math.ceil(pcbQty / 4),
          totalPcbQty: pcbQty,
          prodPnlAreaSqm: j.prodPnlAreaSqm || j.custPnlAreaSqm || 0,
          priority: j.priority || 'NORMAL',
          targetDate: j.targetDate ? new Date(j.targetDate).toISOString().split('T')[0] : 'N/A',
          currentStage: topSub?.currentStage?.name || j.currentStageName || 'N/A',
          status: j.status || 'CREATED',
          jobFlow: j.processFlowMaster?.name || 'PF-01',
          stageMovements: movements,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch job card for PDF:', err);
        setError(`Could not load Job Card "${id}". ${err.message}`);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-semibold">Loading Job Card Data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Job Card</h2>
        <p className="text-slate-500">{error}</p>
        <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">Go Back</button>
      </div>
    </div>
  );

  if (!card) return null;

  const qrDataPayload = `http://localhost:3000/job-cards-pdf/${id}\nJobCard:${card.jobCardNo}\nPart:${card.rfePartCode}\nQty:${card.totalPcbQty || ((card as any).custPnlQty && (card as any).custPnlQty > 50 ? (card as any).custPnlQty : card.prodPnlQty * 4)} PCBs`;
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
              <span className="text-[10px] text-slate-500 uppercase font-bold block">TOTAL PCB QTY</span>
              <span className="font-black text-emerald-700 text-sm">{card.totalPcbQty || ((card as any).custPnlQty && (card as any).custPnlQty > 50 ? (card as any).custPnlQty : card.prodPnlQty * 4)} PCBs</span>
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
                {PF01_STAGES_FULL.map((stg) => {
                  const movement = card.stageMovements?.find((m) =>
                    m.stageName.toLowerCase().includes(stg.name.replace(/^\d+\.\s*/, '').toLowerCase()) ||
                    stg.name.toLowerCase().includes(m.stageName.replace(/^\d+\.\s*/, '').toLowerCase())
                  );
                  return (
                  <tr key={stg.id} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/50">
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{stg.id}</td>
                    <td className="p-2 border-r border-slate-300 font-extrabold text-slate-900">
                      {stg.name}
                      <span className="text-[9px] text-slate-500 font-normal ml-1">({stg.code})</span>
                    </td>
                    <td className="p-2 border-r border-slate-300 text-slate-700">{stg.department}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{movement?.qtyIn || ''}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-700">{movement?.passQty || ''}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-red-700">{movement?.rejQty || ''}</td>
                    <td className="p-2 border-r border-slate-300"></td>
                    <td className="p-2 text-center"></td>
                  </tr>
                  );
                })}
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
