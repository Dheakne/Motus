const Joi = require('joi');

exports.checkoutSchema = Joi.object({
  plan: Joi.string().valid('monthly', 'annual').required().messages({
    'any.only': '"plan" must be one of [monthly, annual]',
    'any.required': '"plan" is required',
  }),
  return_url: Joi.string().max(2048).optional(),
});
