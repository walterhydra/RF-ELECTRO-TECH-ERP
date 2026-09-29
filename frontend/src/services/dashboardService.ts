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

// Fallback high-fidelity default data in case network is disconnected
export const fallbackDashboardData: LiveDashboardData = {
  shift: 'A Shift',
  timestamp: new Date().toISOString(),
  kpis: {
    monthRejectionPercent: 0.52,
    monthRejectionTarget: 2.0,
    monthProductionSqm: 1561,
    monthProductionTarget: 4000,
    monthDispatchedSqm: 1420,
    monthPendingDispatchSqm: 141,
    todayProductionSqm: 138,
    todayTargetMin: 150,
    todayTargetMax: 170,
    totalPendingWipSqm: 312,
    totalPendingWipJobs: 18,
    jobsOnHoldCount: 4,
    machinesBreakdownCount: 2,
  },
  productionGauge: {
    currentSqm: 138,
    targetSqm: 150,
    progressPercent: 92,
    minTarget: 150,
    maxTarget: 170,
    requiredToAchieve: 12,
    estimatedEodProduction: 162,
  },
  deptProductionBarChart: [
    { name: 'SHEARING', fullName: 'Shearing & Cutting', sqm: 32, target: 35, color: '#3B82F6' },
    { name: 'DRILLING', fullName: 'CNC Drilling', sqm: 28, target: 30, color: '#10B981' },
    { name: 'DML', fullName: 'DML (Dry Film)', sqm: 24, target: 25, color: '#6366F1' },
    { name: 'PIT', fullName: 'PTH / PIT (Plating)', sqm: 22, target: 25, color: '#F59E0B' },
    { name: 'PISM', fullName: 'PISM (Solder Mask)', sqm: 19, target: 22, color: '#14B8A6' },
    { name: 'EPL', fullName: 'EPL (Pattern Plating)', sqm: 18, target: 20, color: '#EC4899' },
    { name: 'SES', fullName: 'SES (Etching & Strip)', sqm: 17, target: 20, color: '#8B5CF6' },
    { name: 'LP', fullName: 'LP / Legend Print', sqm: 16, target: 18, color: '#F97316' },
    { name: 'HASL', fullName: 'HASL / Surface Finish', sqm: 15, target: 18, color: '#06B6D4' },
    { name: 'RT', fullName: 'Routing & Profile (RT)', sqm: 12, target: 15, color: '#84CC16' },
    { name: 'BBT', fullName: 'BBT & Testing', sqm: 6, target: 12, color: '#E11D48' },
  ],
  deptProductionTable: [
    { rank: 1, department: 'Shearing & Cutting', shortCode: 'SHEARING', color: '#3B82F6', todayProductionSqm: 32, targetSqm: 35, achievementPercent: 91, runningJobs: 4, waitingJobs: 2, holdJobs: 0 },
    { rank: 2, department: 'CNC Drilling', shortCode: 'DRILLING', color: '#10B981', todayProductionSqm: 28, targetSqm: 30, achievementPercent: 93, runningJobs: 3, waitingJobs: 1, holdJobs: 1 },
    { rank: 3, department: 'DML (Dry Film)', shortCode: 'DML', color: '#6366F1', todayProductionSqm: 24, targetSqm: 25, achievementPercent: 96, runningJobs: 2, waitingJobs: 3, holdJobs: 1 },
    { rank: 4, department: 'PTH / PIT (Plating)', shortCode: 'PIT', color: '#F59E0B', todayProductionSqm: 22, targetSqm: 25, achievementPercent: 88, runningJobs: 2, waitingJobs: 1, holdJobs: 0 },
    { rank: 5, department: 'PISM (Solder Mask)', shortCode: 'PISM', color: '#14B8A6', todayProductionSqm: 19, targetSqm: 22, achievementPercent: 86, runningJobs: 3, waitingJobs: 2, holdJobs: 1 },
    { rank: 6, department: 'EPL (Pattern Plating)', shortCode: 'EPL', color: '#EC4899', todayProductionSqm: 18, targetSqm: 20, achievementPercent: 90, runningJobs: 2, waitingJobs: 2, holdJobs: 0 },
    { rank: 7, department: 'SES (Etching & Strip)', shortCode: 'SES', color: '#8B5CF6', todayProductionSqm: 17, targetSqm: 20, achievementPercent: 85, runningJobs: 1, waitingJobs: 1, holdJobs: 0 },
    { rank: 8, department: 'LP / Legend Print', shortCode: 'LP', color: '#F97316', todayProductionSqm: 16, targetSqm: 18, achievementPercent: 89, runningJobs: 2, waitingJobs: 1, holdJobs: 0 },
    { rank: 9, department: 'HASL / Surface Finish', shortCode: 'HASL', color: '#06B6D4', todayProductionSqm: 15, targetSqm: 18, achievementPercent: 83, runningJobs: 2, waitingJobs: 1, holdJobs: 1 },
    { rank: 10, department: 'Routing & Profile (RT)', shortCode: 'RT', color: '#84CC16', todayProductionSqm: 12, targetSqm: 15, achievementPercent: 80, runningJobs: 1, waitingJobs: 2, holdJobs: 0 },
    { rank: 11, department: 'BBT & Testing', shortCode: 'BBT', color: '#E11D48', todayProductionSqm: 6, targetSqm: 12, achievementPercent: 50, runningJobs: 1, waitingJobs: 1, holdJobs: 0 },
  ],
  machineBreakdowns: [
    {
      id: 'M-DRL-02',
      machine: 'CNC Drilling M/C #02 (Posalux 4-Spindle)',
      department: 'CNC Drilling',
      breakdownSince: '08:30 AM (Today)',
      duration: '2h 18m',
      estimatedRunningTime: '11:45 AM',
      status: 'BREAKDOWN',
      severity: 'CRITICAL',
    },
    {
      id: 'M-SM-01',
      machine: 'Solder Mask Semi-Auto Coater #01',
      department: 'PISM (Solder Mask)',
      breakdownSince: '09:15 AM (Today)',
      duration: '1h 33m',
      estimatedRunningTime: '12:30 PM',
      status: 'BREAKDOWN',
      severity: 'HIGH',
    },
  ],
  jobHoldDetails: [
    {
      jobCardNo: '26-27-1636',
      customer: 'Schneider Electric',
      job: 'PWR-CTRL-REV4',
      qtyPnl: 45,
      department: 'CNC Drilling',
      holdReason: 'Hole Size Dia Deviation (> 0.05mm)',
      since: 'Yesterday 04:30 PM',
      responsible: 'QC / Tooling Lead',
      priority: 'HIGH',
    },
    {
      jobCardNo: '26-27-1420',
      customer: 'L&T Technology',
      job: 'INV-GATE-V2',
      qtyPnl: 80,
      department: 'PISM (Solder Mask)',
      holdReason: 'Customer Ink Color Approval Pending',
      since: 'Today 09:00 AM',
      responsible: 'Sales Executive',
      priority: 'NORMAL',
    },
    {
      jobCardNo: '26-27-1588',
      customer: 'Havells India',
      job: 'LED-DRV-120W',
      qtyPnl: 120,
      department: 'HASL',
      holdReason: 'Tin Thickness Low on SMT Pads',
      since: 'Today 09:40 AM',
      responsible: 'Process Chemist',
      priority: 'HIGH',
    },
    {
      jobCardNo: '26-27-1702',
      customer: 'Secure Meters',
      job: 'MTR-MB-4L',
      qtyPnl: 30,
      department: 'DML (Dry Film)',
      holdReason: 'Base Copper Scratches on Raw Panel',
      since: 'Today 10:10 AM',
      responsible: 'Store / Quality',
      priority: 'CRITICAL',
    },
  ],
  managementAlerts: [
    { type: 'BREAKDOWN', count: 2, label: 'Machine Breakdown', severity: 'red', icon: 'AlertTriangle' },
    { type: 'JOB_HOLD', count: 4, label: 'Job Hold', severity: 'red', icon: 'PauseCircle' },
    { type: 'BELOW_TARGET', count: 3, label: 'Production Below Target (3 Depts)', severity: 'yellow', icon: 'TrendingDown' },
    { type: 'QA_HOLD', count: 2, label: 'Quality Hold', severity: 'blue', icon: 'ShieldAlert' },
    { type: 'MAT_SHORTAGE', count: 1, label: 'Material Shortage (CEM-3 1.6mm)', severity: 'purple', icon: 'PackageX' },
    { type: 'CUST_APPROVAL', count: 1, label: 'Customer Approval Pending', severity: 'pink', icon: 'Clock' },
  ],
  pipelineStages: [
    { name: 'SHEARING', color: '#3B82F6', todaySqm: 32, running: 4, waiting: 2, hold: 0 },
    { name: 'DRILLING', color: '#10B981', todaySqm: 28, running: 3, waiting: 1, hold: 1 },
    { name: 'DML', color: '#6366F1', todaySqm: 24, running: 2, waiting: 3, hold: 1 },
    { name: 'PIT', color: '#F59E0B', todaySqm: 22, running: 2, waiting: 1, hold: 0 },
    { name: 'EPL', color: '#EC4899', todaySqm: 18, running: 2, waiting: 2, hold: 0 },
    { name: 'SES', color: '#8B5CF6', todaySqm: 17, running: 1, waiting: 1, hold: 0 },
    { name: 'PISM', color: '#14B8A6', todaySqm: 19, running: 3, waiting: 2, hold: 1 },
    { name: 'LP', color: '#F97316', todaySqm: 16, running: 2, waiting: 1, hold: 0 },
    { name: 'HASL', color: '#06B6D4', todaySqm: 15, running: 2, waiting: 1, hold: 1 },
    { name: 'RT', color: '#84CC16', todaySqm: 12, running: 1, waiting: 2, hold: 0 },
    { name: 'BBT', color: '#E11D48', todaySqm: 6, running: 1, waiting: 1, hold: 0 },
    { name: 'DISPATCH', color: '#059669', todaySqm: 121, running: 0, waiting: 0, hold: 0, isDispatch: true },
  ],
  todayDispatchedSqm: 121,
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
