const handle = require('./handle');
const { getOverview } = require('../../services/admin/metricsService');

/**
 * GET /api/admin/metrics/overview
 * KPIs gerais da plataforma + crescimento de usuários (30 dias).
 */
exports.overview = handle(() => getOverview());
