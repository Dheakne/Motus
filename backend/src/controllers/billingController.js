const { apiPublicUrl } = require('../config/env');
const logger = require('../utils/logger');
const {
  isAllowedReturnUrl,
  createCheckoutSession,
  syncCheckoutSession,
  cancelSubscription,
  resumeSubscription,
  handleWebhook,
} = require('../services/billingService');
const { success, error } = require('../utils/responses');

function handleKnownError(err, res, next) {
  if (err.status && err.code) {
    return error(res, err.status, err.code, err.message);
  }
  next(err);
}

exports.checkout = async (req, res, next) => {
  try {
    const apiBaseUrl = apiPublicUrl || `${req.protocol}://${req.get('host')}`;
    const data = await createCheckoutSession(
      req.user,
      { plan: req.body.plan, returnUrl: req.body.return_url },
      apiBaseUrl
    );
    return success(res, data, 201);
  } catch (err) {
    handleKnownError(err, res, next);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const data = await cancelSubscription(req.user.id);
    return success(res, data);
  } catch (err) {
    handleKnownError(err, res, next);
  }
};

exports.resume = async (req, res, next) => {
  try {
    const data = await resumeSubscription(req.user.id);
    return success(res, data);
  } catch (err) {
    handleKnownError(err, res, next);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const data = await handleWebhook(req.body, req.headers['stripe-signature']);
    return res.json(data);
  } catch (err) {
    handleKnownError(err, res, next);
  }
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function returnPage({ title, message, target }) {
  const safeTarget = target ? escapeHtml(target) : null;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${safeTarget ? `<meta http-equiv="refresh" content="0;url=${safeTarget}">` : ''}
<title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #F0F1F5; color: #1C1C1E; margin: 0;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
  main { background: #fff; border-radius: 24px; padding: 32px 24px; max-width: 360px; text-align: center; }
  h1 { font-size: 22px; margin: 0 0 12px; }
  p { color: #6E6E73; line-height: 1.5; margin: 0 0 24px; }
  a { display: inline-block; background: #1066E7; color: #fff; text-decoration: none;
      padding: 14px 28px; border-radius: 25px; font-weight: 600; }
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p>${message}</p>
  ${safeTarget ? `<a href="${safeTarget}">Voltar para o Motus</a>` : ''}
</main>
</body>
</html>`;
}

exports.checkoutReturn = async (req, res) => {
  const { status, session_id: sessionId, to } = req.query;
  const succeeded = status === 'success';

  if (succeeded && typeof sessionId === 'string') {
    try {
      await syncCheckoutSession(sessionId);
    } catch (err) {
      logger.error({ err, sessionId }, 'Erro ao sincronizar checkout no retorno');
    }
  }

  let target = null;
  if (typeof to === 'string' && isAllowedReturnUrl(to)) {
    const url = new URL(to);
    url.searchParams.set('checkout', succeeded ? 'success' : 'canceled');
    target = url.toString();
  }

  res.type('html').send(
    returnPage(
      succeeded
        ? {
            title: 'Assinatura confirmada!',
            message: 'Seu Motus Premium já está ativo. Volte para o app para aproveitar.',
            target,
          }
        : {
            title: 'Pagamento cancelado',
            message: 'Nenhuma cobrança foi feita. Você pode assinar quando quiser.',
            target,
          }
    )
  );
};
