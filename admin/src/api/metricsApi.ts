import { apiFetch } from './client';

export interface OverviewMetrics {
  total_users: number;
  new_users_24h: number;
  new_users_7d: number;
  new_users_30d: number;
  premium_users: number;
  premium_rate: number;
  sessions_completed_total: number;
  active_challenges: number;
  /** null quando a migration 007 (reports.status) ainda não foi rodada */
  open_reports: number | null;
  user_growth: Array<{ day: string; new_users: number; total_users: number }>;
}

export const getOverview = () => apiFetch<OverviewMetrics>('/api/admin/metrics/overview');
