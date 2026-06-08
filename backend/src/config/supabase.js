const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey } = require('./env');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

module.exports = supabase;
