require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestUser, deleteTestUser, supabase } = require('./helpers/seed');

let testUser;
let accessToken;
let progressId;

beforeAll(async () => {
  testUser = await createTestUser();

  // Login para obter token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password });
  accessToken = res.body.data?.access_token;

  // Insere row de progresso para a semana atual
  const { getWeekStart } = require('../src/utils/dateUtils');
  const weekStart = getWeekStart();

  // Precisamos de um challenge_id real — busca o primeiro desafio ativo
  const { data: challenges } = await supabase
    .from('weekly_challenges')
    .select('id')
    .limit(1);

  if (challenges?.length > 0) {
    const { data } = await supabase
      .from('user_challenge_progress')
      .insert([
        {
          user_id: testUser.user.id,
          challenge_id: challenges[0].id,
          week_start: weekStart,
        },
      ])
      .select()
      .single();
    progressId = data?.id;
  }
});

afterAll(async () => {
  if (progressId) {
    await supabase.from('user_challenge_progress').delete().eq('id', progressId);
  }
  if (testUser?.user?.id) await deleteTestUser(testUser.user.id);
});

describe('PATCH /api/exercises/progress/mark-today', () => {
  it('401 — sem token', async () => {
    const res = await request(app).patch('/api/exercises/progress/mark-today');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('200 — marca dia com sucesso', async () => {
    if (!progressId) return; // sem dados de teste no banco, pula

    const res = await request(app)
      .patch('/api/exercises/progress/mark-today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.day_marked).toBeDefined();
    expect(typeof res.body.data.streak).toBe('number');
  });

  it('409 — tenta marcar o mesmo dia novamente (RNE-003)', async () => {
    if (!progressId) return;

    const res = await request(app)
      .patch('/api/exercises/progress/mark-today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_MARKED');
  });
});
