/**
 * Libera a rota só para superadmin. Deve vir depois do requireAdmin (depende de req.adminRole).
 * Usa um código próprio (SUPERADMIN_REQUIRED) para o painel não confundir com
 * "não é admin" (FORBIDDEN), que encerra a sessão.
 */
module.exports = (req, res, next) => {
  if (req.adminRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'SUPERADMIN_REQUIRED',
      message: 'Acesso restrito a superadmins',
    });
  }
  next();
};
