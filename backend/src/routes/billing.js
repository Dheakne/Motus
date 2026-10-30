const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { checkoutSchema } = require('../validators/billingSchemas');
const { checkout, cancel, resume, checkoutReturn } = require('../controllers/billingController');

router.post('/checkout', authMiddleware, validate(checkoutSchema), checkout);
router.post('/cancel', authMiddleware, cancel);
router.post('/resume', authMiddleware, resume);
router.get('/return', checkoutReturn);

module.exports = router;
