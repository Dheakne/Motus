const router = require('express').Router();
const authMiddleware = require('../../middleware/auth');
const requireAdmin = require('../../middleware/requireAdmin');
const { me } = require('../../controllers/admin/meController');
const metricsRoutes = require('./metrics');

// Todas as rotas do painel exigem token válido + registro em admin_users
router.use(authMiddleware, requireAdmin);

router.get('/me', me);
router.use('/metrics', metricsRoutes);

module.exports = router;
