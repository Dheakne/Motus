const router = require('express').Router();
const { overview } = require('../../controllers/admin/metricsController');

router.get('/overview', overview);

module.exports = router;
