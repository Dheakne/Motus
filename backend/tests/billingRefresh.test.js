jest.mock('../src/config/env', () => ({ stripeWebhookSecret: 'whsec_test_fake', frontendUrl: '*' }));

jest.mock('../src/config/stripe', () => ({
  subscriptions: { retrieve: jest.fn() },
}));

const mockRows = jest.fn();
const mockUpsert = jest.fn();
jest.mock('../src/config/supabase', () => {
  const query = {
    select: () => query,
    eq: () => query,
    in: () => Promise.resolve({ data: mockRows(), error: null }),
    upsert: (...args) => mockUpsert(...args),
  };
  return { from: jest.fn(() => query) };
});

jest.mock('../src/services/premiumService', () => ({
  syncUserPremium: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('../src/utils/logger', () => ({ error: jest.fn(), warn: jest.fn() }));

const stripe = require('../src/config/stripe');
const { syncUserPremium } = require('../src/services/premiumService');
const { refreshStripeSubscriptions } = require('../src/services/billingService');

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
});

describe('refreshStripeSubscriptions', () => {
  it('corrige o banco quando o webhook de cancelamento se perdeu', async () => {
    mockRows.mockReturnValue([{ stripe_subscription_id: 'sub_test' }]);
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_test',
      status: 'canceled',
      ended_at: 1793338172,
      metadata: { user_id: 'u1' },
      items: { data: [{ current_period_end: 1795474223, price: { recurring: { interval: 'month' } } }] },
    });

    await refreshStripeSubscriptions('u1');

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test');
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({
      stripe_subscription_id: 'sub_test',
      status: 'canceled',
      canceled_at: new Date(1793338172 * 1000).toISOString(),
    });
    expect(syncUserPremium).toHaveBeenCalledWith('u1');
  });

  it('não chama o Stripe quando não há assinatura ativa', async () => {
    mockRows.mockReturnValue([]);

    await refreshStripeSubscriptions('u1');

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
