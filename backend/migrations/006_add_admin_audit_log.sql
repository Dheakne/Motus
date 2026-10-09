-- Migration 006: cria a tabela admin_audit_log (registro das ações feitas pelo painel)
-- RLS ligado e SEM policies de propósito: só a service_role (backend) consegue ler/escrever
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log (created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
