const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getStatus } = require('../controllers/premiumController');

router.get('/status', authMiddleware, getStatus);

module.exports = router;
