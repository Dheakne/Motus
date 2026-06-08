require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestUser, deleteTestUser, supabase } = require('./helpers/seed');

let testUser;
let accessToken;
let freeSessionId;
let premiumSessionId;

beforeAll(async () => {
  testUser = await createTestUser();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password });
  accessToken = res.body.data?.access_token;

  // Busca sessão gratuita
  const { data: freeSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('is_premium', false)
    .limit(1);
  if (freeSessions?.length > 0) freeSessionId = freeSessions[0].id;

  // Busca sessão premium
  const { data: premiumSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('is_premium', true)
    .limit(1);
  if (premiumSessions?.length > 0) premiumSessionId = premiumSessions[0].id;
});

afterAll(async () => {
  if (testUser?.user?.id) await deleteTestUser(testUser.user.id);
});

describe('GET /api/sessions/:id', () => {
  it('401 — sem token', async () => {
    const res = await request(app).get('/api/sessions/qualquer-id');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('404 — ID inexistente', async () => {
    const res = await request(app)
      .get('/api/sessions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });

  it('200 — sessão gratuita retorna dados', async () => {
    if (!freeSessionId) return;

    const res = await request(app)
      .get(`/api/sessions/${freeSessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.id).toBe(freeSessionId);
    expect(res.body.data.session.audio_url).toBeDefined();
  });

  it('403 — sessão premium para usuário não-premium', async () => {
    if (!premiumSessionId) return;

    const res = await request(app)
      .get(`/api/sessions/${premiumSessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PREMIUM_REQUIRED');
  });
});
