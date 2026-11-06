require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestAdmin, supabase } = require('./helpers/adminSeed');

// O banco de teste é o mesmo do app: todo conteúdo criado aqui nasce inativo
// (não aparece para usuários) e é apagado no afterAll.
let admin;
const created = { sessions: [], categories: [], challenges: [] };

beforeAll(async () => {
  admin = await createTestAdmin('admin');
});

afterAll(async () => {
  if (created.sessions.length) await supabase.from('sessions').delete().in('id', created.sessions);
  if (created.challenges.length) await supabase.from('weekly_challenges').delete().in('id', created.challenges);
  if (created.categories.length) await supabase.from('categories').delete().in('id', created.categories);
  await admin?.cleanup();
});

describe('Sessões de áudio', () => {
  let sessionId;

  it('400 — categoria fora do CHECK do banco', async () => {
    const res = await request(app)
      .post('/api/admin/content/sessions')
      .set(admin.auth)
      .send({ title: 'TESTE', duration: 5, audio_url: 'https://example.com/a.mp3', category: 'sono' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('201 — cria sessão inativa', async () => {
    const res = await request(app)
      .post('/api/admin/content/sessions')
      .set(admin.auth)
      .send({
        title: '  TESTE automatizado - não usar  ',
        duration: 5,
        audio_url: 'https://example.com/teste.mp3',
        category: 'meditacao',
        is_active: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'TESTE automatizado - não usar', is_active: false });
    sessionId = res.body.data.id;
    created.sessions.push(sessionId);
  });

  it('200 — lista com contagem de conclusões e filtro por status', async () => {
    const res = await request(app).get('/api/admin/content/sessions').query({ status: 'inactive' }).set(admin.auth);
    expect(res.status).toBe(200);
    const mine = res.body.data.find((s) => s.id === sessionId);
    expect(mine).toMatchObject({ completions: 0, is_active: false });
    expect(res.body.data.every((s) => s.is_active === false)).toBe(true);
  });

  it('200 — edita e registra antes/depois no audit log', async () => {
    const res = await request(app)
      .patch(`/api/admin/content/sessions/${sessionId}`)
      .set(admin.auth)
      .send({ duration: 7 });
    expect(res.status).toBe(200);
    expect(res.body.data.duration).toBe(7);

    const { data: logs } = await supabase
      .from('admin_audit_log')
      .select('payload')
      .eq('admin_id', admin.user.id)
      .eq('action', 'session.update');
    expect(logs[0].payload).toEqual({ before: { duration: 5 }, after: { duration: 7 } });
  });

  it('200 — DELETE só desativa (soft delete)', async () => {
    const res = await request(app).delete(`/api/admin/content/sessions/${sessionId}`).set(admin.auth);
    expect(res.status).toBe(200);
    const { data } = await supabase.from('sessions').select('id, is_active').eq('id', sessionId).single();
    expect(data.is_active).toBe(false);
  });

  it('200 — URL de áudio para ouvir no painel', async () => {
    const res = await request(app).get(`/api/admin/content/sessions/${sessionId}/audio-url`).set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe('https://example.com/teste.mp3');
  });

  it('404 — sessão inexistente', async () => {
    const res = await request(app)
      .patch('/api/admin/content/sessions/999999999')
      .set(admin.auth)
      .send({ duration: 3 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });

  it('upload-url — recusa extensão que não é áudio e prepara upload de mp3', async () => {
    const bad = await request(app)
      .post('/api/admin/content/sessions/upload-url')
      .set(admin.auth)
      .send({ filename: 'script.exe' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('INVALID_AUDIO_FILE');

    const ok = await request(app)
      .post('/api/admin/content/sessions/upload-url')
      .set(admin.auth)
      .send({ filename: 'meditacao.mp3', content_type: 'audio/mpeg' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.path).toMatch(/^sessions\/\d{4}\/[0-9a-f-]+\.mp3$/);
    expect(ok.body.data.token).toBeTruthy();
    expect(ok.body.data.public_url).toMatch(/^https:\/\//);
  });
});

describe('Categorias', () => {
  let categoryId;

  it('400 — cor em formato inválido', async () => {
    const res = await request(app)
      .post('/api/admin/content/categories')
      .set(admin.auth)
      .send({ title: 'TESTE', color: 'azul' });
    expect(res.status).toBe(400);
  });

  it('201 → 200 — cria, edita e exclui categoria sem sessões', async () => {
    const createRes = await request(app)
      .post('/api/admin/content/categories')
      .set(admin.auth)
      .send({ title: 'TESTE automatizado', color: '#1066E7', icon_emoji: '🧪', order: 999 });
    expect(createRes.status).toBe(201);
    categoryId = createRes.body.data.id;
    created.categories.push(categoryId);

    const list = await request(app).get('/api/admin/content/categories').set(admin.auth);
    expect(list.body.data.find((c) => c.id === categoryId)).toMatchObject({ sessions_count: 0 });

    // Para limpar um campo opcional o painel envia null
    const clearRes = await request(app)
      .patch(`/api/admin/content/categories/${categoryId}`)
      .set(admin.auth)
      .send({ icon_emoji: null });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.icon_emoji).toBeNull();

    const delRes = await request(app).delete(`/api/admin/content/categories/${categoryId}`).set(admin.auth);
    expect(delRes.status).toBe(200);
  });

  it('409 — não exclui categoria com sessões vinculadas', async () => {
    const cat = await request(app)
      .post('/api/admin/content/categories')
      .set(admin.auth)
      .send({ title: 'TESTE com sessão', order: 998 });
    created.categories.push(cat.body.data.id);

    const session = await request(app)
      .post('/api/admin/content/sessions')
      .set(admin.auth)
      .send({
        title: 'TESTE vinculada',
        duration: 1,
        audio_url: 'https://example.com/x.mp3',
        category: 'meditacao',
        category_id: cat.body.data.id,
        is_active: false,
      });
    created.sessions.push(session.body.data.id);

    const res = await request(app).delete(`/api/admin/content/categories/${cat.body.data.id}`).set(admin.auth);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('CATEGORY_IN_USE');
  });
});

describe('Exercícios semanais', () => {
  it('cria inativo, edita, desativa e aparece nas métricas', async () => {
    const createRes = await request(app)
      .post('/api/admin/content/challenges')
      .set(admin.auth)
      .send({
        title: 'TESTE automatizado - não usar',
        category: 'Respiração',
        duration_minutes: 5,
        tips: 'Dica 1\nDica 2',
        description: '',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toMatchObject({ is_active: false, description: null });
    const id = createRes.body.data.id;
    created.challenges.push(id);

    const patchRes = await request(app)
      .patch(`/api/admin/content/challenges/${id}`)
      .set(admin.auth)
      .send({ duration_minutes: 10 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.duration_minutes).toBe(10);

    const list = await request(app).get('/api/admin/content/challenges').set(admin.auth);
    expect(list.body.data.find((c) => c.id === id)).toMatchObject({ participants: 0, avg_days_completed: 0 });

    const delRes = await request(app).delete(`/api/admin/content/challenges/${id}`).set(admin.auth);
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.is_active).toBe(false);

    const metrics = await request(app).get('/api/admin/metrics/challenges').set(admin.auth);
    expect(metrics.status).toBe(200);
    expect(metrics.body.data.challenges.some((c) => c.id === id)).toBe(true);
  });
});

describe('GET /api/admin/metrics/content', () => {
  it('200 — top sessões e conclusões por categoria', async () => {
    const res = await request(app).get('/api/admin/metrics/content').set(admin.auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.top_sessions)).toBe(true);
    expect(res.body.data.top_sessions.length).toBeLessThanOrEqual(10);
    expect(Array.isArray(res.body.data.completions_by_category)).toBe(true);
  });
});
