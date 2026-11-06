require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestAdmin } = require('./helpers/adminSeed');

let admin;

beforeAll(async () => {
  admin = await createTestAdmin('admin');
});

afterAll(async () => {
  await admin?.cleanup();
});

describe('GET /api/admin/metrics/engagement', () => {
  it.each([
    ['7d', 7],
    ['30d', 30],
    ['90d', 90],
  ])('200 — range %s devolve %i dias de série', async (range, days) => {
    const res = await request(app).get('/api/admin/metrics/engagement').query({ range }).set(admin.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.range).toBe(range);
    expect(res.body.data.dau).toHaveLength(days);
    expect(res.body.data.sessions_completed_by_day).toHaveLength(days);
    expect(res.body.data.mau).toBeGreaterThanOrEqual(res.body.data.wau);
    expect(res.body.data.avg_streak).toBeGreaterThanOrEqual(0);
    expect(res.body.data.avg_streak).toBeLessThanOrEqual(7);
  });

  it('200 — range inválido cai no padrão de 30 dias', async () => {
    const res = await request(app).get('/api/admin/metrics/engagement').query({ range: 'xyz' }).set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.range).toBe('30d');
  });
});
