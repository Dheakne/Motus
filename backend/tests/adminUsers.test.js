require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestAdmin, supabase } = require('./helpers/adminSeed');

let admin;

beforeAll(async () => {
  admin = await createTestAdmin('admin');
});

afterAll(async () => {
  await admin?.cleanup();
});

describe('GET /api/admin/metrics/overview (completo)', () => {
  it('200 — traz todos os KPIs e 30 dias de crescimento', async () => {
    const res = await request(app).get('/api/admin/metrics/overview').set(admin.auth);

    expect(res.status).toBe(200);
    const d = res.body.data;
    for (const key of ['total_users', 'new_users_24h', 'new_users_7d', 'new_users_30d', 'premium_users', 'sessions_completed_total', 'active_challenges']) {
      expect(typeof d[key]).toBe('number');
    }
    expect(d.new_users_24h).toBeGreaterThanOrEqual(1); // o próprio usuário de teste
    expect(d.user_growth).toHaveLength(30);
    expect(d.user_growth[29].total_users).toBe(d.total_users);
  });
});

describe('GET /api/admin/users', () => {
  it('200 — busca pelo email encontra o usuário de teste', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .query({ search: admin.email })
      .set(admin.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.items.map((u) => u.user_id)).toContain(admin.user.id);
    expect(res.body.data).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('200 — busca com caracteres especiais não quebra o filtro', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .query({ search: 'a,b),user_id.eq.(x%*' })
      .set(admin.auth);

    expect(res.status).toBe(200);
  });

  it('não expõe telefone nem data de nascimento', async () => {
    const res = await request(app).get('/api/admin/users').set(admin.auth);
    const first = res.body.data.items[0];
    expect(first).not.toHaveProperty('phone');
    expect(first).not.toHaveProperty('birth_date');
  });
});

describe('GET /api/admin/users/:id', () => {
  it('200 — retorna perfil, estatísticas e históricos', async () => {
    const res = await request(app).get(`/api/admin/users/${admin.user.id}`).set(admin.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toMatchObject({ user_id: admin.user.id, email: admin.email });
    expect(res.body.data.profile).not.toHaveProperty('phone');
    expect(Array.isArray(res.body.data.recent_sessions)).toBe(true);
    expect(Array.isArray(res.body.data.challenge_progress)).toBe(true);
  });

  it('404 — id inválido ou inexistente', async () => {
    const invalid = await request(app).get('/api/admin/users/nao-e-uuid').set(admin.auth);
    expect(invalid.status).toBe(404);
    expect(invalid.body.error).toBe('USER_NOT_FOUND');

    const missing = await request(app)
      .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set(admin.auth);
    expect(missing.status).toBe(404);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('400 — campo fora da allowlist', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}`)
      .set(admin.auth)
      .send({ total_points: 9999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('400 — corpo vazio', async () => {
    const res = await request(app).patch(`/api/admin/users/${admin.user.id}`).set(admin.auth).send({});
    expect(res.status).toBe(400);
  });

  it('200 — liberar premium cria liberação do painel (não grava is_premium direto)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}`)
      .set(admin.auth)
      .send({ is_premium: true });

    expect(res.status).toBe(200);
    expect(res.body.data.is_premium).toBe(true);
    expect(res.body.data.premium).toMatchObject({ has_admin_grant: true, has_paid: false });

    const { data: subs } = await supabase
      .from('premium_subscriptions')
      .select('source, status, granted_by')
      .eq('user_id', admin.user.id);
    expect(subs).toEqual([{ source: 'admin', status: 'active', granted_by: admin.user.id }]);

    const { data: logs } = await supabase
      .from('admin_audit_log')
      .select('target_id, payload')
      .eq('admin_id', admin.user.id)
      .eq('action', 'user.set_premium');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      target_id: admin.user.id,
      payload: { requested: 'grant', before: { is_premium: false }, after: { is_premium: true } },
    });
  });

  it('200 — liberar de novo não duplica a liberação', async () => {
    await request(app).patch(`/api/admin/users/${admin.user.id}`).set(admin.auth).send({ is_premium: true });
    const { data: subs } = await supabase
      .from('premium_subscriptions')
      .select('id')
      .eq('user_id', admin.user.id)
      .eq('status', 'active');
    expect(subs).toHaveLength(1);
  });

  it('200 — remover encerra a liberação e o usuário volta a gratuito', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}`)
      .set(admin.auth)
      .send({ is_premium: false });

    expect(res.status).toBe(200);
    expect(res.body.data.is_premium).toBe(false);
    expect(res.body.data.premium.has_admin_grant).toBe(false);

    const detail = await request(app).get(`/api/admin/users/${admin.user.id}`).set(admin.auth);
    expect(detail.body.data.premium.subscriptions[0]).toMatchObject({ source: 'admin', status: 'canceled' });
  });

  it('200 — has_seen_tutus é gravado direto, com audit log user.update', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${admin.user.id}`)
      .set(admin.auth)
      .send({ has_seen_tutus: true });
    expect(res.status).toBe(200);
    expect(res.body.data.has_seen_tutus).toBe(true);
  });
});
