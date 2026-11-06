const handle = require('./handle');
const content = require('../../services/admin/contentService');

// ─── Sessões de áudio ────────────────────────────────────────────────

/** GET /api/admin/content/sessions?category=&status=active|inactive|all */
exports.listSessions = handle((req) =>
  content.listSessions({ category: req.query.category, status: req.query.status })
);

/** POST /api/admin/content/sessions */
exports.createSession = handle((req) => content.createSession(req.user.id, req.body), 201);

/** PATCH /api/admin/content/sessions/:id */
exports.updateSession = handle((req) => content.updateSession(req.user.id, req.params.id, req.body));

/** DELETE /api/admin/content/sessions/:id — soft delete (is_active = false) */
exports.deactivateSession = handle((req) => content.deactivateSession(req.user.id, req.params.id));

/** POST /api/admin/content/sessions/upload-url — prepara upload direto para o Storage */
exports.createAudioUpload = handle((req) => content.createAudioUpload(req.body));

/** GET /api/admin/content/sessions/:id/audio-url — URL para ouvir no painel */
exports.getSessionAudioUrl = handle((req) => content.getSessionAudioUrl(req.params.id));

// ─── Categorias ──────────────────────────────────────────────────────

/** GET /api/admin/content/categories */
exports.listCategories = handle(() => content.listCategories());

/** POST /api/admin/content/categories */
exports.createCategory = handle((req) => content.createCategory(req.user.id, req.body), 201);

/** PATCH /api/admin/content/categories/:id */
exports.updateCategory = handle((req) => content.updateCategory(req.user.id, req.params.id, req.body));

/** DELETE /api/admin/content/categories/:id — só sem sessões vinculadas (409 caso contrário) */
exports.deleteCategory = handle((req) => content.deleteCategory(req.user.id, req.params.id));

// ─── Exercícios semanais ─────────────────────────────────────────────

/** GET /api/admin/content/challenges */
exports.listChallenges = handle(() => content.listChallenges());

/** POST /api/admin/content/challenges */
exports.createChallenge = handle((req) => content.createChallenge(req.user.id, req.body), 201);

/** PATCH /api/admin/content/challenges/:id */
exports.updateChallenge = handle((req) => content.updateChallenge(req.user.id, req.params.id, req.body));

/** DELETE /api/admin/content/challenges/:id — soft delete (is_active = false) */
exports.deactivateChallenge = handle((req) => content.deactivateChallenge(req.user.id, req.params.id));

// ─── Métricas ────────────────────────────────────────────────────────

/** GET /api/admin/metrics/content */
exports.contentMetrics = handle(() => content.getContentMetrics());

/** GET /api/admin/metrics/challenges */
exports.challengeMetrics = handle(() => content.getChallengeMetrics());
