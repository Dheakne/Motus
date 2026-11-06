const supabase = require('../../config/supabase');
const logger = require('../../utils/logger');
const { countRows, fetchAll } = require('../../utils/adminQuery');
const {
  lastNDays,
  daysAgoIso,
  countByDay,
  distinctUsersByDay,
  distinctUsersSince,
  markedDays,
  average,
} = require('../../utils/metricsUtils');
const { getWeekStart } = require('../../utils/dateUtils');

const GROWTH_DAYS = 30;

/**
 * Relatos em aberto. Depende da migration 007 (coluna reports.status):
 * se ela ainda não foi rodada, devolve null em vez de derrubar o dashboard inteiro.
 * @returns {Promise<number|null>}
 */
async function countOpenReports() {
  try {
    return await countRows('reports', (q) => q.eq('status', 'open'));
  } catch (err) {
    logger.warn({ err }, 'Não foi possível contar reports abertos (migration 007 rodada?)');
    return null;
  }
}

/**
 * Novos usuários por dia nos últimos 30 dias, com o total acumulado ao fim de cada dia.
 * @param {number} totalUsers - Total atual, para reconstruir o acumulado
 * @returns {Promise<Array<{ day: string, new_users: number, total_users: number }>>}
 */
async function getUserGrowth(totalUsers) {
  const since = daysAgoIso(GROWTH_DAYS);
  const rows = await fetchAll(() =>
    supabase.from('user_profiles').select('created_at').gte('created_at', since).order('created_at')
  );

  const perDay = countByDay(lastNDays(GROWTH_DAYS), rows.map((r) => r.created_at));
  const newInWindow = perDay.reduce((sum, d) => sum + d.count, 0);

  let running = totalUsers - newInWindow;
  return perDay.map(({ day, count }) => {
    running += count;
    return { day, new_users: count, total_users: running };
  });
}

/**
 * KPIs gerais do painel + série de crescimento de usuários.
 * @returns {Promise<object>}
 */
exports.getOverview = async () => {
  const [
    totalUsers,
    newUsers24h,
    newUsers7d,
    newUsers30d,
    premiumUsers,
    sessionsCompletedTotal,
    activeChallenges,
    openReports,
  ] = await Promise.all([
    countRows('user_profiles'),
    countRows('user_profiles', (q) => q.gte('created_at', daysAgoIso(1))),
    countRows('user_profiles', (q) => q.gte('created_at', daysAgoIso(7))),
    countRows('user_profiles', (q) => q.gte('created_at', daysAgoIso(30))),
    countRows('user_profiles', (q) => q.eq('is_premium', true)),
    countRows('user_sessions', (q) => q.eq('completed', true)),
    countRows('weekly_challenges', (q) => q.eq('is_active', true)),
    countOpenReports(),
  ]);

  return {
    total_users: totalUsers,
    new_users_24h: newUsers24h,
    new_users_7d: newUsers7d,
    new_users_30d: newUsers30d,
    premium_users: premiumUsers,
    premium_rate: totalUsers > 0 ? premiumUsers / totalUsers : 0,
    sessions_completed_total: sessionsCompletedTotal,
    active_challenges: activeChallenges,
    open_reports: openReports,
    user_growth: await getUserGrowth(totalUsers),
  };
};

const RANGES = { '7d': 7, '30d': 30, '90d': 90 };

/**
 * Engajamento no período: DAU, WAU/MAU, média de dias marcados na semana atual
 * e sessões concluídas por dia.
 * Usuário "ativo" = concluiu uma sessão de áudio ou marcou um dia do exercício semanal.
 * @param {string} range - '7d' | '30d' | '90d' (padrão 30d)
 * @returns {Promise<object>}
 */
exports.getEngagement = async (range) => {
  const rangeKey = RANGES[range] ? range : '30d';
  const days = RANGES[rangeKey];
  // Busca ao menos 30 dias para calcular o MAU mesmo no filtro de 7 dias
  const since = daysAgoIso(Math.max(days, 30));

  const [sessions, progressUpdates, currentWeek] = await Promise.all([
    fetchAll(() =>
      supabase
        .from('user_sessions')
        .select('user_id, completed_at')
        .eq('completed', true)
        .gte('completed_at', since)
        .order('completed_at')
    ),
    fetchAll(() =>
      supabase
        .from('user_challenge_progress')
        .select('user_id, updated_at')
        .gte('updated_at', since)
        .order('updated_at')
    ),
    fetchAll(() =>
      supabase
        .from('user_challenge_progress')
        .select('monday, tuesday, wednesday, thursday, friday, saturday, sunday')
        .eq('week_start', getWeekStart())
        .order('id')
    ),
  ]);

  const events = [
    ...sessions.map((r) => ({ user_id: r.user_id, at: r.completed_at })),
    ...progressUpdates.map((r) => ({ user_id: r.user_id, at: r.updated_at })),
  ];
  const dayKeys = lastNDays(days);

  return {
    range: rangeKey,
    dau: distinctUsersByDay(dayKeys, events),
    wau: distinctUsersSince(events, daysAgoIso(7)),
    mau: distinctUsersSince(events, daysAgoIso(30)),
    avg_streak: average(currentWeek.map(markedDays)),
    weekly_participants: currentWeek.length,
    sessions_completed_by_day: countByDay(dayKeys, sessions.map((r) => r.completed_at)),
  };
};
