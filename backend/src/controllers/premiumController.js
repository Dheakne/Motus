const { getPremiumStatus } = require('../services/premiumService');
const { refreshStripeSubscriptions } = require('../services/billingService');
const logger = require('../utils/logger');
const { success } = require('../utils/responses');

exports.getStatus = async (req, res, next) => {
  try {
    try {
      await refreshStripeSubscriptions(req.user.id);
    } catch (err) {
      logger.error({ err, userId: req.user.id }, 'Erro ao conferir assinaturas no Stripe');
    }

    const data = await getPremiumStatus(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};
