const supabase = require('../../config/supabase');
const logger = require('../../utils/logger');
const { countRows, fetchAll } = require('../../utils/adminQuery');
const { lastNDays, daysAgoIso, countByDay } = require('../../utils/metricsUtils');

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
