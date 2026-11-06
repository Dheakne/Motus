const handle = require('./handle');
const { parsePagination } = require('../../utils/adminQuery');
const { listReports, updateReportStatus } = require('../../services/admin/reportsService');

/** GET /api/admin/reports?status=open|in_progress|resolved&page= */
exports.list = handle(async (req) => {
  const { page, pageSize, from, to } = parsePagination(req.query);
  const result = await listReports({ status: req.query.status, from, to });
  return { ...result, page, pageSize };
});

/** PATCH /api/admin/reports/:id — { status } */
exports.update = handle((req) => updateReportStatus(req.user.id, req.params.id, req.body.status));
