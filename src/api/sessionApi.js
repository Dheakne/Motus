import { api } from './api';
import { getAuthToken } from './authApi';

export async function getSession(sessionId) {
  return api.get(`/api/sessions/${sessionId}`, await getAuthToken());
}
