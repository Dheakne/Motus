const supabase = require('../../config/supabase');
const { getAuthUsersMap, httpError, parsePagination, sanitizeSearch } = require('../../utils/adminQuery');
const { logAdminAction } = require('../../utils/auditLog');
const { UUID_RE } = require('./usersService');

const cannotChangeSelf = (what) => httpError(400, 'CANNOT_CHANGE_SELF', `Você não pode ${what} o seu próprio acesso`);
const adminNotFound = () => httpError(404, 'ADMIN_NOT_FOUND', 'Administrador não encontrado');

/** Lista quem tem acesso ao painel, com email, último login e quem concedeu. */
exports.listAdmins = async () => {
  const [{ data, error }, authUsers] = await Promise.all([
    supabase.from('admin_users').select('user_id, role, created_at, created_by').order('created_at'),
    getAuthUsersMap(),
  ]);
  if (error) throw error;

  return data.map((a) => ({
    ...a,
    email: authUsers.get(a.user_id)?.email ?? null,
    last_sign_in_at: authUsers.get(a.user_id)?.last_sign_in_at ?? null,
    created_by_email: a.created_by ? (authUsers.get(a.created_by)?.email ?? null) : null,
  }));
};

/**
 * Concede (ou altera o papel de) uma conta que já existe no app.
 * @param {string} adminId - Superadmin que está concedendo
 * @param {{ email: string, role: 'admin'|'superadmin' }} params - email já em minúsculas (Joi)
 */
exports.grantAdmin = async (adminId, { email, role }) => {
  const authUsers = await getAuthUsersMap();
  const match = [...authUsers].find(([, u]) => u.email?.toLowerCase() === email);
  if (!match) {
    throw httpError(
      404,
      'USER_NOT_FOUND',
      'Nenhuma conta do app com esse email. A pessoa precisa se cadastrar no app primeiro.'
    );
  }
  const [userId] = match;
  if (userId === adminId) throw cannotChangeSelf('alterar');

  const { data: before, error: beforeError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (beforeError) throw beforeError;

  const { data, error } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId, role, created_by: adminId }, { onConflict: 'user_id' })
    .select('user_id, role, created_at, created_by')
    .single();
  if (error) throw error;

  await logAdminAction(adminId, 'admin.grant', 'admin_users', userId, { email, before, after: { role } });
  return { ...data, email };
};

/**
 * Revoga o acesso ao painel. Ninguém revoga o próprio acesso
 * (garante que sempre sobra ao menos o superadmin que está usando o painel).
 * @param {string} adminId
 * @param {string} userId
 */
exports.revokeAdmin = async (adminId, userId) => {
  if (!UUID_RE.test(userId)) throw adminNotFound();
  if (userId === adminId) throw cannotChangeSelf('revogar');

  const { data: before, error: beforeError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (beforeError) throw beforeError;
  if (!before) throw adminNotFound();

  const { error } = await supabase.from('admin_users').delete().eq('user_id', userId);
  if (error) throw error;

  await logAdminAction(adminId, 'admin.revoke', 'admin_users', userId, { before });
  return { user_id: userId };
};

/**
 * Histórico de ações do painel (somente leitura), mais recentes primeiro.
 * @param {object} query - req.query (page, pageSize, action = prefixo, ex.: "session")
 */
exports.listAuditLog = async (query) => {
  const { page, pageSize, from, to } = parsePagination(query, 30);

  let q = supabase
    .from('admin_audit_log')
    .select('id, admin_id, action, target_table, target_id, payload, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  const action = sanitizeSearch(query.action);
  if (action) q = q.ilike('action', `${action}%`);

  const [{ data, count, error }, authUsers] = await Promise.all([q, getAuthUsersMap()]);
  if (error) throw error;

  return {
    items: data.map((row) => ({ ...row, admin_email: authUsers.get(row.admin_id)?.email ?? null })),
    page,
    pageSize,
    total: count ?? 0,
  };
};
