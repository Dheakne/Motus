require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestUser, deleteTestUser, supabase } = require('./helpers/seed');

let testUser;
let accessToken;

beforeAll(async () => {
  testUser = await createTestUser();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password });
  accessToken = res.body.data?.access_token;
});

afterAll(async () => {
  if (testUser?.user?.id) {
    await supabase.from('admin_users').delete().eq('user_id', testUser.user.id);
    await deleteTestUser(testUser.user.id);
  }
});

describe('Rotas /api/admin', () => {
  it('401 — sem token', async () => {
    const res = await request(app).get('/api/admin/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('403 — usuário comum não acessa o painel', async () => {
    const res = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('403 — usuário comum não acessa métricas', async () => {
    const res = await request(app)
      .get('/api/admin/metrics/overview')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  describe('como admin', () => {
    beforeAll(async () => {
      await supabase.from('admin_users').insert({ user_id: testUser.user.id, role: 'admin' });
    });

    it('200 — /me retorna o papel do admin', async () => {
      const res = await request(app)
        .get('/api/admin/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ user_id: testUser.user.id, role: 'admin' });
    });

    it('200 — /metrics/overview retorna KPIs numéricos', async () => {
      const res = await request(app)
        .get('/api/admin/metrics/overview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.total_users).toBe('number');
      expect(res.body.data.total_users).toBeGreaterThan(0);
      expect(typeof res.body.data.premium_rate).toBe('number');
    });
  });

  it('CORS — origem não autorizada não recebe Allow-Origin', async () => {
    const res = await request(app)
      .options('/api/admin/me')
      .set('Origin', 'https://site-qualquer.com');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
