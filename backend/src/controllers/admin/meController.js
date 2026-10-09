const { success } = require('../../utils/responses');

/**
 * GET /api/admin/me
 * Retorna o admin autenticado. Usado pelo painel logo após o login
 * para confirmar que o usuário tem acesso (403 caso contrário).
 */
exports.me = (req, res) =>
  success(res, {
    user_id: req.user.id,
    email: req.user.email,
    role: req.adminRole,
  });
