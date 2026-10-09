import { apiFetch } from './client';

export type AdminRole = 'admin' | 'superadmin';

export interface AdminMe {
  user_id: string;
  email: string;
  role: AdminRole;
}

export interface OverviewMetrics {
  total_users: number;
  premium_users: number;
  premium_rate: number;
}

export const getMe = () => apiFetch<AdminMe>('/api/admin/me');

export const getOverview = () => apiFetch<OverviewMetrics>('/api/admin/metrics/overview');
