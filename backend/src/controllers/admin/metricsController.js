const { getOverview } = require('../../services/admin/metricsService');
const { success } = require('../../utils/responses');

/**
 * GET /api/admin/metrics/overview
 * KPIs gerais da plataforma.
 */
exports.overview = async (req, res, next) => {
  try {
    const data = await getOverview();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};
