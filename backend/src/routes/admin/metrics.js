const router = require('express').Router();
const { overview, engagement } = require('../../controllers/admin/metricsController');

router.get('/overview', overview);
router.get('/engagement', engagement);

module.exports = router;
