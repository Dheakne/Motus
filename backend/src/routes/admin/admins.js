const router = require('express').Router();
const validate = require('../../middleware/validate');
const { grantAdminSchema } = require('../../validators/adminSchemas');
const { list, grant, revoke } = require('../../controllers/admin/adminsController');

router.get('/', list);
router.post('/', validate.assign(grantAdminSchema), grant);
router.delete('/:userId', revoke);

module.exports = router;
