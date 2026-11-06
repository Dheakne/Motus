const crypto = require('crypto');
const supabase = require('../../config/supabase');
const { storageBucket } = require('../../config/env');
const { fetchAll, httpError } = require('../../utils/adminQuery');
const { markedDays, average } = require('../../utils/metricsUtils');
const { logAdminAction } = require('../../utils/auditLog');
const { UUID_RE } = require('./usersService');

const SESSION_FIELDS = 'id, title, duration, audio_url, category, category_id, is_premium, is_active, created_at';
const CHALLENGE_FIELDS =
  'id, title, description, discoveries, tips, duration_minutes, category, is_free, is_active, created_at';

const AUDIO_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'wav', 'ogg']);

/**
 * Busca um registro pelo id ou lança 404.
 * @returns {Promise<object>}
 */
async function findOrFail(table, id, fields, notFoundCode, notFoundMessage) {
  if (!UUID_RE.test(id)) throw httpError(404, notFoundCode, notFoundMessage);
  const { data, error } = await supabase.from(table).select(fields).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, notFoundCode, notFoundMessage);
  return data;
}

/** Cria um registro e grava o audit log. */
async function createWithAudit({ table, fields, values, adminId, action }) {
  const { data, error } = await supabase.from(table).insert(values).select(fields).single();
  if (error) throw error;
  await logAdminAction(adminId, action, table, data.id, values);
  return data;
}

/** Atualiza um registro (404 se não existir) e grava o antes/depois no audit log. */
async function updateWithAudit({ table, fields, id, changes, adminId, action, notFound }) {
  const before = await findOrFail(table, id, fields, ...notFound);
  const { data, error } = await supabase.from(table).update(changes).eq('id', id).select(fields).single();
  if (error) throw error;

  const previous = Object.fromEntries(Object.keys(changes).map((k) => [k, before[k]]));
  await logAdminAction(adminId, action, table, id, { before: previous, after: changes });
  return data;
}

// ─── Sessões de áudio ────────────────────────────────────────────────

const SESSION_NOT_FOUND = ['SESSION_NOT_FOUND', 'Sessão não encontrada'];

/**
 * Quantas vezes cada sessão foi concluída.
 * @returns {Promise<Map<string, number>>}
 */
async function getSessionCompletions() {
  const rows = await fetchAll(() =>
    supabase.from('user_sessions').select('session_id').eq('completed', true).order('id')
  );
  const counts = new Map();
  for (const { session_id: id } of rows) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

/**
 * Lista sessões com o número de conclusões de cada uma.
 * @param {{ category?: string, status?: 'active'|'inactive'|'all' }} filters
 */
exports.listSessions = async ({ category, status = 'all' } = {}) => {
  let query = supabase.from('sessions').select(SESSION_FIELDS).order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);

  const [{ data, error }, completions] = await Promise.all([query, getSessionCompletions()]);
  if (error) throw error;

  return data.map((s) => ({ ...s, completions: completions.get(s.id) ?? 0 }));
};

exports.createSession = (adminId, values) =>
  createWithAudit({ table: 'sessions', fields: SESSION_FIELDS, values, adminId, action: 'session.create' });

exports.updateSession = (adminId, id, changes) =>
  updateWithAudit({
    table: 'sessions',
    fields: SESSION_FIELDS,
    id,
    changes,
    adminId,
    action: 'session.update',
    notFound: SESSION_NOT_FOUND,
  });

/** Soft delete: só desativa, para não apagar o histórico de quem já ouviu. */
exports.deactivateSession = (adminId, id) =>
  updateWithAudit({
    table: 'sessions',
    fields: SESSION_FIELDS,
    id,
    changes: { is_active: false },
    adminId,
    action: 'session.deactivate',
    notFound: SESSION_NOT_FOUND,
  });

/**
 * Prepara o upload direto do navegador para o Storage (o arquivo não passa pelo backend).
 * Devolve a URL pública que deve ser gravada em sessions.audio_url: o app toca essa URL direto.
 * @param {{ filename: string }} params
 * @returns {Promise<{ bucket: string, path: string, token: string, public_url: string }>}
 */
