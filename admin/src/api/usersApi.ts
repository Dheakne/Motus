import { apiFetch, apiSend, qs } from './client';
import type { Paged } from './adminApi';

export interface UserListItem {
  user_id: string;
  email: string | null;
  display_name: string;
  full_name: string;
  level: number;
  total_points: number;
  is_premium: boolean;
  created_at: string;
}

export interface UserProfile extends Omit<UserListItem, 'email'> {
  email: string | null;
  last_sign_in_at: string | null;
  has_seen_tutus: boolean;
  consent_terms: boolean | null;
  consent_health_data: boolean | null;
  consented_at: string | null;
  updated_at: string | null;
}

export interface UserSessionRow {
  id: string;
  completed: boolean;
  completed_at: string | null;
  points_earned: number;
  created_at: string;
  session: { id: number; title: string; category: string; duration: number } | null;
}

export interface ChallengeProgressRow {
  id: number;
  week_start: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  days_completed: number;
  updated_at: string | null;
  challenge: { id: number; title: string } | null;
}

export interface PremiumSubscription {
  id: string;
  /** stripe = pago; admin = liberado pelo painel */
  source: 'stripe' | 'admin';
  plan: 'monthly' | 'annual' | null;
  status: 'active' | 'past_due' | 'incomplete' | 'canceled';
  amount_cents: number | null;
  currency: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  started_at: string;
  canceled_at: string | null;
  granted_by: string | null;
}

export interface PremiumInfo {
  has_paid: boolean;
  has_admin_grant: boolean;
  subscriptions: PremiumSubscription[];
}

export interface UserDetail {
  profile: UserProfile;
  stats: { sessions_completed: number };
  premium: PremiumInfo;
  recent_sessions: UserSessionRow[];
  challenge_progress: ChallengeProgressRow[];
}

export type UserChanges = Partial<Pick<UserProfile, 'is_premium' | 'has_seen_tutus'>>;

export const listUsers = (params: { search?: string; page: number; pageSize?: number }) =>
  apiFetch<Paged<UserListItem>>(`/api/admin/users${qs(params)}`);

export const getUser = (id: string) => apiFetch<UserDetail>(`/api/admin/users/${id}`);

export const updateUser = (id: string, changes: UserChanges) =>
  apiSend<UserProfile & { premium: PremiumInfo }>(`/api/admin/users/${id}`, 'PATCH', changes);
