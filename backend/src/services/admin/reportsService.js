const supabase = require('../../config/supabase');
const { httpError } = require('../../utils/adminQuery');
const { logAdminAction } = require('../../utils/auditLog');
const { REPORT_STATUSES } = require('../../validators/adminSchemas');
const { UUID_RE } = require('./usersService');

const FIELDS = 'id, user_id, email, type, subject, description, status, created_at, updated_at';

const notFound = () => httpError(404, 'REPORT_NOT_FOUND', 'Relato não encontrado');

/**
 * Lista paginada de relatos, mais recentes primeiro, com a contagem por status.
 * @param {{ status?: string, from: number, to: number }} params
 */
exports.listReports = async ({ status, from, to }) => {
  let query = supabase
    .from('reports')
    .select(FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (REPORT_STATUSES.includes(status)) query = query.eq('status', status);

  const countFor = (s) => supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', s);

  const [list, ...counts] = await Promise.all([query, ...REPORT_STATUSES.map(countFor)]);
  for (const r of [list, ...counts]) {
    if (r.error) throw r.error;
  }

  return {
    items: list.data,
    total: list.count ?? 0,
    counts: Object.fromEntries(REPORT_STATUSES.map((s, i) => [s, counts[i].count ?? 0])),
  };
};

/**
 * Muda o status de atendimento de um relato e registra no audit log.
 * @param {string} adminId
 * @param {string} id
 * @param {'open'|'in_progress'|'resolved'} status
 */
exports.updateReportStatus = async (adminId, id, status) => {
  if (!UUID_RE.test(id)) throw notFound();

  const { data: before, error: beforeError } = await supabase
    .from('reports')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (beforeError) throw beforeError;
  if (!before) throw notFound();

  const { data, error } = await supabase
    .from('reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(FIELDS)
    .single();
  if (error) throw error;

  await logAdminAction(adminId, 'report.update', 'reports', id, { before, after: { status } });
  return data;
};
