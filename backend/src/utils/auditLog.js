const supabase = require('../config/supabase');
const logger = require('./logger');

/**
 * Registra uma ação feita pelo painel admin em admin_audit_log.
 * Falha ao gravar o log não desfaz a ação: só registra o erro no logger.
 * @param {string} adminId - ID de quem executou
 * @param {string} action - Ex.: 'user.update', 'session.create'
 * @param {string} targetTable - Tabela afetada
 * @param {string|null} targetId - PK do registro afetado
 * @param {object|null} payload - Dados da alteração (antes/depois ou body)
 */
exports.logAdminAction = async (adminId, action, targetTable, targetId, payload = null) => {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_table: targetTable,
    target_id: targetId == null ? null : String(targetId),
    payload,
  });
  if (error) {
    logger.error({ err: error, adminId, action, targetTable, targetId }, 'Falha ao gravar admin_audit_log');
  }
};
