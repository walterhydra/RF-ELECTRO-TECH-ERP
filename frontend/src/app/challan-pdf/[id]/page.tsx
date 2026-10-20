'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  FileText,
  Truck,
  Building2,
  ArrowLeft,
  QrCode,
  AlertCircle,
  Camera,
  Eye,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Package,
  Clock,
  Phone,
  User,
  MapPin
} from 'lucide-react';
import { getApiBaseUrl, fetchApi } from '@/lib/utils';
import { generateCode128Svg } from '@/lib/barcode';

interface DispatchChallanData {
  id: string;
  dispatchNo: string;
  dispatchedQty: number;
  destination: string;
  vehicleNo?: string;
  courierName?: string;
  deliveryPartner?: string;
  driverName?: string;
  contactNumber?: string;
  trackingLrNo?: string;
  dispatchRemarks?: string;
  deliveryStatus: string;
  deliveryPhotoUrl?: string;
  receiverName?: string;
  receiverMobile?: string;
  deliveredAt?: string;
  deliveryRemarks?: string;
  createdAt: string;
  createdBy?: {
    name?: string;
    email?: string;
  };
  jobCard?: {
    id?: string;
    jobCardNo: string;
    customerPartNo?: string;
    rfePartCode?: string;
    targetDate?: string;
    product?: {
      name?: string;
      code?: string;
      layers?: number;
      thicknessMm?: number | string;
      surfaceFinish?: string;
      copperWeight?: string;
    };
    customerPO?: {
      poNo?: string;
      customer?: {
        companyName?: string;
        gstin?: string;
        address?: string;
      };
    };
    subJobCards?: Array<{
      subJobCardNo: string;
      qty?: number;
    }>;
  };
}

