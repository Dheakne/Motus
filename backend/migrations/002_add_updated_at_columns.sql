-- Migration 002: adiciona colunas updated_at faltantes
-- Executar no Supabase SQL Editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE user_challenge_progress
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Índice para buscas rápidas por usuário + semana em user_challenge_progress
CREATE INDEX IF NOT EXISTS idx_ucp_user_week
  ON user_challenge_progress (user_id, week_start);
