const handle = require('./handle');
const { getOverview, getEngagement } = require('../../services/admin/metricsService');
const { getPremiumReport } = require('../../services/premiumReportService');
const { daysAgoIso } = require('../../utils/metricsUtils');

const PREMIUM_PERIODS = new Set([7, 30, 90]);

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

/**
 * GET /api/admin/metrics/premium?days=7|30|90
 * Assinantes ativos (pagantes × liberados), planos, MRR, novos e cancelamentos no período.
 * Usa o premiumReportService (PLANO_PREMIUM.md, seção 9).
 */
exports.premium = handle((req) => {
  const days = PREMIUM_PERIODS.has(Number(req.query.days)) ? Number(req.query.days) : 30;
  return getPremiumReport({ from: daysAgoIso(days), to: new Date().toISOString() });
});
