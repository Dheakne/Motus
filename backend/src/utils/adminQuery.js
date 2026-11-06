const supabase = require('../config/supabase');

// O PostgREST devolve no máximo 1000 linhas por requisição
const PAGE = 1000;

/**
 * Busca todas as linhas de uma consulta, paginando de 1000 em 1000.
 * @param {() => object} buildQuery - Cria a consulta (supabase.from(...).select(...)) a cada página
 * @returns {Promise<object[]>}
 */
exports.fetchAll = async (buildQuery) => {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
};

/**
 * Conta linhas de uma tabela sem trazer os dados (HEAD + count exato).
 * @param {string} table
 * @param {(query: object) => object} [applyFilters]
 * @returns {Promise<number>}
 */
exports.countRows = async (table, applyFilters = (q) => q) => {
  const { count, error } = await applyFilters(
    supabase.from(table).select('*', { count: 'exact', head: true })
  );
  if (error) throw error;
  return count ?? 0;
};

/**
 * Lista todos os usuários do Supabase Auth (email, último login) indexados por id.
 * @returns {Promise<Map<string, { email: string, last_sign_in_at: string|null, created_at: string }>>}
 */
exports.getAuthUsersMap = async () => {
  const map = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw error;
    for (const u of data.users) {
      map.set(u.id, {
        email: u.email,
        last_sign_in_at: u.last_sign_in_at ?? null,
        created_at: u.created_at,
      });
    }
    if (data.users.length < PAGE) return map;
  }
};

/**
 * Lê page/pageSize da query string com limites seguros.
 * @param {object} query - req.query
 * @param {number} [defaultSize]
 * @returns {{ page: number, pageSize: number, from: number, to: number }}
 */
exports.parsePagination = (query, defaultSize = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || defaultSize));
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
};

/**
 * Remove caracteres com significado especial nos filtros do PostgREST (or/ilike).
 * @param {string} value
 * @returns {string}
 */
exports.sanitizeSearch = (value) =>
  String(value ?? '')
    .replace(/[,()%*\\:"']/g, ' ')
    .trim()
    .slice(0, 100);

// Formato dos ids no banco: usuários e categorias usam uuid;
// sessions, weekly_challenges e reports usam bigint (número)
const ID_PATTERNS = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  bigint: /^[1-9]\d{0,17}$/,
};

/**
 * Confere se o id da URL tem o formato da coluna (evita erro 500 do Postgres em id inválido).
 * @param {string} id
 * @param {'uuid'|'bigint'} type
 * @returns {boolean}
 */
exports.isValidId = (id, type) => ID_PATTERNS[type].test(String(id));

/**
 * Cria um erro de negócio no formato já tratado pelos controllers ({ status, code }).
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @returns {Error}
 */
exports.httpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};
