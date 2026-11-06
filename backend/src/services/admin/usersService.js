const supabase = require('../../config/supabase');
const { getAuthUsersMap, sanitizeSearch, httpError, isValidId } = require('../../utils/adminQuery');
const { markedDays } = require('../../utils/metricsUtils');
const { logAdminAction } = require('../../utils/auditLog');
const { grantAdminPremium, revokeAdminPremium } = require('../premiumService');


// Campos do perfil visíveis no painel. phone e birth_date ficam de fora de propósito
// (dados pessoais que a equipe não precisa para suporte — minimização LGPD).
const PROFILE_FIELDS =
  'user_id, display_name, full_name, level, total_points, is_premium, has_seen_tutus, ' +
  'consent_terms, consent_health_data, consented_at, created_at, updated_at';

const LIST_FIELDS = 'user_id, display_name, full_name, level, total_points, is_premium, created_at';

// Limite de ids vindos da busca por email, para não gerar uma URL gigante no filtro "in"
const MAX_EMAIL_MATCHES = 200;

const notFound = () => httpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');

const SUBSCRIPTION_FIELDS =
  'id, source, plan, status, amount_cents, currency, cancel_at_period_end, current_period_end, started_at, canceled_at, granted_by';

/**
 * Histórico de premium do usuário (assinaturas Stripe e liberações do painel) e um resumo
 * do que está ativo agora. O is_premium do perfil é derivado dessas linhas (PLANO_PREMIUM.md).
 * @param {string} userId
 */
async function getPremiumInfo(userId) {
  const { data, error } = await supabase
    .from('premium_subscriptions')
    .select(SUBSCRIPTION_FIELDS)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(20);
  if (error) throw error;

  const active = data.filter((s) => s.status === 'active');
  return {
    has_paid: active.some((s) => s.source === 'stripe'),
    has_admin_grant: active.some((s) => s.source === 'admin'),
    subscriptions: data,
  };
}

/**
 * Lista paginada de usuários, com busca por nome ou email.
 * @param {{ search?: string, from: number, to: number }} params
 * @returns {Promise<{ items: object[], total: number }>}
 */
exports.listUsers = async ({ search, from, to }) => {
  const authUsers = await getAuthUsersMap();

  let query = supabase
    .from('user_profiles')
    .select(LIST_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = sanitizeSearch(search);
  if (term) {
    const lower = term.toLowerCase();
    const emailMatches = [...authUsers]
      .filter(([, u]) => u.email?.toLowerCase().includes(lower))
      .slice(0, MAX_EMAIL_MATCHES)
      .map(([id]) => id);

    const filters = [`display_name.ilike.%${term}%`, `full_name.ilike.%${term}%`];
    if (emailMatches.length) filters.push(`user_id.in.(${emailMatches.join(',')})`);
    query = query.or(filters.join(','));
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    items: data.map((p) => ({ ...p, email: authUsers.get(p.user_id)?.email ?? null })),
    total: count ?? 0,
  };
};

/**
 * Detalhe de um usuário: perfil, últimas sessões e progresso nos exercícios semanais.
 * @param {string} userId
 * @returns {Promise<object>}
 */
exports.getUserDetail = async (userId) => {
  if (!isValidId(userId, 'uuid')) throw notFound();

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(PROFILE_FIELDS)
    .eq('user_id', userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw notFound();

  const [authResult, sessionsResult, completedResult, progressResult, premium] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase
      .from('user_sessions')
      .select('id, completed, completed_at, points_earned, created_at, session:sessions(id, title, category, duration)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('user_challenge_progress')
      // Sem FK entre user_challenge_progress e weekly_challenges no banco: o título é buscado à parte
      .select('id, challenge_id, week_start, monday, tuesday, wednesday, thursday, friday, saturday, sunday, updated_at')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(10),
    getPremiumInfo(userId),
  ]);

  for (const r of [sessionsResult, completedResult, progressResult]) {
    if (r.error) throw r.error;
  }

  const authUser = authResult.data?.user;

  const challengeIds = [...new Set(progressResult.data.map((r) => r.challenge_id).filter(Boolean))];
  const { data: challenges, error: challengesError } = challengeIds.length
    ? await supabase.from('weekly_challenges').select('id, title').in('id', challengeIds)
    : { data: [], error: null };
  if (challengesError) throw challengesError;
  const challengeById = new Map(challenges.map((c) => [c.id, c]));

  return {
    profile: {
      ...profile,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    },
    stats: { sessions_completed: completedResult.count ?? 0 },
    premium,
    recent_sessions: sessionsResult.data,
    challenge_progress: progressResult.data.map((row) => ({
      ...row,
      challenge: challengeById.get(row.challenge_id) ?? null,
      days_completed: markedDays(row),
    })),
  };
};

/**
 * Atualiza o usuário pelo painel (a allowlist é garantida pelo Joi na rota) e grava o audit log.
 *
 * is_premium nunca é gravado direto: ele é derivado de premium_subscriptions (PLANO_PREMIUM.md).
 * - true  → cria uma liberação do painel (source = 'admin') e recalcula
 * - false → encerra só a liberação do painel; quem paga pelo Stripe continua premium
 *
 * @param {string} adminId
 * @param {string} userId
 * @param {{ is_premium?: boolean, has_seen_tutus?: boolean }} changes
 * @returns {Promise<object>} Perfil atualizado + resumo de premium
 */
exports.updateUser = async (adminId, userId, changes) => {
  if (!isValidId(userId, 'uuid')) throw notFound();

  const { data: before, error: beforeError } = await supabase
    .from('user_profiles')
    .select('is_premium, has_seen_tutus')
    .eq('user_id', userId)
    .maybeSingle();
  if (beforeError) throw beforeError;
  if (!before) throw notFound();

  if (changes.is_premium !== undefined) {
    const isPremium = changes.is_premium
      ? await grantAdminPremium(userId, adminId)
      : await revokeAdminPremium(userId);

    await logAdminAction(adminId, 'user.set_premium', 'user_profiles', userId, {
      requested: changes.is_premium ? 'grant' : 'revoke',
      before: { is_premium: before.is_premium },
      after: { is_premium: isPremium },
    });
  }

  if (changes.has_seen_tutus !== undefined) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ has_seen_tutus: changes.has_seen_tutus, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;

    await logAdminAction(adminId, 'user.update', 'user_profiles', userId, {
      before: { has_seen_tutus: before.has_seen_tutus },
      after: { has_seen_tutus: changes.has_seen_tutus },
    });
  }

  const [{ data: profile, error }, premium] = await Promise.all([
    supabase.from('user_profiles').select(PROFILE_FIELDS).eq('user_id', userId).single(),
    getPremiumInfo(userId),
  ]);
  if (error) throw error;

  return { ...profile, premium };
};