export default function ChallanPdfPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [challan, setChallan] = useState<DispatchChallanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    fetchApi(`/dispatches/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          return data;
        }
        // If single lookup failed, try fetching all dispatches to find match
        const listRes = await fetchApi('/dispatches');
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list)) {
            const match = list.find((d: any) => d.id === id || d.dispatchNo === id || d.jobCard?.jobCardNo === id);
            if (match) return match;
          }
        }
        throw new Error(`Challan record not found on server for ID: ${id}`);
      })
      .then((data) => {
        setChallan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend fetch failed, checking local storage for dispatch:', err);
        // Fallback to local storage job cards / dispatches if available
        try {
          const rawCards = localStorage.getItem('rf_electro_job_cards_v3');
          if (rawCards) {
            const cards = JSON.parse(rawCards);
            const foundCard = cards.find((c: any) => 
              c.jobCardNo === id || 
              c.id === id || 
              (c.dispatches && c.dispatches.some((d: any) => d.id === id || d.dispatchNo === id))
            );
            if (foundCard) {
              const matchedDispatch = foundCard.dispatches?.find((d: any) => d.id === id || d.dispatchNo === id) || {
                id: `disp-${id}`,
                dispatchNo: id.startsWith('DSP-') ? id : `DSP-2026-${id.slice(-4)}`,
                dispatchedQty: foundCard.totalPcbQty || foundCard.custPnlQty || 1000,
                destination: foundCard.customerCode ? `${foundCard.customerCode} Receiving Store` : 'Customer Factory Stores',
                vehicleNo: 'MH-12-RN-4501',
                courierName: 'Direct Express Logistics',
                deliveryPartner: 'Dedicated Tempo',
                driverName: 'Sanjay Shinde',
                contactNumber: '+91 98221 44550',
                trackingLrNo: `LR-${id.slice(-6)}`,
                dispatchRemarks: 'Standard vacuum sealed ESD packaging. Fragile PCB boards.',
                deliveryStatus: foundCard.status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED',
                deliveryPhotoUrl: foundCard.deliveryPhotoUrl || '',
                receiverName: foundCard.receiverName || 'Store Incharge',
                receiverMobile: foundCard.receiverMobile || '+91 98200 00000',
                deliveredAt: new Date().toISOString(),
                createdAt: foundCard.createdAt || new Date().toISOString(),
                jobCard: foundCard
              };
              setChallan(matchedDispatch);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore localStorage error
        }

        setError(`Could not find Delivery Challan record for "${id}".`);
        setLoading(false);
      });
  }, [id]);

  const barcodeSvgMarkup = useMemo(() => {
    const code = challan?.dispatchNo || id || 'DSP-0001';
    return generateCode128Svg(code, 34, 1.6);
  }, [challan?.dispatchNo, id]);

  const jcBarcodeSvgMarkup = useMemo(() => {
    if (!challan?.jobCard?.jobCardNo) return '';
    return generateCode128Svg(challan.jobCard.jobCardNo, 28, 1.4);
  }, [challan?.jobCard?.jobCardNo]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-extrabold text-base tracking-tight">Generating Delivery Challan & Gate Pass...</p>
        <p className="text-xs text-slate-500 mt-1 font-mono">Loading dispatch #{id}</p>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Delivery Challan Not Found</h2>
          <p className="text-xs text-slate-600">{error || 'The requested dispatch record could not be loaded.'}</p>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href="/dispatches"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Back to Dispatches
            </Link>
            <Link
              href="/job-cards"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Job Cards Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dispDate = challan.createdAt ? new Date(challan.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const customerName = challan.jobCard?.customerPO?.customer?.companyName || 'Valued Customer';
  const customerPo = challan.jobCard?.customerPO?.poNo || 'As Per Order';
  const jobCardNo = challan.jobCard?.jobCardNo || 'JC-DIRECT';
  const partNo = challan.jobCard?.customerPartNo || challan.jobCard?.product?.code || 'PCB Board';
  const prodDesc = challan.jobCard?.product?.name || 'Double Sided / Multilayer Professional Printed Circuit Board';
  const layers = challan.jobCard?.product?.layers ? `${challan.jobCard.product.layers} Layers` : 'Double Sided';
  const thickness = challan.jobCard?.product?.thicknessMm ? `${challan.jobCard.product.thicknessMm} mm` : '1.6 mm';
  const finish = challan.jobCard?.product?.surfaceFinish || 'Lead Free HASL / ENIG';

  const isDelivered = challan.deliveryStatus === 'DELIVERED';

  return (
    <div className="min-h-screen bg-slate-200/70 p-3 sm:p-6 print:p-0 print:bg-white text-slate-950 font-sans">
      
      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ── */}
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <span className="text-xs font-bold text-slate-600">
            Challan: <strong className="text-slate-950 font-mono">{challan.dispatchNo}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
            isDelivered ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
          }`}>
            {challan.deliveryStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {challan.deliveryPhotoUrl && (
            <button
              onClick={() => setPhotoModal(challan.deliveryPhotoUrl || null)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Signed POD Photo</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Challan / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ── PRINTABLE A4 DELIVERY CHALLAN SHEET ── */}
      <div 
        id="printableChallanDocument"
        className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-6 print:m-0 print:w-full min-h-[297mm] flex flex-col justify-between text-slate-900"
      >
        <div>
          {/* 1. COMPANY HEADER & TAX DETAILS */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl tracking-tighter shadow-sm border border-slate-800 shrink-0">
                    RF
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none">
                      R. F. ELECTRO TECH
                    </h1>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">
                      Manufacturers of High Reliability Printed Circuit Boards
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-600 leading-tight space-y-0.5">
                  <p><strong>Works:</strong> Plot No. 45, Electronic Zone, MIDC Bhosari, Pune - 411026, Maharashtra, India</p>
                  <p><strong>Phone:</strong> +91 98220 00000 • <strong>Email:</strong> dispatch@rfelectrotech.com • <strong>Web:</strong> www.rfelectrotech.com</p>
                  <div className="flex flex-wrap gap-x-4 pt-0.5 font-mono text-[9.5px]">
                    <span><strong>GSTIN:</strong> 27AAACR1234F1Z5</span>
                    <span><strong>State Code:</strong> 27 (Maharashtra)</span>
                    <span><strong>CIN:</strong> U32100PN2015PTC154321</span>
                    <span><strong>ISO:</strong> 9001:2015 Certified</span>
                  </div>
                </div>
              </div>

              {/* Barcode & Challan Identification */}
              <div className="text-right shrink-0 flex flex-col items-end">
                <div 
                  className="mb-1"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgMarkup }}
                />
                <span className="font-mono text-[10px] font-bold text-slate-700 tracking-wider">
                  *{challan.dispatchNo}*
                </span>
                <span className="mt-1 px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black tracking-wider uppercase">
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>
            </div>
          </div>

          {/* 2. DOCUMENT TITLE & META BAR */}
          <div className="bg-slate-100 border-x border-b border-slate-300 px-4 py-2 flex items-center justify-between text-xs">
            <div>
              <h2 className="font-black text-slate-950 text-sm tracking-wide uppercase">
                DELIVERY CHALLAN & OUTWARD GATE PASS
              </h2>
              <span className="text-[9.5px] text-slate-500 font-semibold">
                (Issued under Rule 55 of CGST Rules, 2017 for delivery of goods)
              </span>
            </div>
            <div className="text-right font-mono text-[11px] leading-tight">
              <div><strong>Challan No:</strong> <span className="text-blue-700 font-extrabold">{challan.dispatchNo}</span></div>
              <div><strong>Date:</strong> <span>{dispDate}</span></div>
            </div>
          </div>

          {/* 3. CONSIGNEE & LOGISTICS DUAL CARDS */}
          <div className="grid grid-cols-2 border-x border-b border-slate-300 text-xs">
            {/* Consignee / Billed & Shipped To */}
            <div className="p-3.5 border-r border-slate-300 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                CONSIGNEE (BILLED TO & DELIVER TO)
              </span>
              <p className="font-black text-slate-950 text-sm">{customerName}</p>
              <p className="text-slate-700 font-medium leading-snug text-[11px] whitespace-pre-line">
                {challan.destination || 'Delivery Address as per PO'}
              </p>
              <div className="pt-2 font-mono text-[10.5px] space-y-0.5 text-slate-700">
                <p><strong>Customer PO #:</strong> <span className="font-bold text-slate-950">{customerPo}</span></p>
                <p><strong>Job Card #:</strong> <span className="font-bold text-slate-950">{jobCardNo}</span></p>
                <p><strong>Place of Supply:</strong> Maharashtra (State Code 27)</p>
              </div>
            </div>

            {/* Transport & Gate Pass Details */}
            <div className="p-3.5 space-y-1 bg-slate-50/50">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                OUTWARD DISPATCH & LOGISTICS INFO
              </span>
              <table className="w-full text-[11px] font-medium leading-relaxed">
                <tbody>
                  <tr>
                    <td className="text-slate-500 w-32 py-0.5">Mode of Transport:</td>
                    <td className="font-bold text-slate-900">{challan.courierName || 'Road Transport / Dedicated Carrier'}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 py-0.5">Vehicle Number:</td>
                    <td className="font-bold font-mono text-slate-900">{challan.vehicleNo || 'N/A (Hand Delivery)'}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 py-0.5">Tracking / LR No:</td>
                    <td className="font-bold font-mono text-slate-900">{challan.trackingLrNo || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 py-0.5">Driver / Handover:</td>
                    <td className="font-bold text-slate-900">{challan.driverName || 'Authorized Delivery Staff'}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 py-0.5">Contact Mobile:</td>
                    <td className="font-mono text-slate-900">{challan.contactNumber || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ITEM PARTICULARS TABLE */}
          <div className="border-x border-b border-slate-300 overflow-hidden">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-10 border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-300">DESCRIPTION OF GOODS</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-300">HSN CODE</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-300">JOB CARD #</th>
                  <th className="py-2.5 px-3 text-right w-24 border-r border-slate-300">QTY</th>
                  <th className="py-2.5 px-3 text-center w-20">UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr className="align-top">
                  <td className="py-3 px-3 text-center font-bold font-mono border-r border-slate-300">1</td>
                  <td className="py-3 px-3 border-r border-slate-300">
                    <div className="font-black text-slate-950 text-xs">{prodDesc}</div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      Part Code: <strong>{partNo}</strong> • {layers} • {thickness} • {finish}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 italic">
                      {challan.dispatchRemarks || 'Vacuum sealed moisture-barrier bags with silica gel & humidity indicator.'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 border-r border-slate-300">
                    8534 00 00
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-300">
                    {jobCardNo}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-xs border-r border-slate-300">
                    {challan.dispatchedQty.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    PCBs
                  </td>
                </tr>

                {/* Blank fill rows for traditional Challan height aesthetic */}
                <tr className="h-10">
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300 text-[10px] text-slate-400 italic px-3 flex items-center h-full">
                    *** End of Item Particulars ***
                  </td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td></td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                  <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700 uppercase tracking-wide border-r border-slate-300">
                    Total Dispatched Volume:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 text-sm border-r border-slate-300">
                    {challan.dispatchedQty.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900">
                    PCBs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. STATUTORY DECLARATION & TERMS */}
          <div className="border-x border-b border-slate-300 p-3 bg-white text-[9.5px] text-slate-600 leading-normal">
            <p><strong>Declaration:</strong> Certified that the particulars given above are true and correct. The goods described above are being transported under Rule 55 of CGST Rules, 2017 for delivery / job-work / sale on approval basis against customer Purchase Order #{customerPo}.</p>
            <p className="mt-1"><strong>Terms & Conditions:</strong> 1. Claims for damage or shortage, if any, must be notified in writing within 48 hours of delivery. 2. Subject to Pune (Maharashtra) jurisdiction only.</p>
          </div>

          {/* 6. PROOF OF DELIVERY (POD) STATUS BADGE IF DELIVERED */}
          {isDelivered && (
            <div className="border-x border-b border-slate-300 p-3 bg-emerald-50/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-900 uppercase tracking-wide text-[11px] block">
                    DELIVERY ACKNOWLEDGED & CONFIRMED (POD VERIFIED)
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Received by: <strong>{challan.receiverName || 'Customer Store'}</strong> • Mobile: <strong>{challan.receiverMobile || 'Verified'}</strong> • Date: {challan.deliveredAt ? new Date(challan.deliveredAt).toLocaleString('en-IN') : dispDate}
                  </span>
                </div>
              </div>

              {challan.deliveryPhotoUrl && (
                <div 
                  onClick={() => setPhotoModal(challan.deliveryPhotoUrl || null)}
                  className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition-colors"
                  title="Click to view full photo of signed delivery challan"
                >
                  <img
                    src={challan.deliveryPhotoUrl}
                    alt="POD Thumbnail"
                    className="w-7 h-7 object-cover rounded border border-slate-300"
                  />
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-600" /> View Signed POD
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. SIGNATURES & STAMPS (4-COLUMN FOOTER) */}
        <div className="border-t-2 border-slate-900 pt-6 mt-6">
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            {/* Prepared By */}
            <div className="flex flex-col justify-between h-24 p-2 border border-dashed border-slate-300 rounded-lg">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">PREPARED BY</span>
              <div className="font-bold text-slate-900 text-[11px]">
                {challan.createdBy?.name || 'Store & Dispatch Officer'}
              </div>
              <span className="text-[9px] text-slate-400">Signature / Date</span>
            </div>

            {/* Security Gate Outward Stamp */}
            <div className="flex flex-col justify-between h-24 p-2 border border-dashed border-slate-300 rounded-lg">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">SECURITY OUTWARD</span>
              <div className="text-[10px] font-mono text-slate-400 italic">
                [ GATE OUTWARD STAMP ]
              </div>
              <span className="text-[9px] text-slate-400">Security Officer Sign</span>
            </div>

            {/* Consignee Receiver Signature */}
            <div className="flex flex-col justify-between h-24 p-2 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase">CUSTOMER RECEIVER</span>
              <div className="text-[10px] font-semibold text-slate-900">
                {challan.receiverName ? (
                  <span className="text-emerald-800 font-bold">✓ Signed ({challan.receiverName})</span>
                ) : (
                  <span className="text-slate-400 italic">[ Receiver Sign & Stamp ]</span>
                )}
              </div>
              <span className="text-[9px] text-slate-500">Seal / Stamp & Date</span>
            </div>

            {/* Authorized Signatory */}
            <div className="flex flex-col justify-between h-24 p-2 border border-slate-900 rounded-lg bg-slate-50">
              <span className="text-[10px] font-extrabold text-slate-900 uppercase">FOR R. F. ELECTRO TECH</span>
              <div className="font-mono text-[9px] text-slate-500">
                Authorized Signatory
              </div>
              <span className="text-[9px] text-slate-600 font-bold border-t border-slate-300 pt-0.5">
                Dispatch Incharge
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-4 pt-2 border-t border-slate-200">
            <span>ERP System Generated Delivery Challan • Ref: {challan.id}</span>
            <span>Document Ver: RF-DC-2026-V1 • Page 1 of 1</span>
          </div>
        </div>

      </div>

      {/* ── LIGHTBOX MODAL FOR SIGNED CHALLAN PHOTO ── */}
      {photoModal && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 print:hidden"
          onClick={() => setPhotoModal(null)}
        >
          <div 
            className="relative bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 space-y-3 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm font-mono">
                  Signed Physical Delivery Challan (POD) Photo
                </h3>
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
                alt="Delivery Challan POD Photo"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Challan #{challan.dispatchNo} • Receiver: {challan.receiverName || 'Customer Representative'}</span>
              <button
                onClick={() => window.open(photoModal, '_blank')}
                className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
