import { apiFetch } from './client';

export type AdminRole = 'admin' | 'superadmin';

export interface AdminMe {
  user_id: string;
  email: string;
  role: AdminRole;
}

export const getMe = () => apiFetch<AdminMe>('/api/admin/me');

/** Resposta paginada padrão das listas do painel. */
export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
