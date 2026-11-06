const router = require('express').Router();
const validate = require('../../middleware/validate');
const { updateReportSchema } = require('../../validators/adminSchemas');
const { list, update } = require('../../controllers/admin/reportsController');

router.get('/', list);
router.patch('/:id', validate.assign(updateReportSchema), update);

module.exports = router;
