const logger = require('../utils/logger');

module.exports = (err, req, res, _next) => {
  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  });
};
