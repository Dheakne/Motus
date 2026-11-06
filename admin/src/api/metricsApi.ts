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
  /** null quando a migration 008 (reports.status) ainda não foi rodada */
  open_reports: number | null;
  user_growth: Array<{ day: string; new_users: number; total_users: number }>;
}

export const getOverview = () => apiFetch<OverviewMetrics>('/api/admin/metrics/overview');

export type EngagementRange = '7d' | '30d' | '90d';

export interface EngagementMetrics {
  range: EngagementRange;
  dau: Array<{ day: string; active_users: number }>;
  wau: number;
  mau: number;
  /** Média de dias marcados (0–7) por quem escolheu exercício na semana atual */
  avg_streak: number;
  weekly_participants: number;
  sessions_completed_by_day: Array<{ day: string; count: number }>;
}

export const getEngagement = (range: EngagementRange) =>
  apiFetch<EngagementMetrics>(`/api/admin/metrics/engagement?range=${range}`);
