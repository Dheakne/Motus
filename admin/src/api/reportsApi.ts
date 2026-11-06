import { apiFetch, apiSend, qs } from './client';
import type { Paged } from './adminApi';

export type ReportStatus = 'open' | 'in_progress' | 'resolved';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Em aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

export interface Report {
  id: string;
  user_id: string | null;
  email: string;
  type: string;
  subject: string;
  description: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string | null;
}

export interface ReportsPage extends Paged<Report> {
  counts: Record<ReportStatus, number>;
}

export const listReports = (params: { status?: ReportStatus; page: number }) =>
  apiFetch<ReportsPage>(`/api/admin/reports${qs(params)}`);

export const updateReportStatus = (id: string, status: ReportStatus) =>
  apiSend<Report>(`/api/admin/reports/${id}`, 'PATCH', { status });
