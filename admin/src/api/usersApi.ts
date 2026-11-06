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
  session: { id: string; title: string; category: string; duration: number } | null;
}

export interface ChallengeProgressRow {
  id: string;
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
  challenge: { id: string; title: string } | null;
}

export interface UserDetail {
  profile: UserProfile;
  stats: { sessions_completed: number };
  recent_sessions: UserSessionRow[];
  challenge_progress: ChallengeProgressRow[];
}

export type UserChanges = Partial<Pick<UserProfile, 'is_premium' | 'has_seen_tutus'>>;

export const listUsers = (params: { search?: string; page: number; pageSize?: number }) =>
  apiFetch<Paged<UserListItem>>(`/api/admin/users${qs(params)}`);

export const getUser = (id: string) => apiFetch<UserDetail>(`/api/admin/users/${id}`);

export const updateUser = (id: string, changes: UserChanges) =>
  apiSend<UserProfile>(`/api/admin/users/${id}`, 'PATCH', changes);
