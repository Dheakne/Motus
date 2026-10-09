-- Migration 005: cria a tabela admin_users (quem tem acesso ao painel administrativo)
-- RLS ligado e SEM policies de propósito: só a service_role (backend) consegue ler/escrever
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Primeiro superadmin (rodar separado, trocando o email):
-- INSERT INTO admin_users (user_id, role)
-- SELECT id, 'superadmin' FROM auth.users WHERE email = 'seu-email@exemplo.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
