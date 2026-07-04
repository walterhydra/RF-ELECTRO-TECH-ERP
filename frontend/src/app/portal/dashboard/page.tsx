'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Activity, Package } from 'lucide-react';

export default function CustomerDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    activeOrders: 0,
    pendingQuantity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/v1/portal/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-400">Total Orders</h3>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{metrics.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Lifetime purchase orders</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-400">Active Orders</h3>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{metrics.activeOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Currently in production or transit</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-400">Pending Quantity</h3>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{metrics.pendingQuantity}</div>
            <p className="text-xs text-slate-500 mt-1">Total units waiting for delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
