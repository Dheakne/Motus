const { success, error } = require('../../utils/responses');

/**
 * Envolve um handler do painel admin no padrão de resposta do backend:
 * sucesso → { success, data }; erro de negócio ({ status, code }) → resposta padronizada;
 * qualquer outro erro → errorHandler (500).
 * @param {(req: object) => Promise<object>} fn - Recebe req e retorna o "data" da resposta
 * @param {number} [statusCode]
 */
module.exports = (fn, statusCode = 200) => async (req, res, next) => {
  try {
    const data = await fn(req);
    return success(res, data, statusCode);
  } catch (err) {
    if (err.status && err.code) {
      return error(res, err.status, err.code, err.message);
    }
    next(err);
  }
};
