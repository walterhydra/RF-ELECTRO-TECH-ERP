'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DashboardHeader 
} from '@/components/dashboard/DashboardHeader';
import { 
  KpiMetricsGrid 
} from '@/components/dashboard/KpiMetricsGrid';
import { 
  ProductionTargetCard 
} from '@/components/dashboard/ProductionTargetCard';
import { 
  DeptProductionBarChart 
} from '@/components/dashboard/DeptProductionBarChart';
import { 
  DeptProductionTable 
} from '@/components/dashboard/DeptProductionTable';
import { 
  MachineBreakdownTable 
} from '@/components/dashboard/MachineBreakdownTable';
import { 
  JobHoldTable 
} from '@/components/dashboard/JobHoldTable';
import { 
  ManagementAlertsCard 
} from '@/components/dashboard/ManagementAlertsCard';
import { 
  JobMovementPipeline 
} from '@/components/dashboard/JobMovementPipeline';
import { 
  fetchLiveProductionDashboard, 
  fallbackDashboardData, 
  LiveDashboardData 
} from '@/services/dashboardService';

export default function LiveProductionDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<LiveDashboardData>(fallbackDashboardData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedShift, setSelectedShift] = useState<string>('A Shift');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const holdDetailsRef = useRef<HTMLDivElement>(null);
  const breakdownDetailsRef = useRef<HTMLDivElement>(null);

  // Load live data from API
  const loadDashboardData = async (shiftToUse?: string) => {
    setIsLoading(true);
    try {
      const activeShift = shiftToUse || selectedShift;
      const result = await fetchLiveProductionDashboard(activeShift);
      if (result) {
        setData(result);
        setSelectedShift(result.shift);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Dashboard data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 25-Second Auto-refresh live pulse for TV screens & shop-floor dashboards
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 25000);
    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, selectedShift]);

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    loadDashboardData(newShift);
  };

  const scrollToHoldDetails = () => {
    if (holdDetailsRef.current) {
      holdDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToBreakdownDetails = () => {
    if (breakdownDetailsRef.current) {
      breakdownDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1720px] mx-auto">
      {/* 1. TOP HEADER */}
      <DashboardHeader
        shift={selectedShift}
        onShiftChange={handleShiftChange}
        onRefresh={() => loadDashboardData()}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        isAutoRefreshEnabled={isAutoRefreshEnabled}
        onToggleAutoRefresh={() => setIsAutoRefreshEnabled(prev => !prev)}
      />

      {/* 2. TOP 7 KPI CARDS */}
      <KpiMetricsGrid
        kpis={data.kpis}
        onSelectHoldDetails={scrollToHoldDetails}
        onSelectBreakdownDetails={scrollToBreakdownDetails}
      />

      {/* 3. SECTION C: PRODUCTION GAUGE & LIVE DEPT BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Today's Production vs Target Card */}
        <div className="lg:col-span-5">
          <ProductionTargetCard data={data.productionGauge} />
        </div>

        {/* Right: Department-wise Production Bar Chart */}
        <div className="lg:col-span-7">
          <DeptProductionBarChart data={data.deptProductionBarChart} />
        </div>
      </div>

      {/* 4. SECTION D: 3-COLUMN MIDDLE GRID (Tables & Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Department-wise Live Production Table (5 Columns) */}
        <div className="lg:col-span-5">
          <DeptProductionTable data={data.deptProductionTable} />
        </div>

        {/* Center: Live Machine Breakdown Table & Job Hold Details Table (4 Columns) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div ref={breakdownDetailsRef} className="flex-1">
            <MachineBreakdownTable data={data.machineBreakdowns} />
          </div>
          <div ref={holdDetailsRef} className="flex-1">
            <JobHoldTable data={data.jobHoldDetails} />
          </div>
        </div>

        {/* Right: Management Alerts Card (3 Columns) */}
        <div className="lg:col-span-3">
          <ManagementAlertsCard alerts={data.managementAlerts} />
        </div>
      </div>

      {/* 5. SECTION E: BOTTOM PIPELINE ("Job Movement - Live Status") */}
      <JobMovementPipeline
        stages={data.pipelineStages}
        todayDispatchedSqm={data.todayDispatchedSqm}
      />
    </div>
  );
}
