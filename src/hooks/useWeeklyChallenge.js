import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { DAY_COLUMNS } from '../utils/dayColumns';
import { getWeekStart } from '../utils/weekStart';

const EMPTY_PROGRESS = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

export function useWeeklyChallenge() {
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [challengeId, setChallengeId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [hasChosen, setHasChosen] = useState(false);
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

      // Busca a linha de progresso do usuário para esta semana — qualquer
      // exercício escolhido. Antes filtrávamos pelo "desafio ativo mais
      // recente", o que escondia o card quando o usuário escolhia um
      // exercício mais antigo (challenge_id não batia). O challengeId correto
      // vem da própria linha escolhida.
      const { data: row, error: fetchErr } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (row) {
        setHasChosen(true);
        setChallengeId(row.challenge_id);
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
        // Sem progresso ainda: usuário não escolheu exercício nesta semana.
        // NÃO cria linha aqui — o INSERT só acontece quando o usuário escolhe
        // um exercício e toca em "Escolher este exercício" (ChallengesScreen).
        setHasChosen(false);
        setChallengeId(null);
        setProgress(EMPTY_PROGRESS);
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
    } else {
      setHasChosen(true);
    }
  }

  return { progress, todayColumn, completedCount, toggleToday, hasChosen, loading, error };
}
