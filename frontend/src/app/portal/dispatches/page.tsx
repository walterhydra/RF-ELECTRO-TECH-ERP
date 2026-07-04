'use client';

import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Phone, User, Calendar } from 'lucide-react';

export default function CustomerDispatches() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDispatches() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/v1/portal/dispatches', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDispatches(data);
        }
      } catch (error) {
        console.error('Failed to fetch dispatches:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDispatches();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400">Loading dispatches...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPATCHED': return 'bg-blue-500';
      case 'IN_TRANSIT': return 'bg-amber-500';
      case 'DELIVERED': return 'bg-emerald-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dispatches & Delivery</h1>
      
      {dispatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <div className="text-slate-400">No dispatch records found.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {dispatches.map((dispatch) => (
            <div key={dispatch.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{dispatch.dispatchNo}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">Job Card: {dispatch.jobCard?.jobCardNo}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-300 font-medium">
                    Qty: {dispatch.dispatchedQty}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(dispatch.deliveryStatus)}`}>
                    {dispatch.deliveryStatus}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Logistics Info</h4>
                    
                    <div className="flex items-start gap-3 text-sm">
                      <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-xs">Courier / Partner</div>
                        <div className="text-white">{dispatch.courierName || dispatch.deliveryPartner || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-xs">Tracking / LR No.</div>
                        <div className="text-white font-mono">{dispatch.trackingLrNo || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-400 text-xs">Dispatched On</div>
                        <div className="text-white">{new Date(dispatch.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Delivery Status</h4>
                    
                    {dispatch.deliveryStatus === 'DELIVERED' ? (
                      <>
                        <div className="flex items-start gap-3 text-sm">
                          <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-slate-400 text-xs">Received By</div>
                            <div className="text-emerald-400 font-medium">{dispatch.receiverName || 'Signature Verified'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-slate-400 text-xs">Receiver Contact</div>
                            <div className="text-white font-mono">{dispatch.receiverMobile || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-slate-400 text-xs">Delivered At</div>
                            <div className="text-white">{new Date(dispatch.deliveredAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-400 italic">
                        {dispatch.deliveryStatus === 'FAILED' ? (
                          <span className="text-red-400 not-italic">Delivery Failed: {dispatch.failureReason}</span>
                        ) : (
                          'Awaiting delivery confirmation...'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
