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

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) {
        setError('Faça login para acompanhar o desafio.');
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: challenge, error: challengeErr } = await supabase
        .from('weekly_challenges')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (challengeErr) throw challengeErr;
      if (!challenge) {
        setError('Nenhum desafio ativo no momento.');
        setLoading(false);
        return;
      }
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
    } catch (err) {
      console.error('[useWeeklyChallenge] load error:', err);
      setError(err?.message || 'Erro ao carregar progresso da semana.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleToday() {
    if (!userId) {
      setError('Faça login para marcar o desafio.');
      return;
    }
    if (!challengeId) {
      setError('Nenhum desafio ativo no momento.');
      return;
    }

    const weekStart = getWeekStart();
    const snapshot = progress;
    const nextProgress = { ...progress, [todayColumn]: !progress[todayColumn] };

    setProgress(nextProgress);
    setError(null);

    const { error: upsertErr } = await supabase
      .from('user_challenge_progress')
      .upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          week_start: weekStart,
          ...nextProgress,
        },
        { onConflict: 'user_id,challenge_id,week_start' }
      );

    if (upsertErr) {
      console.error('[useWeeklyChallenge] upsert error:', upsertErr);
      setProgress(snapshot);
      setError(upsertErr.message || 'Não foi possível salvar. Tente novamente.');
    }
  }

  return { progress, todayColumn, completedCount, toggleToday, loading, error };
}
