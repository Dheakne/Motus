const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { markToday } = require('../controllers/exerciseController');

router.patch('/progress/mark-today', authMiddleware, markToday);

module.exports = router;
