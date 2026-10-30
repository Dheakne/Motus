const supabase = require('../config/supabase');
const stripe = require('../config/stripe');
const { stripeWebhookSecret, frontendUrl } = require('../config/env');
const logger = require('../utils/logger');
const { syncUserPremium } = require('./premiumService');

const PLAN_LOOKUP_KEYS = {
  monthly: 'motus_premium_monthly',
  annual: 'motus_premium_annual',
};

const APP_SCHEMES = new Set(['exp:', 'exps:', 'motusapp:']);

function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function ensureConfigured() {
  if (!stripe) {
    throw httpError(503, 'BILLING_NOT_CONFIGURED', 'Pagamentos não configurados no servidor');
  }
}

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

function isAllowedReturnUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (APP_SCHEMES.has(url.protocol)) return true;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;

  if (frontendUrl && frontendUrl !== '*') {
    try {
      return new URL(frontendUrl).origin === url.origin;
    } catch {
      return false;
    }
  }
  return false;
}

function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

async function upsertStripeSubscription(subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    logger.warn({ subscriptionId: subscription.id }, 'Assinatura do Stripe sem metadata.user_id');
    return null;
  }

  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const now = new Date().toISOString();

  const { error } = await supabase.from('premium_subscriptions').upsert(
    {
      user_id: userId,
      source: 'stripe',
      plan: price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: mapStripeStatus(subscription.status),
      amount_cents: price?.unit_amount ?? null,
      currency: price?.currency ?? 'brl',
      stripe_customer_id:
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      stripe_subscription_id: subscription.id,
      cancel_at_period_end: !!(subscription.cancel_at_period_end || subscription.cancel_at),
      current_period_end: toIso(item?.current_period_end ?? subscription.current_period_end),
      started_at: toIso(subscription.start_date) ?? now,
      canceled_at: toIso(subscription.ended_at),
      updated_at: now,
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (error) throw error;

  return syncUserPremium(userId);
}

const priceCache = new Map();

async function getPrice(plan) {
  if (priceCache.has(plan)) return priceCache.get(plan);

  const { data } = await stripe.prices.list({
    lookup_keys: [PLAN_LOOKUP_KEYS[plan]],
    active: true,
    limit: 1,
  });

  if (!data.length) {
    throw httpError(
      503,
      'BILLING_NOT_CONFIGURED',
      'Plano não encontrado no Stripe. Rode "npm run stripe:setup" no backend.'
    );
  }

  priceCache.set(plan, data[0]);
  return data[0];
}

async function getOrCreateCustomer(user) {
  const { data } = await supabase
    .from('premium_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data?.[0]?.stripe_customer_id) return data[0].stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id },
  });
  return customer.id;
}

async function createCheckoutSession(user, { plan, returnUrl }, apiBaseUrl) {
  ensureConfigured();

  if (returnUrl && !isAllowedReturnUrl(returnUrl)) {
    throw httpError(400, 'VALIDATION_ERROR', 'return_url não permitida');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_premium')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.is_premium) {
    throw httpError(409, 'ALREADY_PREMIUM', 'Você já é premium');
  }

  const [price, customer] = await Promise.all([getPrice(plan), getOrCreateCustomer(user)]);

  const returnParams = returnUrl ? `&to=${encodeURIComponent(returnUrl)}` : '';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price: price.id, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id, plan } },
    metadata: { user_id: user.id, plan },
    locale: 'pt-BR',
    success_url: `${apiBaseUrl}/api/billing/return?status=success&session_id={CHECKOUT_SESSION_ID}${returnParams}`,
    cancel_url: `${apiBaseUrl}/api/billing/return?status=canceled${returnParams}`,
  });

  return { url: session.url };
}

async function syncCheckoutSession(checkoutSessionId) {
  ensureConfigured();

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  if (session.status !== 'complete' || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertStripeSubscription(subscription);
}

async function setCancelAtPeriodEnd(userId, cancelAtPeriodEnd) {
  ensureConfigured();

  const { data } = await supabase
    .from('premium_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('source', 'stripe')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);

  const subscriptionId = data?.[0]?.stripe_subscription_id;
  if (!subscriptionId) {
    throw httpError(404, 'NO_ACTIVE_SUBSCRIPTION', 'Nenhuma assinatura ativa encontrada');
  }

  let subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
  if (!cancelAtPeriodEnd && subscription.cancel_at) {
    subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at: '' });
  }

  try {
    await upsertStripeSubscription(subscription);
  } catch (err) {
    logger.error(
      { err, subscriptionId, cancelAtPeriodEnd },
      'Assinatura atualizada no Stripe, mas falhou ao gravar no banco; o webhook vai sincronizar'
    );
  }

  const item = subscription.items?.data?.[0];
  return {
    cancel_at_period_end: cancelAtPeriodEnd,
    current_period_end: toIso(item?.current_period_end ?? subscription.current_period_end),
  };
}

async function refreshStripeSubscriptions(userId) {
  if (!stripe) return;

  const { data, error } = await supabase
    .from('premium_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('source', 'stripe')
    .in('status', ['active', 'past_due', 'incomplete']);

  if (error) throw error;

  for (const row of data ?? []) {
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    await upsertStripeSubscription(subscription);
  }
}

function cancelSubscription(userId) {
  return setCancelAtPeriodEnd(userId, true);
}

function resumeSubscription(userId) {
  return setCancelAtPeriodEnd(userId, false);
}

async function handleWebhook(rawBody, signature) {
  ensureConfigured();
  if (!stripeWebhookSecret) {
    throw httpError(503, 'BILLING_NOT_CONFIGURED', 'STRIPE_WEBHOOK_SECRET não configurada');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch {
    throw httpError(400, 'INVALID_SIGNATURE', 'Assinatura do webhook inválida');
  }

  const object = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      if (object.mode === 'subscription') await syncCheckoutSession(object.id);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertStripeSubscription(await stripe.subscriptions.retrieve(object.id));
      break;
    default:
      break;
  }

  return { received: true };
}

module.exports = {
  PLAN_LOOKUP_KEYS,
  isAllowedReturnUrl,
  mapStripeStatus,
  createCheckoutSession,
  syncCheckoutSession,
  refreshStripeSubscriptions,
  cancelSubscription,
  resumeSubscription,
  handleWebhook,
};
