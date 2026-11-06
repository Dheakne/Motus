import { apiFetch, apiSend, qs } from './client';
import { supabase } from '../auth/supabaseClient';

// ─── Sessões de áudio ────────────────────────────────────────────────

export type SessionCategory = 'gratidao' | 'atencao' | 'meditacao' | 'reflexao' | 'descanso';

export interface AudioSession {
  /** bigint no banco */
  id: number;
  title: string;
  /** Descrição curta (obrigatória no banco) */
  description: string;
  /** Texto longo opcional */
  full_description: string | null;
  /** Minutos */
  duration: number;
  audio_url: string;
  category: SessionCategory;
  category_id: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  completions: number;
}

export type SessionInput = Pick<
  AudioSession,
  'title' | 'description' | 'full_description' | 'duration' | 'audio_url' | 'category' | 'is_premium' | 'is_active'
>;

export type StatusFilter = 'active' | 'inactive' | 'all';

export const listSessions = (params: { category?: string; status?: StatusFilter }) =>
  apiFetch<AudioSession[]>(`/api/admin/content/sessions${qs(params)}`);

export const createSession = (input: SessionInput) =>
  apiSend<AudioSession>('/api/admin/content/sessions', 'POST', input);

export const updateSession = (id: number, changes: Partial<SessionInput>) =>
  apiSend<AudioSession>(`/api/admin/content/sessions/${id}`, 'PATCH', changes);

export const getSessionAudioUrl = (id: number) =>
  apiFetch<{ url: string }>(`/api/admin/content/sessions/${id}/audio-url`);

interface AudioUpload {
  bucket: string;
  path: string;
  token: string;
  public_url: string;
}

/** Limite padrão de arquivo do Supabase Storage no plano free */
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

/**
 * Envia o áudio direto do navegador para o Supabase Storage, com uma URL de upload
 * assinada pelo backend (a service key nunca chega aqui). Devolve a URL pública,
 * que é o que vai em sessions.audio_url (o app toca essa URL direto).
 */
export async function uploadAudio(file: File): Promise<string> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('Arquivo maior que 50 MB. Comprima o áudio antes de enviar.');
  }
  const upload = await apiSend<AudioUpload>('/api/admin/content/sessions/upload-url', 'POST', {
    filename: file.name,
    content_type: file.type,
  });

  const { error } = await supabase.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || 'audio/mpeg' });
  if (error) throw new Error(`Falha no upload do áudio: ${error.message}`);

  return upload.public_url;
}

/** Lê a duração do arquivo no navegador, em minutos arredondados para cima. */
export function readAudioMinutes(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? Math.max(1, Math.ceil(audio.duration / 60)) : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

// ─── Categorias ──────────────────────────────────────────────────────

export interface Category {
  id: string;
  title: string;
  /** Rótulo do card na Home (ex.: "Áudio") */
  description: string;
  color: string;
  icon_emoji: string;
  order: number;
  created_at: string;
  sessions_count: number;
}

export type CategoryInput = Pick<Category, 'title' | 'description' | 'color' | 'icon_emoji' | 'order'>;

export const listCategories = () => apiFetch<Category[]>('/api/admin/content/categories');

export const createCategory = (input: CategoryInput) =>
  apiSend<Category>('/api/admin/content/categories', 'POST', input);

export const updateCategory = (id: string, changes: Partial<CategoryInput>) =>
  apiSend<Category>(`/api/admin/content/categories/${id}`, 'PATCH', changes);

export const deleteCategory = (id: string) =>
  apiSend<{ id: string }>(`/api/admin/content/categories/${id}`, 'DELETE');

// ─── Exercícios semanais ─────────────────────────────────────────────

export interface Challenge {
  /** bigint no banco */
  id: number;
  title: string;
  description: string;
  discoveries: string;
  tips: string;
  duration_minutes: number;
  category: string;
  is_free: boolean;
  is_active: boolean;
  created_at: string;
  participants: number;
  avg_days_completed: number;
}

export type ChallengeInput = Pick<
  Challenge,
  'title' | 'description' | 'discoveries' | 'tips' | 'duration_minutes' | 'category' | 'is_free' | 'is_active'
>;

export const listChallenges = () => apiFetch<Challenge[]>('/api/admin/content/challenges');

export const createChallenge = (input: ChallengeInput) =>
  apiSend<Challenge>('/api/admin/content/challenges', 'POST', input);

export const updateChallenge = (id: number, changes: Partial<ChallengeInput>) =>
  apiSend<Challenge>(`/api/admin/content/challenges/${id}`, 'PATCH', changes);

// ─── Métricas ────────────────────────────────────────────────────────

export interface ContentMetrics {
  top_sessions: Array<{ id: number; title: string; category: SessionCategory; completions: number }>;
  completions_by_category: Array<{ category: SessionCategory; completions: number }>;
}

export const getContentMetrics = () => apiFetch<ContentMetrics>('/api/admin/metrics/content');
