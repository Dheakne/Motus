require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.test') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const TEST_EMAIL = `test_motus_${Date.now()}@motus-test.com`;
const TEST_PASSWORD = 'test123456';

async function createTestUser() {
  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
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
  await supabase.from('user_profiles').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
}

module.exports = { createTestUser, deleteTestUser, supabase };
