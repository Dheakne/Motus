import { supabase } from '../auth/supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * fetch para /api/admin/* com o access_token da sessão Supabase.
 * Desempacota o formato { success, data } do backend ou lança ApiError.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar ao servidor');
  }

  const body = await res.json().catch(() => null);

  // Token expirado ou acesso de admin revogado: encerra a sessão local,
  // o AuthProvider recebe SIGNED_OUT e manda de volta para o login.
  // (403 SUPERADMIN_REQUIRED não desloga: o admin só não tem acesso àquela tela.)
  if (res.status === 401 || (res.status === 403 && body?.error === 'FORBIDDEN')) {
    await supabase.auth.signOut();
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(
      res.status,
      body?.error ?? 'UNKNOWN_ERROR',
      body?.message ?? 'Erro inesperado'
    );
  }

  return body.data as T;
}

/** POST/PATCH/DELETE com corpo JSON. */
export function apiSend<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
  return apiFetch<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Monta a query string ignorando valores vazios. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
