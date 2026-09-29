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
  shortCode?: string;
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

const default11Stages = [
  { rank: 1, department: 'Shearing & Cutting', shortCode: 'SHEARING', color: '#3B82F6', targetSqm: 35, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 2, department: 'CNC Drilling', shortCode: 'DRILLING', color: '#10B981', targetSqm: 30, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 3, department: 'DML (Dry Film)', shortCode: 'DML', color: '#6366F1', targetSqm: 25, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 4, department: 'PTH / PIT (Plating)', shortCode: 'PIT', color: '#F59E0B', targetSqm: 25, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 5, department: 'EPL (Pattern Plating)', shortCode: 'EPL', color: '#EC4899', targetSqm: 20, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 6, department: 'SES (Etching & Strip)', shortCode: 'SES', color: '#8B5CF6', targetSqm: 20, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 7, department: 'PISM (Solder Mask)', shortCode: 'PISM', color: '#14B8A6', targetSqm: 22, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 8, department: 'LP / Legend Print', shortCode: 'LP', color: '#F97316', targetSqm: 18, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 9, department: 'HASL / Surface Finish', shortCode: 'HASL', color: '#06B6D4', targetSqm: 18, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 10, department: 'Routing & Profile (RT)', shortCode: 'RT', color: '#84CC16', targetSqm: 15, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
  { rank: 11, department: 'BBT & Testing', shortCode: 'BBT', color: '#E11D48', targetSqm: 12, todayProductionSqm: 0, achievementPercent: 0, runningJobs: 0, waitingJobs: 0, holdJobs: 0 },
];

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
  deptProductionBarChart: default11Stages.map(d => ({
    name: d.shortCode,
    fullName: d.department,
    sqm: d.todayProductionSqm,
    target: d.targetSqm,
    color: d.color,
  })),
  deptProductionTable: default11Stages,
  machineBreakdowns: [],
  jobHoldDetails: [],
  managementAlerts: [
    { type: 'BREAKDOWN', count: 0, label: 'Machine Breakdowns', severity: 'blue', icon: 'AlertTriangle' },
    { type: 'JOB_HOLD', count: 0, label: 'Jobs on Hold', severity: 'blue', icon: 'PauseCircle' },
    { type: 'BELOW_TARGET', count: 0, label: 'Stages Below Target', severity: 'yellow', icon: 'TrendingDown' },
    { type: 'QA_HOLD', count: 0, label: 'Quality Review Pending', severity: 'blue', icon: 'ShieldAlert' },
  ],
  pipelineStages: [
    ...default11Stages.map(d => ({
      name: d.shortCode,
      color: d.color,
      todaySqm: 0,
      running: 0,
      waiting: 0,
      hold: 0,
      isDispatch: false,
    })),
    {
      name: 'DISPATCH',
      color: '#059669',
      todaySqm: 0,
      running: 0,
      waiting: 0,
      hold: 0,
      isDispatch: true,
    }
  ],
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
