const PERIOD_END = 1795474223;

function buildSubscription(overrides) {
  return {
    id: 'sub_test',
    status: 'active',
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: { user_id: 'u1' },
    items: {
      data: [
        {
          current_period_end: PERIOD_END,
          price: { unit_amount: 1300, currency: 'brl', recurring: { interval: 'month' } },
        },
      ],
    },
    ...overrides,
  };
}

jest.mock('../src/config/env', () => ({ stripeWebhookSecret: 'whsec_test_fake', frontendUrl: '*' }));

jest.mock('../src/config/stripe', () => ({
  subscriptions: { update: jest.fn() },
}));

const mockUpsert = jest.fn();
jest.mock('../src/config/supabase', () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => Promise.resolve({ data: [{ stripe_subscription_id: 'sub_test' }], error: null }),
    upsert: (...args) => mockUpsert(...args),
  };
  return { from: jest.fn(() => query) };
});

jest.mock('../src/services/premiumService', () => ({
  syncUserPremium: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../src/utils/logger', () => ({ error: jest.fn(), warn: jest.fn() }));

const stripe = require('../src/config/stripe');
const logger = require('../src/utils/logger');
const { cancelSubscription, resumeSubscription } = require('../src/services/billingService');

const periodEndIso = new Date(PERIOD_END * 1000).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
});

describe('cancelSubscription', () => {
  it('confirma o cancelamento mesmo se a gravação no banco falhar', async () => {
    stripe.subscriptions.update.mockResolvedValue(
      buildSubscription({ cancel_at_period_end: true, cancel_at: PERIOD_END })
    );
    mockUpsert.mockResolvedValue({
      error: { code: '42501', message: 'new row violates row-level security policy' },
    });

    const result = await cancelSubscription('u1');

    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test', { cancel_at_period_end: true });
    expect(result).toEqual({ cancel_at_period_end: true, current_period_end: periodEndIso });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('resumeSubscription', () => {
  it('desfaz o cancelamento sem criar cobrança nova', async () => {
    stripe.subscriptions.update.mockResolvedValue(buildSubscription());

    const result = await resumeSubscription('u1');

    expect(stripe.subscriptions.update).toHaveBeenCalledTimes(1);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test', { cancel_at_period_end: false });
    expect(result).toEqual({ cancel_at_period_end: false, current_period_end: periodEndIso });
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({ cancel_at_period_end: false, status: 'active' });
  });

  it('limpa cancel_at quando o Stripe mantém a data de cancelamento', async () => {
    stripe.subscriptions.update
      .mockResolvedValueOnce(buildSubscription({ cancel_at: PERIOD_END }))
      .mockResolvedValueOnce(buildSubscription());

    await resumeSubscription('u1');

    expect(stripe.subscriptions.update).toHaveBeenNthCalledWith(2, 'sub_test', { cancel_at: '' });
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({ cancel_at_period_end: false });
  });
});
