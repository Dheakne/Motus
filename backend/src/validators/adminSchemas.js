const Joi = require('joi');

// Joi recusa chaves desconhecidas por padrão: isso é a allowlist de campos editáveis
exports.updateUserSchema = Joi.object({
  is_premium: Joi.boolean(),
  has_seen_tutus: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'Informe ao menos um campo para atualizar' });

// Valores aceitos pelo CHECK de sessions.category (o app mapeia cada um para uma categoria da Home)
exports.SESSION_CATEGORIES = ['gratidao', 'atencao', 'meditacao', 'reflexao', 'descanso'];

// Texto opcional: string vazia vira null
const optionalText = (max) => Joi.string().trim().max(max).empty('').allow(null);
// Texto obrigatório no banco (NOT NULL): não aceita vazio nem null
const requiredText = (max) => Joi.string().trim().min(1).max(max);

const sessionFields = {
  title: Joi.string().trim().min(1).max(200),
  // Descrição curta exibida com a sessão (NOT NULL no banco)
  description: requiredText(500),
  full_description: optionalText(10000),
  duration: Joi.number().integer().min(1).max(600),
  audio_url: Joi.string().trim().min(1).max(2000),
  category: Joi.string().valid(...exports.SESSION_CATEGORIES),
  // Preenchido pelo backend a partir de category (NOT NULL no banco)
  category_id: Joi.string().guid(),
  is_premium: Joi.boolean(),
  is_active: Joi.boolean(),
};

exports.createSessionSchema = Joi.object({
  ...sessionFields,
  title: sessionFields.title.required(),
  description: sessionFields.description.required(),
  duration: sessionFields.duration.required(),
  audio_url: sessionFields.audio_url.required(),
  category: sessionFields.category.required(),
});

exports.updateSessionSchema = Joi.object(sessionFields).min(1);

exports.audioUploadSchema = Joi.object({
  filename: Joi.string().trim().min(1).max(200).required(),
  content_type: Joi.string().trim().max(100).allow('', null),
});

const categoryFields = {
  title: Joi.string().trim().min(1).max(60),
  // description, color e icon_emoji são NOT NULL no banco
  description: requiredText(100),
  color: Joi.string().trim().pattern(/^#[0-9A-Fa-f]{6}$/)
    .messages({ 'string.pattern.base': 'Cor deve estar no formato #RRGGBB' }),
  icon_emoji: requiredText(16),
  order: Joi.number().integer().min(0).max(1000),
};

exports.createCategorySchema = Joi.object({
  ...categoryFields,
  title: categoryFields.title.required(),
  description: categoryFields.description.required(),
  color: categoryFields.color.required(),
  icon_emoji: categoryFields.icon_emoji.required(),
});

exports.updateCategorySchema = Joi.object(categoryFields).min(1);

const challengeFields = {
  title: Joi.string().trim().min(1).max(200),
  // description, discoveries e tips são NOT NULL no banco. Um item por linha (o app separa por \n)
  description: requiredText(5000),
  discoveries: requiredText(5000),
  tips: requiredText(5000),
  duration_minutes: Joi.number().integer().min(1).max(600),
  category: Joi.string().trim().min(1).max(60),
  is_free: Joi.boolean(),
  is_active: Joi.boolean(),
};

exports.createChallengeSchema = Joi.object({
  ...challengeFields,
  title: challengeFields.title.required(),
  description: challengeFields.description.required(),
  discoveries: challengeFields.discoveries.required(),
  tips: challengeFields.tips.required(),
  duration_minutes: challengeFields.duration_minutes.required(),
  category: challengeFields.category.required(),
});

exports.updateChallengeSchema = Joi.object(challengeFields).min(1);

exports.REPORT_STATUSES = ['open', 'in_progress', 'resolved'];

exports.updateReportSchema = Joi.object({
  status: Joi.string().valid(...exports.REPORT_STATUSES).required(),
});

exports.grantAdminSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid('admin', 'superadmin').default('admin'),
});
