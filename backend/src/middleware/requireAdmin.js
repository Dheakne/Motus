const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Libera a rota apenas para usuários cadastrados em admin_users.
 * Deve ser encadeado depois do middleware auth (depende de req.user).
 * Popula req.adminRole com 'admin' ou 'superadmin'.
 */
module.exports = async (req, res, next) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, userId: req.user.id }, 'Erro ao verificar admin_users');
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
    });
  }

  if (!data) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Acesso restrito a administradores',
    });
  }

  req.adminRole = data.role;
  next();
};
