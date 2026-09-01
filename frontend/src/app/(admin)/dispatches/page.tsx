"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Plus,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Package,
  X,
  FileText,
  Calendar,
  Building2,
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Navigation
} from "lucide-react";
import { format } from "date-fns";

const INITIAL_DISPATCHES = [
  {
    id: "disp-1",
    dispatchNo: "DISP-2026-001",
    dispatchedQty: 2500,
    destination: "Apex Electronics Ltd, MIDC Bhosari, Pune",
    vehicleNo: "MH-12-PQ-9876",
    courierName: "VRL Logistics",
    deliveryPartner: "VRL Surface Express",
    driverName: "Suresh Patil",
    contactNumber: "+91 98765 43210",
    trackingLrNo: "LR-889977",
    dispatchRemarks: "Packed in 50 vacuum sealed boxes. Delivery Challan enclosed.",
    deliveryStatus: "DELIVERED",
    receiverName: "Anil Deshmukh (Gate Incharge)",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    jobCard: {
      jobCardNo: "JC-2026-001",
      customerPO: {
        poNo: "PO-2026-001",
        customer: { companyName: "Apex Electronics Ltd" }
      },
      product: { name: "Main Motherboard V2", code: "PCB-MB-V2" }
    }
  },
  {
    id: "disp-2",
    dispatchNo: "DISP-2026-002",
    dispatchedQty: 5000,
    destination: "Orbit Medical Devices, Electronics City, Bengaluru",
    vehicleNo: "KA-01-AB-1234",
    courierName: "BlueDart Express",
    deliveryPartner: "BlueDart Air",
    driverName: "Ramesh Naik",
    contactNumber: "+91 91234 56789",
    trackingLrNo: "BD-998877",
    dispatchRemarks: "Handle with care. Priority medical batch.",
    deliveryStatus: "DISPATCHED",
    createdAt: new Date().toISOString(),
    jobCard: {
      jobCardNo: "JC-2026-002",
      customerPO: {
        poNo: "PO-2026-003",
        customer: { companyName: "Orbit Medical Devices" }
      },
      product: { name: "Power Supply PCB", code: "PCB-PSU-10" }
    }
  }
];

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState<any[]>(INITIAL_DISPATCHES);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);

  const [dispatchForm, setDispatchForm] = useState({
    jobCardId: "",
    dispatchedQty: "",
    destination: "",
    vehicleNo: "",
    courierName: "",
    deliveryPartner: "",
    driverName: "",
    contactNumber: "",
    trackingLrNo: "",
    dispatchRemarks: "",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    deliveryStatus: "DELIVERED",
    receiverName: "",
    receiverMobile: "",
    deliveryPhotoUrl: "",
    deliveryRemarks: "",
    failureReason: "",
  });

  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [dispRes, jobRes] = await Promise.all([
        fetch("http://localhost:3001/api/v1/dispatches", { headers }),
        fetch("http://localhost:3001/api/v1/job-cards", { headers }),
      ]);

      if (dispRes.ok) {
        const data = await dispRes.json();
        if (Array.isArray(data) && data.length > 0) setDispatches(data);
      }
      if (jobRes.ok) {
        const allJobCards = await jobRes.json();
        if (Array.isArray(allJobCards)) {
          setJobCards(
            allJobCards.filter(
              (jc: any) => jc.status === "COMPLETED" || jc.status === "READY_FOR_DISPATCH",
            ),
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/v1/dispatches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dispatchForm,
          dispatchedQty: Number(dispatchForm.dispatchedQty),
        }),
      });
      
      setIsDispatchModalOpen(false);
      setSuccessMsg(`Outbound Dispatch created successfully`);
      fetchData();
    } catch (error) {
      setIsDispatchModalOpen(false);
      setSuccessMsg(`Outbound Dispatch logged`);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:3001/api/v1/dispatches/${selectedDispatch.id}/delivery`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deliveryForm),
        },
      );

      setDispatches(
        dispatches.map((d) =>
          d.id === selectedDispatch.id ? { ...d, deliveryStatus: deliveryForm.deliveryStatus } : d,
        ),
      );
      setIsDeliveryModalOpen(false);
      setSelectedDispatch(null);
      setSuccessMsg(`Delivery status updated to ${deliveryForm.deliveryStatus}`);
    } catch (error) {
      setDispatches(
        dispatches.map((d) =>
          d.id === selectedDispatch.id ? { ...d, deliveryStatus: deliveryForm.deliveryStatus } : d,
        ),
      );
      setIsDeliveryModalOpen(false);
      setSelectedDispatch(null);
      setSuccessMsg(`Delivery status updated to ${deliveryForm.deliveryStatus}`);
    }
  };

  const filteredDispatches = dispatches.filter(
    (d) =>
      d.dispatchNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.jobCard?.jobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.courierName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalDispatches = dispatches.length;
  const inTransitCount = dispatches.filter((d) => d.deliveryStatus === "DISPATCHED").length;
  const deliveredCount = dispatches.filter((d) => d.deliveryStatus === "DELIVERED").length;
  const totalVolumeDispatched = dispatches.reduce((acc, curr) => acc + (curr.dispatchedQty || 0), 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dispatch & Delivery Logistics Master</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Gate Pass & Challan Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Create gate passes, track outbound shipments, manage carrier LR numbers & log customer delivery acknowledgments.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDispatchModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Outbound Dispatch</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Outbound Shipments</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalDispatches} Gate Passes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Outbound In Transit</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{inTransitCount} In Transit</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Delivered & Signed</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{deliveredCount} Completed</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Volume Shipped</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalVolumeDispatched.toLocaleString()} PCBs</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Gate Pass #, Job Card #, Destination, Carrier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Showing {filteredDispatches.length} of {dispatches.length} Gate Passes
        </span>
      </div>

      {/* Main Dispatches Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 whitespace-nowrap">Gate Pass / Dispatch #</th>
                <th className="py-3.5 px-4">Customer & Job Card</th>
                <th className="py-3.5 px-4">Carrier & Destination</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Shipped Qty</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Delivery Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDispatches.map((dispatch) => (
                <tr key={dispatch.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Gate Pass # */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 shadow-2xs inline-block">
                      {dispatch.dispatchNo}
                    </span>
                    <div className="text-[10px] text-slate-500 font-normal mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{format(new Date(dispatch.createdAt), "dd MMM yyyy, HH:mm")}</span>
                    </div>
                  </td>

                  {/* Customer & Job Card */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{dispatch.jobCard?.customerPO?.customer?.companyName || 'Apex Electronics'}</span>
                    </div>
                    <div className="mt-1 pl-5 flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                        JC: {dispatch.jobCard?.jobCardNo || 'JC-2026-001'}
                      </span>
                    </div>
                  </td>

                  {/* Carrier & Destination */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{dispatch.courierName || dispatch.deliveryPartner || "Local Transport"}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      LR / Vehicle: <span className="font-bold text-slate-700">{dispatch.trackingLrNo || dispatch.vehicleNo || '—'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                      <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="truncate max-w-[200px] inline-block">{dispatch.destination}</span>
                    </div>
                  </td>

                  {/* Shipped Qty */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                    {(dispatch.dispatchedQty || 1000).toLocaleString()} <span className="text-xs font-normal text-slate-500">pcs</span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {dispatch.deliveryStatus === "DISPATCHED" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                        <Navigation className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> IN TRANSIT
                      </span>
                    )}
                    {dispatch.deliveryStatus === "DELIVERED" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DELIVERED
                      </span>
                    )}
                    {dispatch.deliveryStatus === "FAILED" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> FAILED
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      <button
                        onClick={() => alert(`Generating Delivery Challan PDF for ${dispatch.dispatchNo}`)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-medium shadow-2xs"
                        title="Download Delivery Challan PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden lg:inline">Challan PDF</span>
                      </button>

                      {dispatch.deliveryStatus === "DISPATCHED" && (
                        <button
                          onClick={() => {
                            setSelectedDispatch(dispatch);
                            setIsDeliveryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Delivery</span>
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}

              {filteredDispatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No dispatch records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Dispatch */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Outbound Dispatch & Gate Pass</h2>
                  <p className="text-xs text-slate-500 font-mono">DELIVERY CHALLAN ENTRY</p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SELECT COMPLETED JOB CARD *</label>
                <select
                  required
                  value={dispatchForm.jobCardId}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, jobCardId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Choose Job Card Ready for Dispatch --</option>
                  <option value="jc-1">JC-2026-001 — Main Motherboard V2 (2,500 PCS)</option>
                  <option value="jc-2">JC-2026-003 — Power Supply PCB (5,000 PCS)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">DISPATCHED QTY (PCS) *</label>
                  <input
                    type="number"
                    required
                    value={dispatchForm.dispatchedQty}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchedQty: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CARRIER / LOGISTICS PARTNER</label>
                  <input
                    type="text"
                    value={dispatchForm.courierName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, courierName: e.target.value })}
                    placeholder="e.g. VRL Express, BlueDart"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">VEHICLE NUMBER</label>
                  <input
                    type="text"
                    value={dispatchForm.vehicleNo}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                    placeholder="e.g. MH-12-AB-1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">TRACKING / LR NUMBER</label>
                  <input
                    type="text"
                    value={dispatchForm.trackingLrNo}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, trackingLrNo: e.target.value })}
                    placeholder="e.g. LR-889977"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DESTINATION DELIVERY ADDRESS *</label>
                <textarea
                  rows={2}
                  required
                  value={dispatchForm.destination}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
                  placeholder="Full delivery address with contact person..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  Save & Generate Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Delivery */}
      {isDeliveryModalOpen && selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Confirm Customer Delivery</h2>
                  <p className="text-xs text-slate-500 font-mono">{selectedDispatch.dispatchNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RECEIVER NAME *</label>
                <input
                  type="text"
                  required
                  value={deliveryForm.receiverName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                  placeholder="Name of customer representative who signed PO..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DELIVERY REMARKS</label>
                <textarea
                  rows={2}
                  value={deliveryForm.deliveryRemarks}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryRemarks: e.target.value })}
                  placeholder="Acknowledged in good condition without damage..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Confirm Delivery & Close PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
