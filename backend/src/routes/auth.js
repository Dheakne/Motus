const router = require('express').Router();
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/authSchemas');
const { login, register } = require('../controllers/authController');

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);

module.exports = router;
