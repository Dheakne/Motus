import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export async function markTodayExercise() {
  const token = await AsyncStorage.getItem('access_token');
  return api.patch('/api/exercises/progress/mark-today', {}, token);
}
