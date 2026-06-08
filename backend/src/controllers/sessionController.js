const { getSessionById } = require('../services/sessionService');
const { success, error } = require('../utils/responses');

/**
 * GET /api/sessions/:id
 * Retorna uma sessão de áudio com URL assinada.
 * Verifica acesso premium quando necessário.
 * Requer autenticação via Bearer token.
 */
exports.getSession = async (req, res, next) => {
  try {
    const data = await getSessionById(req.params.id, req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.status && err.code) {
      return error(res, err.status, err.code, err.message);
    }
    next(err);
  }
};
