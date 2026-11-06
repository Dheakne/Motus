const Joi = require('joi');

// Joi recusa chaves desconhecidas por padrão: isso é a allowlist de campos editáveis
exports.updateUserSchema = Joi.object({
  is_premium: Joi.boolean(),
  has_seen_tutus: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'Informe ao menos um campo para atualizar' });
