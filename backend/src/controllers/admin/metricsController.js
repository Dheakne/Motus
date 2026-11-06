const handle = require('./handle');
const { getOverview, getEngagement } = require('../../services/admin/metricsService');

/**
 * GET /api/admin/metrics/overview
 * KPIs gerais da plataforma + crescimento de usuários (30 dias).
 */
exports.overview = handle(() => getOverview());

/**
 * GET /api/admin/metrics/engagement?range=7d|30d|90d
 * DAU/WAU/MAU, média de dias marcados na semana e sessões concluídas por dia.
 */
exports.engagement = handle((req) => getEngagement(req.query.range));
