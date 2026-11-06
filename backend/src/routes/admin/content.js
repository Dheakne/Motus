const router = require('express').Router();
const validate = require('../../middleware/validate');
const s = require('../../validators/adminSchemas');
const c = require('../../controllers/admin/contentController');

router.get('/sessions', c.listSessions);
router.post('/sessions', validate.assign(s.createSessionSchema), c.createSession);
router.post('/sessions/upload-url', validate.assign(s.audioUploadSchema), c.createAudioUpload);
router.get('/sessions/:id/audio-url', c.getSessionAudioUrl);
router.patch('/sessions/:id', validate.assign(s.updateSessionSchema), c.updateSession);
router.delete('/sessions/:id', c.deactivateSession);

router.get('/categories', c.listCategories);
router.post('/categories', validate.assign(s.createCategorySchema), c.createCategory);
router.patch('/categories/:id', validate.assign(s.updateCategorySchema), c.updateCategory);
router.delete('/categories/:id', c.deleteCategory);

router.get('/challenges', c.listChallenges);
router.post('/challenges', validate.assign(s.createChallengeSchema), c.createChallenge);
router.patch('/challenges/:id', validate.assign(s.updateChallengeSchema), c.updateChallenge);
router.delete('/challenges/:id', c.deactivateChallenge);

module.exports = router;
