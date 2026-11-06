import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { supabase } from '../services/supabase';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPremium(false);
        return false;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const value = !!data?.is_premium;
      setIsPremium(value);
      return value;
    } catch (err) {
      console.error('[usePremium] load error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { isPremium, loading, refresh };
}
