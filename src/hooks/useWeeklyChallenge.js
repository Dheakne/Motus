import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const DAY_COLUMNS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const EMPTY_PROGRESS = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

function getWeekStart() {
  const today = new Date();
  const dow = today.getDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysBack);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useWeeklyChallenge() {
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [challengeId, setChallengeId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayColumn = DAY_COLUMNS[new Date().getDay()];
  const completedCount = Object.values(progress).filter(Boolean).length;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setError(null);
      const weekStart = getWeekStart();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: challenge } = await supabase
        .from('weekly_challenges')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!challenge) { setLoading(false); return; }
      setChallengeId(challenge.id);

      const { data: row, error: fetchErr } = await supabase
        .from('user_challenge_progress')
        .select('monday,tuesday,wednesday,thursday,friday,saturday,sunday')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (row) {
        setProgress({
          monday: !!row.monday,
          tuesday: !!row.tuesday,
          wednesday: !!row.wednesday,
          thursday: !!row.thursday,
          friday: !!row.friday,
          saturday: !!row.saturday,
          sunday: !!row.sunday,
        });
      } else {
        const { error: insertErr } = await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
            week_start: weekStart,
            ...EMPTY_PROGRESS,
          });
        if (insertErr) throw insertErr;
      }
    } catch {
      setError('Erro ao carregar progresso da semana.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleToday() {
    if (!userId || !challengeId) return;

    const weekStart = getWeekStart();
    const newValue = !progress[todayColumn];
    const snapshot = progress;

    setProgress(prev => ({ ...prev, [todayColumn]: newValue }));
    setError(null);

    const { error: upsertErr } = await supabase
      .from('user_challenge_progress')
      .upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          week_start: weekStart,
          ...progress,
          [todayColumn]: newValue,
        },
        { onConflict: 'user_id,challenge_id,week_start' }
      );

    if (upsertErr) {
      setProgress(snapshot);
      setError('Não foi possível salvar. Tente novamente.');
    }
  }

  return { progress, todayColumn, completedCount, toggleToday, loading, error };
}
