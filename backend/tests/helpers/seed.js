require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.test') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const TEST_PASSWORD = 'test123456';
let seq = 0;

async function createTestUser() {
  // Email único por chamada: um mesmo arquivo de teste pode criar mais de um usuário
  seq += 1;
  const TEST_EMAIL = `test_motus_${Date.now()}_${seq}@motus-test.com`;
  // admin.createUser já cria a conta confirmada e não envia email
  // (signUp mandava confirmação e esbarrava no limite de emails do Supabase)
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
    password: TEST_PASSWORD,
  });
  if (error) throw error;

  await supabase.from('user_profiles').insert([
    {
      user_id: data.user.id,
      display_name: 'Test',
      full_name: 'Test User',
      level: 1,
      total_points: 0,
      has_seen_tutus: false,
      is_premium: false,
    },
  ]);

  return { user: data.user, session: data.session, email: TEST_EMAIL, password: TEST_PASSWORD };
}

async function deleteTestUser(userId) {
  // admin_audit_log.admin_id não tem ON DELETE CASCADE: limpa o log antes de apagar o usuário
  await supabase.from('admin_audit_log').delete().eq('admin_id', userId);
  await supabase.from('admin_users').delete().eq('user_id', userId);
  await supabase.from('user_profiles').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
}

module.exports = { createTestUser, deleteTestUser, supabase };
