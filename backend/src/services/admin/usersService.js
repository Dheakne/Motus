const supabase = require('../../config/supabase');
const { getAuthUsersMap, sanitizeSearch, httpError } = require('../../utils/adminQuery');
const { markedDays } = require('../../utils/metricsUtils');
const { logAdminAction } = require('../../utils/auditLog');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Campos do perfil visíveis no painel. phone e birth_date ficam de fora de propósito
// (dados pessoais que a equipe não precisa para suporte — minimização LGPD).
const PROFILE_FIELDS =
  'user_id, display_name, full_name, level, total_points, is_premium, has_seen_tutus, ' +
  'consent_terms, consent_health_data, consented_at, created_at, updated_at';

const LIST_FIELDS = 'user_id, display_name, full_name, level, total_points, is_premium, created_at';

// Limite de ids vindos da busca por email, para não gerar uma URL gigante no filtro "in"
const MAX_EMAIL_MATCHES = 200;

const notFound = () => httpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');

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
  if (!UUID_RE.test(userId)) throw notFound();

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(PROFILE_FIELDS)
    .eq('user_id', userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw notFound();

  const [authResult, sessionsResult, completedResult, progressResult] = await Promise.all([
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
      .select('id, week_start, monday, tuesday, wednesday, thursday, friday, saturday, sunday, updated_at, challenge:weekly_challenges(id, title)')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(10),
  ]);

  for (const r of [sessionsResult, completedResult, progressResult]) {
    if (r.error) throw r.error;
  }

  const authUser = authResult.data?.user;

  return {
    profile: {
      ...profile,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    },
    stats: { sessions_completed: completedResult.count ?? 0 },
    recent_sessions: sessionsResult.data,
    challenge_progress: progressResult.data.map((row) => ({
      ...row,
      days_completed: markedDays(row),
    })),
  };
};

/**
 * Atualiza campos permitidos do perfil (a allowlist é garantida pelo Joi na rota)
 * e grava o antes/depois no audit log.
 * @param {string} adminId
 * @param {string} userId
 * @param {{ is_premium?: boolean, has_seen_tutus?: boolean }} changes
 * @returns {Promise<object>} Perfil atualizado
 */
exports.updateUser = async (adminId, userId, changes) => {
  if (!UUID_RE.test(userId)) throw notFound();

  const fields = Object.keys(changes).join(', ');
  const { data: before, error: beforeError } = await supabase
    .from('user_profiles')
    .select(fields)
    .eq('user_id', userId)
    .maybeSingle();
  if (beforeError) throw beforeError;
  if (!before) throw notFound();

  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select(PROFILE_FIELDS)
    .single();
  if (error) throw error;

  await logAdminAction(adminId, 'user.update', 'user_profiles', userId, { before, after: changes });

  return updated;
};

exports.UUID_RE = UUID_RE;
