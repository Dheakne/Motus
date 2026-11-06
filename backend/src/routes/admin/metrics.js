const router = require('express').Router();
const { overview, engagement } = require('../../controllers/admin/metricsController');
const { contentMetrics, challengeMetrics } = require('../../controllers/admin/contentController');

router.get('/overview', overview);
router.get('/engagement', engagement);
router.get('/content', contentMetrics);
router.get('/challenges', challengeMetrics);

module.exports = router;