exports.createAudioUpload = async ({ filename }) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (!AUDIO_EXTENSIONS.has(ext)) {
    throw httpError(400, 'INVALID_AUDIO_FILE', 'Formato de áudio não suportado. Use mp3, m4a, aac, wav ou ogg');
  }

  const path = `sessions/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(storageBucket).createSignedUploadUrl(path);
  if (error || !data?.token) {
    throw httpError(500, 'STORAGE_ERROR', 'Não foi possível preparar o upload do áudio');
  }

  const { data: publicData } = supabase.storage.from(storageBucket).getPublicUrl(path);

  return { bucket: storageBucket, path: data.path, token: data.token, public_url: publicData.publicUrl };
};

/**
 * URL para ouvir o áudio no painel. Caminho relativo vira URL assinada de 1 hora.
 * @param {string} id
 * @returns {Promise<{ url: string }>}
 */
exports.getSessionAudioUrl = async (id) => {
  const session = await findOrFail('sessions', id, 'id, audio_url', ...SESSION_NOT_FOUND);
  if (/^https?:\/\//.test(session.audio_url)) return { url: session.audio_url };

  const { data, error } = await supabase.storage.from(storageBucket).createSignedUrl(session.audio_url, 3600);
  if (error || !data?.signedUrl) throw httpError(500, 'STORAGE_ERROR', 'Erro ao acessar o arquivo de áudio');
  return { url: data.signedUrl };
};

// ─── Categorias ──────────────────────────────────────────────────────

const CATEGORY_NOT_FOUND = ['CATEGORY_NOT_FOUND', 'Categoria não encontrada'];

/** Lista categorias na ordem da Home, com quantas sessões apontam para cada uma (category_id). */
exports.listCategories = async () => {
  const [{ data, error }, sessions] = await Promise.all([
    supabase.from('categories').select('*').order('order', { ascending: true }),
    fetchAll(() => supabase.from('sessions').select('category_id').not('category_id', 'is', null).order('id')),
  ]);
  if (error) throw error;

  const counts = new Map();
  for (const { category_id: id } of sessions) counts.set(id, (counts.get(id) ?? 0) + 1);
  return data.map((c) => ({ ...c, sessions_count: counts.get(c.id) ?? 0 }));
};

exports.createCategory = (adminId, values) =>
  createWithAudit({ table: 'categories', fields: '*', values, adminId, action: 'category.create' });

exports.updateCategory = (adminId, id, changes) =>
  updateWithAudit({
    table: 'categories',
    fields: '*',
    id,
    changes,
    adminId,
    action: 'category.update',
    notFound: CATEGORY_NOT_FOUND,
  });

/** Exclusão física, permitida só se nenhuma sessão aponta para a categoria. */
exports.deleteCategory = async (adminId, id) => {
  const category = await findOrFail('categories', id, '*', ...CATEGORY_NOT_FOUND);

  const { count, error: countError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);
  if (countError) throw countError;
  if (count > 0) {
    throw httpError(409, 'CATEGORY_IN_USE', `Categoria tem ${count} sessão(ões) vinculada(s) e não pode ser excluída`);
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;

  await logAdminAction(adminId, 'category.delete', 'categories', id, { before: category });
  return { id };
};

// ─── Exercícios semanais ─────────────────────────────────────────────

const CHALLENGE_NOT_FOUND = ['CHALLENGE_NOT_FOUND', 'Exercício semanal não encontrado'];

/**
 * Participantes distintos e média de dias marcados por exercício (todas as semanas).
 * @returns {Promise<Map<string, { participants: number, avg_days_completed: number }>>}
 */
async function getChallengeStats() {
  const rows = await fetchAll(() =>
    supabase
      .from('user_challenge_progress')
      .select('challenge_id, user_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday')
      .order('id')
  );

  const groups = new Map();
  for (const row of rows) {
    const g = groups.get(row.challenge_id) ?? { users: new Set(), days: [] };
    g.users.add(row.user_id);
    g.days.push(markedDays(row));
    groups.set(row.challenge_id, g);
  }

  const stats = new Map();
  for (const [id, g] of groups) {
    stats.set(id, { participants: g.users.size, avg_days_completed: average(g.days) });
  }
  return stats;
}

/** Lista exercícios com participantes e média de dias marcados. */
exports.listChallenges = async () => {
  const [{ data, error }, stats] = await Promise.all([
    supabase.from('weekly_challenges').select(CHALLENGE_FIELDS).order('created_at', { ascending: false }),
    getChallengeStats(),
  ]);
  if (error) throw error;

  return data.map((c) => ({ ...c, ...(stats.get(c.id) ?? { participants: 0, avg_days_completed: 0 }) }));
};

exports.createChallenge = (adminId, values) =>
  createWithAudit({
    table: 'weekly_challenges',
    fields: CHALLENGE_FIELDS,
    values,
    adminId,
    action: 'challenge.create',
  });

exports.updateChallenge = (adminId, id, changes) =>
  updateWithAudit({
    table: 'weekly_challenges',
    fields: CHALLENGE_FIELDS,
    id,
    changes,
    adminId,
    action: 'challenge.update',
    notFound: CHALLENGE_NOT_FOUND,
  });

/** Soft delete: desativa (some do app) sem apagar o progresso dos usuários. */
exports.deactivateChallenge = (adminId, id) =>
  updateWithAudit({
    table: 'weekly_challenges',
    fields: CHALLENGE_FIELDS,
    id,
    changes: { is_active: false },
    adminId,
    action: 'challenge.deactivate',
    notFound: CHALLENGE_NOT_FOUND,
  });

// ─── Métricas de conteúdo ────────────────────────────────────────────

const TOP_SESSIONS = 10;

/**
 * Sessões mais concluídas e conclusões por categoria.
 * (O app só grava user_sessions ao concluir, então "taxa de conclusão" seria sempre 100%:
 * por isso a métrica por categoria é o total de conclusões.)
 */
exports.getContentMetrics = async () => {
  const sessions = await exports.listSessions();

  const byCategory = new Map();
  for (const s of sessions) byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + s.completions);

  return {
    top_sessions: [...sessions]
      .filter((s) => s.completions > 0)
      .sort((a, b) => b.completions - a.completions)
      .slice(0, TOP_SESSIONS)
      .map(({ id, title, category, completions }) => ({ id, title, category, completions })),
    completions_by_category: [...byCategory]
      .map(([category, completions]) => ({ category, completions }))
      .sort((a, b) => b.completions - a.completions),
  };
};

/** Participação por exercício semanal. */
exports.getChallengeMetrics = async () => {
  const challenges = await exports.listChallenges();
  return {
    challenges: challenges
      .map(({ id, title, is_active, participants, avg_days_completed }) => ({
        id,
        title,
        is_active,
        participants,
        avg_days_completed,
      }))
      .sort((a, b) => b.participants - a.participants),
  };
};
