'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Calendar } from 'lucide-react';

export default function CustomerJobCards() {
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobCards() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/v1/portal/job-cards', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setJobCards(data);
        }
      } catch (error) {
        console.error('Failed to fetch job cards:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobCards();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400">Loading job cards...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-slate-500';
      case 'LAUNCHED': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-amber-500';
      case 'ON_HOLD': return 'bg-red-500';
      case 'COMPLETED': return 'bg-emerald-500';
      case 'READY_FOR_DISPATCH': return 'bg-teal-500';
      case 'DISPATCHED': return 'bg-indigo-500';
      case 'DELIVERED': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Job Cards & Progress</h1>
      
      {jobCards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <div className="text-slate-400">No active job cards found.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {jobCards.map((jc) => (
            <div key={jc.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{jc.jobCardNo}</h3>
                    <div className="text-sm text-slate-400 font-mono mt-1">PO: {jc.customerPO?.poNo}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(jc.status)}`}>
                    {jc.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Total Qty: {jc.totalQty}
                  </span>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-300">Product: {jc.product?.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">Code: {jc.product?.code}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Est. Delivery:</span>
                    <span className="font-bold text-white">
                      {jc.customerPO?.expectedDeliveryDate ? new Date(jc.customerPO.expectedDeliveryDate).toLocaleDateString() : 'TBD'}
                    </span>
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
