-- Migration 007: status de atendimento nos relatos (fila da tela de Relatos do painel)
-- Relatos existentes ficam como 'open'. O app continua inserindo sem informar status.
-- Executar no Supabase SQL Editor

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved'));

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
