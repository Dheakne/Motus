require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../server');
const { createTestUser, deleteTestUser } = require('./helpers/seed');

let testUser;

beforeAll(async () => {
  testUser = await createTestUser();
});

afterAll(async () => {
  if (testUser?.user?.id) await deleteTestUser(testUser.user.id);
});

describe('POST /api/auth/login', () => {
  it('200 — credenciais válidas retornam token e perfil', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.profile.display_name).toBe('Test');
  });

  it('400 — email malformado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao_e_email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('400 — senha com menos de 6 chars', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('401 — senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('400 — body vazio', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  const newEmail = `register_test_${Date.now()}@motus-test.com`;
  let createdUserId;

  afterAll(async () => {
    if (createdUserId) await deleteTestUser(createdUserId);
  });

  it('201 — cadastro completo retorna token e perfil', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: newEmail,
      password: 'senha123',
      name: 'Sofia',
      lastName: 'Silva',
      phone: '11999999999',
      birthDate: '15/01/1990',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.display_name).toBe('Sofia');
    expect(res.body.data.profile.birth_date).toBe('1990-01-15');
    createdUserId = res.body.data.user.id;
  });

  it('400 — data de nascimento inválida', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `inv_date_${Date.now()}@motus-test.com`,
      password: 'senha123',
      name: 'Carlos',
      lastName: 'Porto',
      birthDate: '99/99/9999',
    });

    expect(res.status).toBe(400);
  });

  it('400 — campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: newEmail });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});
