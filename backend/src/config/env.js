const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_STORAGE_BUCKET',
];

required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Env var ${key} is required`);
});

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  frontendUrl: process.env.FRONTEND_URL || '*',
};
