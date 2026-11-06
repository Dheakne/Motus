const router = require('express').Router();
const validate = require('../../middleware/validate');
const { updateUserSchema } = require('../../validators/adminSchemas');
const { list, detail, update } = require('../../controllers/admin/usersController');

router.get('/', list);
router.get('/:id', detail);
router.patch('/:id', validate(updateUserSchema), update);

module.exports = router;
