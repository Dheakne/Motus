const { markTodayProgress } = require('../services/exerciseService');
const { success, error } = require('../utils/responses');

/**
 * PATCH /api/exercises/progress/mark-today
 * Marca o dia atual como concluído no exercício semanal do usuário.
 * Requer autenticação via Bearer token.
 */
exports.markToday = async (req, res, next) => {
  try {
    const data = await markTodayProgress(req.user.id);
    return success(res, data);
  } catch (err) {
    if (err.status && err.code) {
      return error(res, err.status, err.code, err.message);
    }
    next(err);
  }
};
