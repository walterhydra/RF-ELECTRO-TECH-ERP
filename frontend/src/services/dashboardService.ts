import { getApiBaseUrl } from '@/lib/utils';

export interface KpiMetrics {
  monthRejectionPercent: number;
  monthRejectionTarget: number;
  monthProductionSqm: number;
  monthProductionTarget: number;
  monthDispatchedSqm: number;
  monthPendingDispatchSqm: number;
  todayProductionSqm: number;
  todayTargetMin: number;
  todayTargetMax: number;
  totalPendingWipSqm: number;
  totalPendingWipJobs: number;
  jobsOnHoldCount: number;
  machinesBreakdownCount: number;
}

export interface ProductionGaugeData {
  currentSqm: number;
  targetSqm: number;
  progressPercent: number;
  minTarget: number;
  maxTarget: number;
  requiredToAchieve: number;
  estimatedEodProduction: number;
}

export interface DeptBarChartItem {
  name: string;
  fullName: string;
  sqm: number;
  target: number;
  color: string;
}

export interface DeptProductionRow {
  rank: number;
  department: string;
  shortCode: string;
  color: string;
  todayProductionSqm: number;
  targetSqm: number;
  achievementPercent: number;
  runningJobs: number;
  waitingJobs: number;
  holdJobs: number;
}

export interface MachineBreakdownItem {
  id: string;
  machine: string;
  department: string;
  breakdownSince: string;
  duration: string;
  estimatedRunningTime: string;
  status: 'BREAKDOWN' | 'MAINTENANCE' | 'RUNNING';
  severity: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface JobHoldItem {
  jobCardNo: string;
  customer: string;
  job: string;
  qtyPnl: number;
  department: string;
  holdReason: string;
  since: string;
  responsible: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface ManagementAlertItem {
  type: string;
  count: number;
  label: string;
  severity: 'red' | 'yellow' | 'blue' | 'purple' | 'pink';
  icon: string;
}

export interface PipelineStageItem {
  name: string;
  color: string;
  todaySqm: number;
  running: number;
  waiting: number;
  hold: number;
  isDispatch?: boolean;
}

export interface LiveDashboardData {
  shift: string;
  timestamp: string;
  kpis: KpiMetrics;
  productionGauge: ProductionGaugeData;
  deptProductionBarChart: DeptBarChartItem[];
  deptProductionTable: DeptProductionRow[];
  machineBreakdowns: MachineBreakdownItem[];
  jobHoldDetails: JobHoldItem[];
  managementAlerts: ManagementAlertItem[];
  pipelineStages: PipelineStageItem[];
  todayDispatchedSqm: number;
}

// Initial clean state while live data is fetched from PostgreSQL database
export const fallbackDashboardData: LiveDashboardData = {
  shift: 'A Shift',
  timestamp: new Date().toISOString(),
  kpis: {
    monthRejectionPercent: 0,
    monthRejectionTarget: 2.0,
    monthProductionSqm: 0,
    monthProductionTarget: 4000,
    monthDispatchedSqm: 0,
    monthPendingDispatchSqm: 0,
    todayProductionSqm: 0,
    todayTargetMin: 150,
    todayTargetMax: 170,
    totalPendingWipSqm: 0,
    totalPendingWipJobs: 0,
    jobsOnHoldCount: 0,
    machinesBreakdownCount: 0,
  },
  productionGauge: {
    currentSqm: 0,
    targetSqm: 150,
    progressPercent: 0,
    minTarget: 150,
    maxTarget: 170,
    requiredToAchieve: 150,
    estimatedEodProduction: 0,
  },
  deptProductionBarChart: [],
  deptProductionTable: [],
  machineBreakdowns: [],
  jobHoldDetails: [],
  managementAlerts: [],
  pipelineStages: [],
  todayDispatchedSqm: 0,
};

export async function fetchLiveProductionDashboard(shift?: string): Promise<LiveDashboardData> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const query = shift ? `?shift=${encodeURIComponent(shift)}` : '';
    const res = await fetch(`${getApiBaseUrl()}/reports/live-production-dashboard${query}`, {
      headers: {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Live production dashboard API call failed, falling back to local dataset:', err);
  }
  return fallbackDashboardData;
}
