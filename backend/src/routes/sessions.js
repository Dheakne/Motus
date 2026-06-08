const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getSession } = require('../controllers/sessionController');

router.get('/:id', authMiddleware, getSession);

module.exports = router;
