"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Plus,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Package,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);

  // Forms
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

      if (dispRes.ok) setDispatches(await dispRes.json());
      if (jobRes.ok) {
        const allJobCards = await jobRes.json();
        setJobCards(
          allJobCards.filter(
            (jc: any) =>
              jc.status === "COMPLETED" || jc.status === "READY_FOR_DISPATCH",
          ),
        );
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
      if (!res.ok) throw new Error("Failed to create dispatch");

      setIsDispatchModalOpen(false);
      setDispatchForm({
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
      fetchData();
    } catch (error) {
      alert(error);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
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
      if (!res.ok) throw new Error("Failed to update delivery status");

      setIsDeliveryModalOpen(false);
      setSelectedDispatch(null);
      setDeliveryForm({
        deliveryStatus: "DELIVERED",
        receiverName: "",
        receiverMobile: "",
        deliveryPhotoUrl: "",
        deliveryRemarks: "",
        failureReason: "",
      });
      fetchData();
    } catch (error) {
      alert(error);
    }
  };

  const filteredDispatches = dispatches.filter(
    (d) =>
      d.dispatchNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.jobCard?.jobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
              Dispatch & Delivery
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              MANAGE OUTBOUND SHIPMENTS AND DELIVERY CONFIRMATIONS
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDispatchModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Dispatch
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by Dispatch No or Job Card No..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-900 placeholder-slate-400 w-full focus:outline-none"
        />
      </div>

      {/* Dispatches List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-sm">
            Loading dispatches...
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <p className="font-mono text-sm">No dispatches found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-4 px-6">Dispatch Details</th>
                  <th className="py-4 px-6">Logistics</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDispatches.map((dispatch) => (
                  <tr
                    key={dispatch.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-blue-600">
                        {dispatch.dispatchNo}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        JC: {dispatch.jobCard?.jobCardNo}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {format(new Date(dispatch.createdAt), "PPp")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-slate-700">
                        {dispatch.courierName ||
                          dispatch.deliveryPartner ||
                          "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Trk: {dispatch.trackingLrNo || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                        <MapPin className="h-3 w-3" /> {dispatch.destination}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {dispatch.deliveryStatus === "DISPATCHED" && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[11px] uppercase tracking-wider">
                          Dispatched
                        </span>
                      )}
                      {dispatch.deliveryStatus === "DELIVERED" && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-bold text-[11px] uppercase tracking-wider">
                          Delivered
                        </span>
                      )}
                      {dispatch.deliveryStatus === "FAILED" && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md font-bold text-[11px] uppercase tracking-wider">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {dispatch.deliveryStatus === "DISPATCHED" && (
                        <button
                          onClick={() => {
                            setSelectedDispatch(dispatch);
                            setIsDeliveryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-bold"
                        >
                          Confirm Delivery
                        </button>
                      )}
                      {dispatch.deliveryStatus === "DELIVERED" && (
                        <div className="text-green-600 text-[11px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                          <CheckCircle className="h-4 w-4" /> Completed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Dispatch
              </h2>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateDispatch} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Job Card
                  </label>
                  <select
                    required
                    value={dispatchForm.jobCardId}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        jobCardId: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">Select ready Job Card</option>
                    {jobCards.map((jc) => (
                      <option key={jc.id} value={jc.id}>
                        {jc.jobCardNo} - Qty: {jc.totalQty}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Dispatch Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={dispatchForm.dispatchedQty}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        dispatchedQty: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.destination}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        destination: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Delivery Partner / Courier
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.deliveryPartner}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        deliveryPartner: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Tracking / LR Number
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.trackingLrNo}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        trackingLrNo: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Vehicle No
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.vehicleNo}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        vehicleNo: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.driverName}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        driverName: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Remarks
                  </label>
                  <textarea
                    value={dispatchForm.dispatchRemarks}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        dispatchRemarks: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold shadow-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-sm rounded-xl"
                >
                  Create Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                Confirm Delivery
              </h2>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                  Status
                </label>
                <select
                  value={deliveryForm.deliveryStatus}
                  onChange={(e) =>
                    setDeliveryForm({
                      ...deliveryForm,
                      deliveryStatus: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="DELIVERED">Delivered Successfully</option>
                  <option value="FAILED">Delivery Failed</option>
                </select>
              </div>

              {deliveryForm.deliveryStatus === "DELIVERED" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                        Receiver Name
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryForm.receiverName}
                        onChange={(e) =>
                          setDeliveryForm({
                            ...deliveryForm,
                            receiverName: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                        Receiver Mobile
                      </label>
                      <input
                        type="text"
                        value={deliveryForm.receiverMobile}
                        onChange={(e) =>
                          setDeliveryForm({
                            ...deliveryForm,
                            receiverMobile: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                      Delivery Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={deliveryForm.deliveryPhotoUrl}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          deliveryPhotoUrl: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                    Failure Reason
                  </label>
                  <textarea
                    required
                    value={deliveryForm.failureReason}
                    onChange={(e) =>
                      setDeliveryForm({
                        ...deliveryForm,
                        failureReason: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">
                  Remarks
                </label>
                <textarea
                  value={deliveryForm.deliveryRemarks}
                  onChange={(e) =>
                    setDeliveryForm({
                      ...deliveryForm,
                      deliveryRemarks: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold shadow-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-sm rounded-xl"
                >
                  Save Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
