const handle = require('./handle');
const admins = require('../../services/admin/adminsService');

/** GET /api/admin/admins */
exports.list = handle(() => admins.listAdmins());

/** POST /api/admin/admins — { email, role } */
exports.grant = handle((req) => admins.grantAdmin(req.user.id, req.body), 201);

/** DELETE /api/admin/admins/:userId */
exports.revoke = handle((req) => admins.revokeAdmin(req.user.id, req.params.userId));

/** GET /api/admin/audit-log?page=&action= */
exports.auditLog = handle((req) => admins.listAuditLog(req.query));
