const supabase = require('../config/supabase');
const { getWeekStart, getDayColumn } = require('../utils/dateUtils');

const ALLOWED_COLUMNS = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]);

const DAY_COLUMNS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Marca o dia atual como concluído no progresso semanal do usuário.
 * Implementa a regra RNE-003: impede marcar o mesmo dia duas vezes.
 * @param {string} userId - ID do usuário autenticado
 * @returns {Promise<object>} Progresso atualizado, dia marcado e streak
 */
exports.markTodayProgress = async (userId) => {
  const weekStart = getWeekStart();
  const dayColumn = getDayColumn();

  if (!ALLOWED_COLUMNS.has(dayColumn)) {
    throw new Error(`Invalid day column: ${dayColumn}`);
  }

  const { data: row, error: fetchError } = await supabase
    .from('user_challenge_progress')
    .select(
      'id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, challenge_id, updated_at'
    )
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();

  if (fetchError || !row) {
    const err = new Error(
      'Nenhum exercício selecionado para esta semana. Acesse a lista de exercícios primeiro.'
    );
    err.code = 'NO_ACTIVE_EXERCISE';
    err.status = 404;
    throw err;
  }

  // RNE-003: impede marcar o mesmo dia duas vezes
  if (row[dayColumn] === true) {
    const err = new Error(
      'Exercício já marcado para hoje. Não é possível marcar retroativamente (RNE-003).'
    );
    err.code = 'ALREADY_MARKED';
    err.status = 409;
    throw err;
  }

  const { data: updated, error: updateError } = await supabase
    .from('user_challenge_progress')
    .update({ [dayColumn]: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .select()
    .single();

  if (updateError || !updated) {
    const err = new Error('Erro ao atualizar progresso do exercício');
    err.code = 'INTERNAL_ERROR';
    err.status = 500;
    throw err;
  }

  const streak = DAY_COLUMNS.filter((col) => updated[col] === true).length;

  return {
    progress: updated,
    day_marked: dayColumn,
    streak,
  };
};
