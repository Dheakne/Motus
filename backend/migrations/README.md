# Migrations

Execute cada arquivo em ordem no **Supabase SQL Editor** (painel do projeto → SQL Editor → New query).

| Arquivo | O que faz |
|---------|-----------|
| `001_add_is_premium_columns.sql` | Adiciona `is_premium` em `user_profiles` e `sessions`; adiciona `category_id` em `sessions` |
| `002_add_updated_at_columns.sql` | Adiciona `updated_at` em `user_profiles` e `user_challenge_progress`; cria índice de busca por usuário/semana |
| `003_make_optional_columns_nullable.sql` | Torna `phone` e `birth_date` nullable em `user_profiles` (campos opcionais no cadastro) |
| `004_add_consent_columns.sql` | Adiciona `consent_terms`, `consent_health_data` e `consented_at` em `user_profiles` (consentimento LGPD gravado no cadastro) |

## Como executar

1. Acesse seu projeto no [supabase.com](https://supabase.com)
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New query**
4. Copie e cole o conteúdo do arquivo `.sql`
5. Clique em **Run**
6. Repita para cada migration em ordem numérica

## Observações

- Todos os comandos usam `IF NOT EXISTS` / `IF EXISTS` — são seguros de rodar mais de uma vez
- Execute sempre em ordem numérica
- Em caso de erro, verifique se a tabela referenciada existe no banco antes de rodar a migration
