const router = require('express').Router();
const authMiddleware = require('../../middleware/auth');
const requireAdmin = require('../../middleware/requireAdmin');
const requireSuperadmin = require('../../middleware/requireSuperadmin');
const { me } = require('../../controllers/admin/meController');
const { auditLog } = require('../../controllers/admin/adminsController');
const metricsRoutes = require('./metrics');
const usersRoutes = require('./users');
const contentRoutes = require('./content');
const reportsRoutes = require('./reports');
const adminsRoutes = require('./admins');

// Todas as rotas do painel exigem token válido + registro em admin_users
router.use(authMiddleware, requireAdmin);

router.get('/me', me);
router.use('/metrics', metricsRoutes);
router.use('/users', usersRoutes);
router.use('/content', contentRoutes);
router.use('/reports', reportsRoutes);

// Somente superadmin
router.use('/admins', requireSuperadmin, adminsRoutes);
router.get('/audit-log', requireSuperadmin, auditLog);

module.exports = router;
