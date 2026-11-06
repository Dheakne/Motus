-- Migration 009: cria a tabela user_sessions (sessões de áudio concluídas)
-- O app já grava nela ao terminar um áudio (AudioPlayerScreen.markSessionAsComplete),
-- mas a tabela não existia no banco: a gravação falhava em silêncio e nenhuma
-- conclusão ficava registrada. Estrutura conforme PLANO_BACKEND.md, exceto session_id,
-- que é bigint porque sessions.id é bigint no banco (o plano dizia uuid).
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id bigint NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  progress_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_completed ON user_sessions (user_id, completed_at);

-- O app grava com o login do próprio usuário (anon key + sessão), então precisa de RLS
-- liberando cada pessoa a inserir e ler só as próprias linhas. O backend usa a
-- service_role e ignora o RLS.
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_insert_own" ON user_sessions;
CREATE POLICY "user_sessions_insert_own" ON user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_sessions_select_own" ON user_sessions;
CREATE POLICY "user_sessions_select_own" ON user_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
