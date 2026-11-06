const request = require('supertest');
const app = require('../../server');
const { createTestUser, deleteTestUser, supabase } = require('./seed');

/**
 * Cria um usuário de teste, faz login e (opcionalmente) dá papel de admin.
 * @param {'admin'|'superadmin'|null} role - null = usuário comum
 * @returns {Promise<{ user: object, email: string, token: string, auth: object, cleanup: () => Promise<void> }>}
 */
async function createTestAdmin(role = 'admin') {
  const testUser = await createTestUser();

  if (role) {
    const { error } = await supabase.from('admin_users').insert({ user_id: testUser.user.id, role });
    if (error) throw error;
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password });
  const token = res.body.data?.access_token;

  return {
    user: testUser.user,
    email: testUser.email,
    token,
    auth: { Authorization: `Bearer ${token}` },
    cleanup: () => deleteTestUser(testUser.user.id),
  };
}

module.exports = { createTestAdmin, supabase };
