import { apiFetch, apiSend, qs } from './client';
import type { AdminRole, Paged } from './adminApi';

export interface AdminUser {
  user_id: string;
  email: string | null;
  role: AdminRole;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  last_sign_in_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export const listAdmins = () => apiFetch<AdminUser[]>('/api/admin/admins');

export const grantAdmin = (email: string, role: AdminRole) =>
  apiSend<AdminUser>('/api/admin/admins', 'POST', { email, role });

export const revokeAdmin = (userId: string) => apiSend<{ user_id: string }>(`/api/admin/admins/${userId}`, 'DELETE');

export const listAuditLog = (params: { page: number; action?: string }) =>
  apiFetch<Paged<AuditLogEntry>>(`/api/admin/audit-log${qs(params)}`);
