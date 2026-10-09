const supabase = require('../../config/supabase');

/**
 * Conta linhas de uma tabela sem trazer os dados (HEAD + count exato).
 * @param {string} table - Nome da tabela
 * @param {(query: object) => object} [applyFilters] - Filtros opcionais
 * @returns {Promise<number>}
 */
async function countRows(table, applyFilters = (q) => q) {
  const { count, error } = await applyFilters(
    supabase.from(table).select('*', { count: 'exact', head: true })
  );
  if (error) throw error;
  return count ?? 0;
}

/**
 * KPIs gerais do painel (versão inicial da Fase 1).
 * @returns {Promise<{ total_users: number, premium_users: number, premium_rate: number }>}
 */
exports.getOverview = async () => {
  const [totalUsers, premiumUsers] = await Promise.all([
    countRows('user_profiles'),
    countRows('user_profiles', (q) => q.eq('is_premium', true)),
  ]);

  return {
    total_users: totalUsers,
    premium_users: premiumUsers,
    premium_rate: totalUsers > 0 ? premiumUsers / totalUsers : 0,
  };
};
