module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.details.map((d) => d.message).join('; '),
    });
  }
  next();
};

/**
 * Igual ao validate, mas substitui req.body pelo valor tratado pelo Joi
 * (trim, conversão de tipos, string vazia → null etc.). Usado nas rotas do painel admin.
 */
module.exports.assign = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.details.map((d) => d.message).join('; '),
    });
  }
  req.body = value;
  next();
};
