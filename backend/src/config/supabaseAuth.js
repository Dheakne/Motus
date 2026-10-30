const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey } = require('./env');

module.exports = () =>
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
