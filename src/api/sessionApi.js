import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export async function getSession(sessionId) {
  const token = await AsyncStorage.getItem('access_token');
  return api.get(`/api/sessions/${sessionId}`, token);
}
