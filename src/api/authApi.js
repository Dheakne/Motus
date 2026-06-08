import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { api } from './api';

async function persistSession(data) {
  if (data.access_token) {
    await AsyncStorage.setItem('access_token', data.access_token);
  }
  if (data.profile) {
    await AsyncStorage.setItem('user_profile', JSON.stringify(data.profile));
  }
  // Seta a sessão no cliente Supabase para que queries diretas continuem funcionando.
  // Pode ser null se confirmação de email estiver ativa — não bloqueia o fluxo.
  if (data.access_token && data.refresh_token) {
    try {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    } catch (_) {}
  }
}

export async function login(email, password) {
  const data = await api.post('/api/auth/login', { email, password });
  await persistSession(data);
  return data;
}

export async function register(payload) {
  const data = await api.post('/api/auth/register', payload);
  await persistSession(data);
  return data;
}

export async function getStoredToken() {
  return AsyncStorage.getItem('access_token');
}

export async function getStoredProfile() {
  const raw = await AsyncStorage.getItem('user_profile');
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['access_token', 'user_profile']);
}
