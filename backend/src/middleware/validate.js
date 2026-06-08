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
