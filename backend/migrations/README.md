# Migrations

Execute cada arquivo em ordem no **Supabase SQL Editor** (painel do projeto → SQL Editor → New query).

| Arquivo | O que faz |
|---------|-----------|
| `001_add_is_premium_columns.sql` | Adiciona `is_premium` em `user_profiles` e `sessions`; adiciona `category_id` em `sessions` |
| `002_add_updated_at_columns.sql` | Adiciona `updated_at` em `user_profiles` e `user_challenge_progress`; cria índice de busca por usuário/semana |
| `003_make_optional_columns_nullable.sql` | Torna `phone` e `birth_date` nullable em `user_profiles` (campos opcionais no cadastro) |
| `004_add_consent_columns.sql` | Adiciona `consent_terms`, `consent_health_data` e `consented_at` em `user_profiles` (consentimento LGPD gravado no cadastro) |
| `005_add_admin_users.sql` | Cria `admin_users` (quem acessa o painel admin, com papel `admin`/`superadmin`). RLS sem policies: só o backend lê |
| `006_add_admin_audit_log.sql` | Cria `admin_audit_log` (registro das ações feitas pelo painel). RLS sem policies: só o backend lê |
| `007_add_premium_subscriptions.sql` | Cria `premium_subscriptions` (histórico de assinaturas Stripe e liberações do painel); trigger que impede o app de alterar `is_premium`; trigger que impede escolher exercício premium sem ser premium |
| `008_add_reports_status.sql` | Adiciona `status` (`open`/`in_progress`/`resolved`, padrão `open`) e `updated_at` em `reports` para a fila de relatos do painel |
| `009_create_user_sessions.sql` | Cria `user_sessions` (sessões de áudio concluídas), com RLS para cada usuário gravar e ler só as próprias. O app já gravava nela, mas a tabela não existia |
| `010_add_sessions_is_active.sql` | Adiciona `is_active` em `sessions` (padrão `true`) para desativar sessões pelo painel sem apagar histórico. **Rodar antes** de publicar a versão do app que filtra por `is_active` |
| `011_add_metrics_indexes.sql` | Índices por data para as métricas do painel (crescimento, ativos por dia, sessões por dia). Só cria índices. Depende da 009 |

## Como executar

1. Acesse seu projeto no [supabase.com](https://supabase.com)
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New query**
4. Copie e cole o conteúdo do arquivo `.sql`
5. Clique em **Run**
6. Repita para cada migration em ordem numérica

## Primeiro administrador

Depois de rodar a 005, conceda acesso ao painel manualmente (o usuário precisa já ter conta no app):

```sql
INSERT INTO admin_users (user_id, role)
SELECT id, 'superadmin' FROM auth.users WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

## Observações

- Todos os comandos usam `IF NOT EXISTS` / `IF EXISTS` — são seguros de rodar mais de uma vez
- Execute sempre em ordem numérica
- Em caso de erro, verifique se a tabela referenciada existe no banco antes de rodar a migration
