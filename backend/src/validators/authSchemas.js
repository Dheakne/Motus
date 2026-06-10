const Joi = require('joi');

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '"email" must be a valid email',
    'any.required': '"email" is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '"password" length must be at least 6 characters long',
    'any.required': '"password" is required',
  }),
});

exports.registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '"email" must be a valid email',
    'any.required': '"email" is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '"password" length must be at least 6 characters long',
    'any.required': '"password" is required',
  }),
  name: Joi.string().min(1).required().messages({
    'any.required': '"name" is required',
  }),
  lastName: Joi.string().min(1).required().messages({
    'any.required': '"lastName" is required',
  }),
  phone: Joi.string().allow('', null).optional(),
  birthDate: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Data de nascimento inválida. Use o formato DD/MM/YYYY',
    }),
  consent_terms: Joi.boolean(),
  consent_health_data: Joi.boolean(),
});
