const handle = require('./handle');
const { parsePagination } = require('../../utils/adminQuery');
const { listUsers, getUserDetail, updateUser } = require('../../services/admin/usersService');

/**
 * GET /api/admin/users?search=&page=&pageSize=
 * Lista paginada de usuários, buscável por nome ou email.
 */
exports.list = handle(async (req) => {
  const { page, pageSize, from, to } = parsePagination(req.query);
  const { items, total } = await listUsers({ search: req.query.search, from, to });
  return { items, page, pageSize, total };
});

/**
 * GET /api/admin/users/:id
 * Perfil + últimas sessões + progresso nos exercícios semanais.
 */
exports.detail = handle((req) => getUserDetail(req.params.id));

/**
 * PATCH /api/admin/users/:id
 * Altera apenas campos da allowlist (is_premium, has_seen_tutus). Gera audit log.
 */
exports.update = handle((req) => updateUser(req.user.id, req.params.id, req.body));
