-- Migration 008: índices para as consultas de série temporal do painel admin
-- (crescimento de usuários, usuários ativos por dia, sessões concluídas por dia)
-- Só cria índices: não altera dados. Executar no Supabase SQL Editor

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_completed_at ON user_sessions (completed_at) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_ucp_updated_at ON user_challenge_progress (updated_at);
CREATE INDEX IF NOT EXISTS idx_ucp_challenge_id ON user_challenge_progress (challenge_id);
