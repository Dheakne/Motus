-- Migration 010: permite desativar sessões de áudio pelo painel (soft delete)
-- Sessões existentes continuam ativas (DEFAULT true). Desativar esconde do app
-- sem apagar o histórico de quem já ouviu (user_sessions).
-- RODAR ANTES de publicar a versão do app que filtra por is_active.
-- Executar no Supabase SQL Editor

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions (is_active);
