require('dotenv').config();
const Stripe = require('stripe');
const { PLAN_LOOKUP_KEYS } = require('../src/services/billingService');

const PLANS = [
  { plan: 'monthly', amount: 1300, interval: 'month', nickname: 'Mensal' },
  { plan: 'annual', amount: 10490, interval: 'year', nickname: 'Anual' },
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não definida no backend/.env');
  if (!key.startsWith('sk_test_')) {
    throw new Error('Use a chave de TESTE (sk_test_...). Este projeto não processa pagamentos reais.');
  }

  const stripe = new Stripe(key);
  const force = process.argv.includes('--force');

  const { data: existingPrices } = await stripe.prices.list({
    lookup_keys: Object.values(PLAN_LOOKUP_KEYS),
    active: true,
  });

  let productId = existingPrices[0]?.product;
  if (!productId) {
    const product = await stripe.products.create({
      name: 'Motus Premium',
      description: 'Biblioteca completa de áudios e exercícios semanais ilimitados.',
    });
    productId = product.id;
    console.log(`Produto criado: ${productId}`);
  }

  for (const { plan, amount, interval, nickname } of PLANS) {
    const lookupKey = PLAN_LOOKUP_KEYS[plan];
    const existing = existingPrices.find((p) => p.lookup_key === lookupKey);

    if (existing && !force) {
      console.log(`${nickname}: já existe (${existing.id}, R$ ${(existing.unit_amount / 100).toFixed(2)})`);
      continue;
    }

    const price = await stripe.prices.create({
      product: typeof productId === 'string' ? productId : productId.id,
      currency: 'brl',
      unit_amount: amount,
      recurring: { interval },
      nickname,
      lookup_key: lookupKey,
      transfer_lookup_key: true,
    });
    if (existing) await stripe.prices.update(existing.id, { active: false });

    console.log(`${nickname}: criado (${price.id}, R$ ${(amount / 100).toFixed(2)})`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
