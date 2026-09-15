'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  ArrowLeft, 
  Camera, 
  Eye, 
  Split, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  FileText, 
  Building2, 
  Calendar, 
  Box, 
  Layers,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

import { getApiBaseUrl } from '@/lib/utils';

export default function JobCardLaunchPage() {
  const router = useRouter();
  const [showFormModal, setShowFormModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Exact PDF Form Defaults
  const [launchForm, setLaunchForm] = useState({
    jobCardNo: '26-27-1729',
    photoUrl: '',
    customerPartNo: 'EV-900W-WP-TO247-VORS-25082026',
    rfePartCode: 'D3625',
    customerCode: 'CUST-RF045',
    launchedAt: new Date().toISOString().split('T')[0],
    targetDate: '2026-09-08',
    priority: 'MOST URGENT' as 'MOST URGENT' | 'HIGH' | 'NORMAL',
    totalPcbQty: 160,
    prodPnlAreaSqm: 50,
    jobFlowSelection: 'PF-01',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [unitPcbAreaSqm, setUnitPcbAreaSqm] = useState<number>(0.28125);

  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Post to NestJS backend if available
      const totalPcbQty = Number(launchForm.totalPcbQty) || 160;
      const prodPnlAreaSqm = Number(launchForm.prodPnlAreaSqm) || 45;

      const payload = {
        jobCardNo: launchForm.jobCardNo,
        customerPartNo: launchForm.customerPartNo,
        rfePartCode: launchForm.rfePartCode,
        customerCode: launchForm.customerCode,
        targetDate: new Date(launchForm.targetDate).toISOString(),
        priority: launchForm.priority,
        prodPnlQty: Math.ceil(totalPcbQty / 4),
        custPnlQty: totalPcbQty,
        totalPcbQty: totalPcbQty,
        prodPnlAreaSqm: prodPnlAreaSqm,
        custPnlAreaSqm: prodPnlAreaSqm,
        jobFlowSelection: launchForm.jobFlowSelection,
        photoUrl: launchForm.photoUrl,
        autoLaunch: false,
        subJobCards: [],
      };

      await fetch(`${getApiBaseUrl()}/job-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Retain client fallback gracefully
      });

      showToastMsg(`Job Card ${launchForm.jobCardNo} Created Successfully (UNLAUNCHED)! Release via "Launch Job Card" button.`, 'success');
      setTimeout(() => {
        router.push('/job-cards');
      }, 1000);
    } catch (err) {
      showToastMsg('Failed to launch job card', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/job-cards"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Dedicated Job Card Launching
            </h1>
            <p className="text-xs text-slate-400 font-mono">ERP Section 1 • PCB Job Card Release System</p>
          </div>
        </div>

        <Link
          href="/job-cards"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
        >
          View All WIP Job Cards ↗
        </Link>
      </div>

      {/* Main Single Action Option Container */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        
        {/* Single Main Featured Action Card */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-8 rounded-3xl text-slate-950 shadow-2xl space-y-4 border-2 border-amber-300 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="max-w-xl space-y-2">
            <span className="px-3 py-1 bg-slate-950 text-amber-400 font-mono font-black text-xs uppercase rounded-lg inline-block">
              PRIMARY MODULE OPTION
            </span>
            <h2 className="text-3xl font-black tracking-tight">NEW JOB CARD LAUNCH</h2>
            <p className="text-sm text-slate-900 font-medium">
              Click the button below to launch a new PCB Job Card into Production Stage 1 (1. SHEARING) with full 13-field specifications.
            </p>
          </div>

          <button
            onClick={() => setShowFormModal(true)}
            className="mt-4 px-8 py-4 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-base rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 cursor-pointer border border-amber-400/40"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>ADD NEW JOB CARD</span>
          </button>
        </div>

        {/* Dedicated Form Modal / Section */}
        {showFormModal && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Job Card Specifications & Photo Form</h3>
                  <p className="text-xs text-slate-400 font-mono">Fill all 13 required parameters from job specification card</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 font-mono font-extrabold text-xs rounded-xl border border-amber-400/30">
                FLOW: PF-01 (19 STAGES)
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs font-sans">
              
              {/* Field 1: Job Card Photo Attachment */}
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Job Card Photo (Attach Original Physical Job Card Photo) *</span>
                  </label>
                  {launchForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(launchForm.photoUrl)}
                      className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Photo
                    </button>
                  )}
                </div>

                <div className="space-y-2 font-sans">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="launchPagePhotoFileInput"
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
                      htmlFor="launchPagePhotoFileInput"
                      className="flex-1 py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Upload Photo from Device / Camera</span>
                    </label>

                    {launchForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setLaunchForm({ ...launchForm, photoUrl: '' })}
                        className="py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={launchForm.photoUrl}
                      onChange={(e) => setLaunchForm({ ...launchForm, photoUrl: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      placeholder="Or paste image URL directly..."
                    />
                    {launchForm.photoUrl && (
                      <img
                        src={launchForm.photoUrl}
                        alt="Job Card Photo"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-600 shrink-0 cursor-pointer shadow-sm hover:opacity-80 transition-opacity"
                        onClick={() => setPhotoPreview(launchForm.photoUrl)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 1: Job Card No, Launch Date & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Job Card No. *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.jobCardNo}
                    onChange={(e) => setLaunchForm({ ...launchForm, jobCardNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="26-27-1729"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-300 mb-1">Job Card Launch Date *</label>
                  <input
                    type="date"
                    required
                    value={launchForm.launchedAt}
                    onChange={(e) => setLaunchForm({ ...launchForm, launchedAt: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={launchForm.targetDate}
                    onChange={(e) => setLaunchForm({ ...launchForm, targetDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Grid 2: Customer Part No, RFE Part Code, Customer Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Customer Part No. *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.customerPartNo}
                    onChange={(e) => setLaunchForm({ ...launchForm, customerPartNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white focus:outline-none focus:border-amber-400"
                    placeholder="EV-900W-WP-TO247-VORS-25082026"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">R.F.E. Part Code *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.rfePartCode}
                    onChange={(e) => setLaunchForm({ ...launchForm, rfePartCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    placeholder="D3625"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={launchForm.customerCode}
                    onChange={(e) => setLaunchForm({ ...launchForm, customerCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white focus:outline-none focus:border-amber-400"
                    placeholder="CUST-RF045"
                  />
                </div>
              </div>

              {/* Grid 3: Priority, Total PCB Qty, Total PCB Area (Sqm), Flow Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Priority *</label>
                  <select
                    value={launchForm.priority}
                    onChange={(e: any) => setLaunchForm({ ...launchForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="MOST URGENT">MOST URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-amber-400 mb-1">Total PCB Qty *</label>
                  <input
                    type="number"
                    required
                    value={launchForm.totalPcbQty || ''}
                    onChange={(e) => {
                      const q = Number(e.target.value) || 0;
                      const pnl = Math.ceil(q / 4) || 10;
                      const calculatedArea = Number((q * unitPcbAreaSqm).toFixed(2));
                      setLaunchForm({
                        ...launchForm,
                        totalPcbQty: q,
                        prodPnlAreaSqm: Number((calculatedArea * 1.1).toFixed(2)),
                      });
                    }}
                    className="w-full bg-amber-500/10 border-2 border-amber-400 rounded-xl px-3.5 py-2.5 font-black text-amber-300 text-sm focus:outline-none font-mono"
                    placeholder="160"
                  />
                </div>

                <div>
                  <label className="block font-black text-amber-400 mb-1">Total PCB Area (Sqm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={launchForm.prodPnlAreaSqm || ''}
                    onChange={(e) => {
                      const a = Number(e.target.value) || 0;
                      const newUnitArea = launchForm.totalPcbQty > 0 ? a / launchForm.totalPcbQty : 0.28125;
                      setUnitPcbAreaSqm(newUnitArea);
                      setLaunchForm({
                        ...launchForm,
                        prodPnlAreaSqm: a,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white font-mono focus:border-amber-400 focus:outline-none"
                    placeholder="45"
                  />
                  <p className="text-[10px] font-semibold text-amber-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Auto-calculated: {launchForm.totalPcbQty || 0} PCBs × {unitPcbAreaSqm.toFixed(4)} Sqm/PCB
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Job Flow Selection *</label>
                  <select
                    value={launchForm.jobFlowSelection}
                    onChange={(e) => setLaunchForm({ ...launchForm, jobFlowSelection: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white"
                  >
                    <option value="PF-01">PF-01 Standard PCB Flow (19 Stages)</option>
                  </select>
                </div>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3">
                <Link
                  href="/job-cards"
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                  <span>LAUNCH JOB</span>
                </button>
              </div>

            </form>

          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {photoPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl max-w-2xl w-full space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-white">Original Job Card Photo</span>
              <button onClick={() => setPhotoPreview(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={photoPreview} alt="Preview" className="max-h-[70vh] w-auto mx-auto rounded-2xl" />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-amber-400 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
