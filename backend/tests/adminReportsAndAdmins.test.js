require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestAdmin, supabase } = require('./helpers/adminSeed');

let superadmin;
let admin;
let regular; // conta do app sem acesso ao painel
let reportId;

beforeAll(async () => {
  superadmin = await createTestAdmin('superadmin');
  admin = await createTestAdmin('admin');
  regular = await createTestAdmin(null);

  const { data } = await supabase
    .from('reports')
    .insert({ email: superadmin.email, type: 'Outro', subject: 'TESTE automatizado', description: 'Pode apagar' })
    .select('id')
    .single();
  reportId = data.id;
});

afterAll(async () => {
  if (reportId) await supabase.from('reports').delete().eq('id', reportId);
  // regular pode ter virado admin durante o teste; cleanup remove admin_users e audit log
  await Promise.all([regular?.cleanup(), admin?.cleanup()]);
  await superadmin?.cleanup();
});

describe('Relatos', () => {
  it('200 — lista com contagem por status (migration 008)', async () => {
    const res = await request(app).get('/api/admin/reports').query({ status: 'open' }).set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((r) => r.id === reportId)).toBe(true);
    expect(res.body.data.items.every((r) => r.status === 'open')).toBe(true);
    expect(Object.keys(res.body.data.counts).sort()).toEqual(['in_progress', 'open', 'resolved']);
  });

  it('400 — status inválido', async () => {
    const res = await request(app).patch(`/api/admin/reports/${reportId}`).set(admin.auth).send({ status: 'closed' });
    expect(res.status).toBe(400);
  });

  it('200 — admin marca como resolvido e o audit log registra', async () => {
    const res = await request(app).patch(`/api/admin/reports/${reportId}`).set(admin.auth).send({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('resolved');
    expect(res.body.data.updated_at).toBeTruthy();

    const { data: logs } = await supabase
      .from('admin_audit_log')
      .select('payload')
      .eq('admin_id', admin.user.id)
      .eq('action', 'report.update');
    expect(logs[0].payload).toEqual({ before: { status: 'open' }, after: { status: 'resolved' } });
  });
});

describe('Gestão de administradores (somente superadmin)', () => {
  it('403 SUPERADMIN_REQUIRED — admin comum não acessa', async () => {
    for (const path of ['/api/admin/admins', '/api/admin/audit-log']) {
      const res = await request(app).get(path).set(admin.auth);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('SUPERADMIN_REQUIRED');
    }
  });

  it('404 — email sem conta no app', async () => {
    const res = await request(app)
      .post('/api/admin/admins')
      .set(superadmin.auth)
      .send({ email: 'ninguem-aqui@motus-test.com' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('USER_NOT_FOUND');
  });

  it('201 — concede acesso por email (sem diferenciar maiúsculas) e a pessoa entra no painel', async () => {
    const res = await request(app)
      .post('/api/admin/admins')
      .set(superadmin.auth)
      .send({ email: regular.email.toUpperCase(), role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ user_id: regular.user.id, role: 'admin' });

    const me = await request(app).get('/api/admin/me').set(regular.auth);
    expect(me.status).toBe(200);
  });

  it('200 — lista mostra email e quem concedeu', async () => {
    const res = await request(app).get('/api/admin/admins').set(superadmin.auth);
    const granted = res.body.data.find((a) => a.user_id === regular.user.id);
    expect(granted).toMatchObject({ email: regular.email, created_by_email: superadmin.email });
  });

  it('400 — ninguém altera ou revoga o próprio acesso', async () => {
    const grantSelf = await request(app)
      .post('/api/admin/admins')
      .set(superadmin.auth)
      .send({ email: superadmin.email, role: 'admin' });
    expect(grantSelf.status).toBe(400);

    const revokeSelf = await request(app).delete(`/api/admin/admins/${superadmin.user.id}`).set(superadmin.auth);
    expect(revokeSelf.status).toBe(400);
    expect(revokeSelf.body.error).toBe('CANNOT_CHANGE_SELF');
  });

  it('200 — revoga e a pessoa perde o acesso', async () => {
    const res = await request(app).delete(`/api/admin/admins/${regular.user.id}`).set(superadmin.auth);
    expect(res.status).toBe(200);

    const me = await request(app).get('/api/admin/me').set(regular.auth);
    expect(me.status).toBe(403);
  });

  it('200 — histórico mostra as ações do superadmin, filtrável por tipo', async () => {
    const res = await request(app).get('/api/admin/audit-log').query({ action: 'admin' }).set(superadmin.auth);
    expect(res.status).toBe(200);
    const mine = res.body.data.items.filter((r) => r.admin_id === superadmin.user.id);
    expect(mine.map((r) => r.action)).toEqual(expect.arrayContaining(['admin.grant', 'admin.revoke']));
    expect(res.body.data.items.every((r) => r.action.startsWith('admin'))).toBe(true);
    expect(mine[0].admin_email).toBe(superadmin.email);
  });
});
