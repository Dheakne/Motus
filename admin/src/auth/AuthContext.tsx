import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isAuthApiError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { getMe } from '../api/adminApi';
import type { AdminMe } from '../api/adminApi';
import { ApiError } from '../api/client';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; admin: AdminMe };

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Mesma mensagem para senha errada e para "não é admin": não revelar qual dos dois
const INVALID_LOGIN = 'Email ou senha inválidos, ou conta sem acesso ao painel.';
const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua conexão e tente de novo.';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Ao abrir o painel: se já existe sessão salva, confirma no backend que ainda é admin
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setState({ status: 'signedOut' });
        return;
      }
      try {
        const admin = await getMe();
        setState({ status: 'signedIn', admin });
      } catch {
        setState({ status: 'signedOut' });
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setState({ status: 'signedOut' });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(isAuthApiError(error) ? INVALID_LOGIN : CONNECTION_ERROR);
    }

    try {
      const admin = await getMe();
      setState({ status: 'signedIn', admin });
    } catch (err) {
      // apiFetch já encerra a sessão em 401/403; garante o mesmo nos demais erros
      await supabase.auth.signOut();
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        throw new Error(INVALID_LOGIN);
      }
      throw new Error(CONNECTION_ERROR);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
