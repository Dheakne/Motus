# PLANO_ADMIN — Painel Administrativo Web (Motus Admin)

> **Versão 1.0** · Elaborado em 02/10/2026
> Documento complementar ao [PLANO_BACKEND.md](./PLANO_BACKEND.md) — assume o backend Express + Supabase já existente em `backend/`.

---

## SUMÁRIO

1. [Contexto e Objetivo](#1-contexto-e-objetivo)
2. [Decisões de Arquitetura](#2-decisoes-de-arquitetura)
3. [Modelo de Dados — Alterações Necessárias](#3-modelo-de-dados)
4. [Autenticação e Autorização de Admin](#4-autenticacao-e-autorizacao)
5. [Especificação dos Endpoints](#5-endpoints)
6. [Estrutura de Pastas](#6-estrutura-de-pastas)
7. [Páginas do Painel (Frontend)](#7-paginas-do-painel)
8. [Stack Tecnológica do Painel](#8-stack-tecnologica)
9. [Segurança e Observabilidade](#9-seguranca)
10. [Roadmap por Fases](#10-roadmap)
11. [Variáveis de Ambiente](#11-variaveis-de-ambiente)
12. [Próximos Passos Imediatos](#12-proximos-passos)

---

## 1. CONTEXTO E OBJETIVO

O app mobile Motus (Expo + React Native) já possui um backend Express (`backend/`) que fala com o Supabase usando a `service_role_key`. Esse backend cobre hoje 4 rotas (login, registro, mark-today, get session) descritas em `PLANO_BACKEND.md`.

Precisamos de um **painel administrativo web**, separado do app mobile, para a equipe (não os usuários finais) visualizar:

- **Dashboard geral** — KPIs de uso da plataforma.
- **Métricas de engajamento** — DAU/WAU/MAU, retenção, streaks.
- **Métricas de conteúdo** — quais sessões/categorias/desafios performam melhor.
- **Gestão de usuários** — listar, buscar, alternar premium.
- **Gestão de conteúdo** — CRUD de sessões, categorias e desafios semanais (hoje só editável direto no Supabase Studio).
- **Relatos de bugs/sugestões** — fila de atendimento da tabela `reports`.

Hoje **não existe nenhum conceito de admin/role** no banco — é pré-requisito antes de qualquer tela.

---

## 2. DECISÕES DE ARQUITETURA

| Decisão | Escolha | Motivo |
|---|---|---|
| Onde roda a lógica privilegiada | **Reaproveitar `backend/` (Express)**, adicionando módulo `admin` | Já centraliza a `service_role_key`; evita duplicar cliente Supabase privilegiado em outro lugar |
| Onde roda a UI do painel | **Novo app separado** (`admin/`), não misturar com o Expo app | Painel web não tem motivo para herdar deps de React Native; mais simples como SPA própria |
| Como o painel acessa dados | **Sempre via API do backend** (`/api/admin/*`), nunca Supabase client direto com `service_role_key` no browser | A service key nunca pode chegar ao navegador |
| Autenticação do admin | Reaproveita **Supabase Auth** (mesma base de usuários do app) | Evita sistema de login paralelo; autorização é feita por uma tabela extra (`admin_users`), não por um segundo provedor de auth |

---

## 3. MODELO DE DADOS — ALTERAÇÕES NECESSÁRIAS

### 3.1 Tabelas novas

#### `admin_users` (nova)

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| user_id | uuid | NOT NULL | PK, FK → auth.users(id) ON DELETE CASCADE | Usuário com acesso ao painel |
| role | text | NOT NULL | CHECK (role IN ('admin','superadmin')), DEFAULT 'admin' | Nível de permissão |
| created_at | timestamptz | NOT NULL | DEFAULT now() | Quando ganhou acesso |
| created_by | uuid | NULL | FK → auth.users(id) | Quem concedeu o acesso |

```sql
-- migrations/005_add_admin_users.sql
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy criada de propósito: sem policy + RLS ligado = só service_role acessa.
```

> Primeiro admin precisa ser inserido manualmente no Supabase SQL Editor (não existe "auto-promoção").

#### `admin_audit_log` (nova)

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | — |
| admin_id | uuid | NOT NULL | FK → auth.users(id) | Quem executou a ação |
| action | text | NOT NULL | — | Ex.: `user.set_premium`, `session.create`, `session.delete` |
| target_table | text | NOT NULL | — | Tabela afetada |
| target_id | text | NULL | — | PK do registro afetado |
| payload | jsonb | NULL | — | Dados da alteração (antes/depois ou body da request) |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

```sql
-- migrations/006_add_admin_audit_log.sql
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
```

### 3.2 Alterações em tabelas existentes

```sql
-- migrations/007_add_reports_status.sql
-- Permite fila de atendimento na tela de Relatos do painel
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved'));

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
```

```sql
-- migrations/008_add_metrics_indexes.sql
-- Consultas de série temporal (crescimento de usuários, sessões por dia) precisam de índice por data
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at);
-- idx_ucp_user_week e índice em user_sessions(user_id, completed_at) já existem (migrations 001-002)
```

### 3.3 (Opcional, fase de performance) Funções SQL para agregações pesadas

Quando o volume de dados crescer, consultas de DAU/retenção feitas linha-a-linha no Node ficam caras. Alternativa: função Postgres exposta via RPC.

```sql
-- Exemplo: DAU dos últimos N dias (usa user_sessions.completed_at)
CREATE OR REPLACE FUNCTION admin_daily_active_users(days integer)
RETURNS TABLE(day date, active_users bigint) AS $$
  SELECT completed_at::date AS day, COUNT(DISTINCT user_id) AS active_users
  FROM user_sessions
  WHERE completed_at >= now() - (days || ' days')::interval
  GROUP BY day
  ORDER BY day;
$$ LANGUAGE sql STABLE;
```

Não é bloqueante para o MVP — a Fase 3 do roadmap pode começar agregando em Node e migrar para RPC se necessário.

---

## 4. AUTENTICAÇÃO E AUTORIZAÇÃO

1. Admin faz login no painel com email/senha via Supabase Auth (mesmo client, mesma base de `auth.users`).
2. Painel manda o `access_token` para o backend em todas as chamadas `/api/admin/*`.
3. Middleware `backend/src/middleware/auth.js` (já existe) valida o token e popula `req.user`.
4. **Novo** middleware `backend/src/middleware/requireAdmin.js`, encadeado depois do `auth`:

```javascript
// backend/src/middleware/requireAdmin.js
const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error || !data) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Acesso restrito a administradores',
    });
  }

  req.adminRole = data.role;
  next();
};
```

5. Rotas `/api/admin/admins/*` (gestão de quem é admin) exigem `role === 'superadmin'` — checagem extra no controller.

---

## 5. ESPECIFICAÇÃO DOS ENDPOINTS

Todos sob `/api/admin`, protegidos por `auth` + `requireAdmin`.

### 5.1 Métricas

#### `GET /api/admin/metrics/overview`

```json
{
  "success": true,
  "data": {
    "total_users": 1204,
    "new_users_24h": 8,
    "new_users_7d": 54,
    "new_users_30d": 210,
    "premium_users": 97,
    "premium_rate": 0.0806,
    "sessions_completed_total": 3420,
    "active_challenges": 5,
    "open_reports": 12
  }
}
```

**Regras:** contagens via `COUNT(*)` em `user_profiles`, `user_sessions` (completed=true), `weekly_challenges` (is_active=true), `reports` (status='open'). `premium_rate = premium_users / total_users`.

#### `GET /api/admin/metrics/engagement?range=7d|30d|90d`

```json
{
  "success": true,
  "data": {
    "range": "30d",
    "dau": [{ "day": "2026-09-03", "active_users": 142 }, ...],
    "wau": 380,
    "mau": 890,
    "avg_streak": 3.2,
    "sessions_completed_by_day": [{ "day": "2026-09-03", "count": 95 }, ...]
  }
}
```

**Regras:** DAU = usuários distintos com `user_sessions.completed_at` ou `user_challenge_progress` atualizado no dia. WAU/MAU = mesma lógica em janela de 7/30 dias. `avg_streak` = média de dias marcados (`monday..sunday`) na semana atual de `user_challenge_progress`.

#### `GET /api/admin/metrics/content`

```json
{
  "success": true,
  "data": {
    "top_sessions": [
      { "id": "...", "title": "Meditação Matinal", "category": "meditacao", "completions": 312 }
    ],
    "completion_rate_by_category": [
      { "category": "meditacao", "rate": 0.74 }
    ]
  }
}
```

**Regras:** `completions` = `COUNT(*)` em `user_sessions` onde `completed=true`, agrupado por `session_id`, join com `sessions` para título/categoria. `completion_rate` = completados / total iniciado, por categoria.

#### `GET /api/admin/metrics/challenges`

```json
{
  "success": true,
  "data": {
    "challenges": [
      { "id": "...", "title": "Respiração consciente", "participants": 48, "avg_days_completed": 4.1 }
    ]
  }
}
```

### 5.2 Usuários

#### `GET /api/admin/users?search=&page=&pageSize=`

Retorna lista paginada de `user_profiles` (join com `auth.users` para email), filtrável por nome/email.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user_id": "...",
        "email": "sofia@example.com",
        "display_name": "Sofia",
        "level": 3,
        "total_points": 150,
        "is_premium": false,
        "created_at": "2026-05-30T10:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1204
  }
}
```

#### `GET /api/admin/users/:id`

Detalhe de um usuário: perfil + últimas sessões (`user_sessions`) + progresso de desafios (`user_challenge_progress`).

#### `PATCH /api/admin/users/:id`

```json
// Request
{ "is_premium": true }
```

**Regras:** apenas campos na allowlist (`is_premium`, `has_seen_tutus`) podem ser alterados — nunca `email`/`password` (isso é responsabilidade do Supabase Auth, não deste endpoint). Toda chamada grava uma linha em `admin_audit_log` com `action: 'user.update'`.

### 5.3 Conteúdo (CRUD)

| Rota | Tabela |
|---|---|
| `GET/POST /api/admin/content/categories`, `PATCH/DELETE /api/admin/content/categories/:id` | `categories` |
| `GET/POST /api/admin/content/sessions`, `PATCH/DELETE /api/admin/content/sessions/:id` | `sessions` |
| `GET/POST /api/admin/content/challenges`, `PATCH/DELETE /api/admin/content/challenges/:id` | `weekly_challenges` |

Todas as mutações (`POST`/`PATCH`/`DELETE`) validadas via Joi (mesmo padrão de `src/validators/`) e logadas em `admin_audit_log`.

**Atenção:** `DELETE` em `sessions`/`weekly_challenges` com registros filhos (`user_sessions`, `user_challenge_progress`) — preferir soft delete (`is_active = false` / `is_premium` etc.) a `DELETE` físico, para não quebrar histórico de usuários.

### 5.4 Relatos

#### `GET /api/admin/reports?status=open&page=`

Lista paginada de `reports`, ordenada por `created_at DESC`.

#### `PATCH /api/admin/reports/:id`

```json
{ "status": "resolved" }
```

### 5.5 Gestão de administradores (somente `superadmin`)

| Rota | Descrição |
|---|---|
| `GET /api/admin/admins` | Lista quem tem acesso ao painel |
| `POST /api/admin/admins` | Concede acesso (`{ "email": "..." }` → resolve para `user_id`) |
| `DELETE /api/admin/admins/:userId` | Revoga acesso |

---

## 6. ESTRUTURA DE PASTAS

### Backend (extensão de `backend/`)

```
backend/
├── src/
│   ├── middleware/
│   │   └── requireAdmin.js          ← NOVO
│   ├── routes/
│   │   └── admin/
│   │       ├── metrics.js           ← NOVO
│   │       ├── users.js             ← NOVO
│   │       ├── content.js           ← NOVO
│   │       ├── reports.js           ← NOVO
│   │       └── admins.js            ← NOVO
│   ├── controllers/admin/           ← NOVO (um arquivo por recurso acima)
│   ├── services/admin/              ← NOVO (queries/agregações Supabase)
│   └── utils/
│       └── auditLog.js              ← NOVO: logAdminAction(adminId, action, table, id, payload)
├── migrations/
│   ├── 005_add_admin_users.sql      ← NOVO
│   ├── 006_add_admin_audit_log.sql  ← NOVO
│   ├── 007_add_reports_status.sql   ← NOVO
│   └── 008_add_metrics_indexes.sql  ← NOVO
```

### Painel (novo app)

```
admin/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Overview.tsx
│   │   ├── Engagement.tsx
│   │   ├── Content.tsx
│   │   ├── Challenges.tsx
│   │   ├── Users.tsx
│   │   ├── UserDetail.tsx
│   │   ├── Reports.tsx
│   │   └── Admins.tsx
│   ├── components/
│   │   ├── charts/        ← wrappers Recharts (LineChart, BarChart, KpiCard)
│   │   └── table/         ← wrapper TanStack Table
│   ├── api/
│   │   ├── client.ts      ← fetch wrapper com Authorization: Bearer
│   │   ├── metricsApi.ts
│   │   ├── usersApi.ts
│   │   ├── contentApi.ts
│   │   └── reportsApi.ts
│   ├── auth/
│   │   └── supabaseClient.ts
│   └── App.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 7. PÁGINAS DO PAINEL (FRONTEND)

1. **Login** — Supabase Auth; erro genérico se credencial inválida ou se não for admin (não revelar qual dos dois).
2. **Overview** — cards de KPI (`/metrics/overview`) + gráfico de crescimento de usuários.
3. **Engajamento** — DAU/WAU/MAU, streak médio, sessões completadas por dia (`/metrics/engagement`).
4. **Conteúdo** — tabela de sessões com métricas de uso + formulário de criação/edição.
5. **Desafios semanais** — completude por desafio + CRUD.
6. **Usuários** — tabela paginada/buscável; clique abre `UserDetail` (histórico de sessões e progresso).
7. **Relatos** — fila de `reports` com filtro por status e ação de marcar resolvido.
8. **Administradores** — apenas visível para `superadmin`; conceder/revogar acesso.

---

## 8. STACK TECNOLÓGICA DO PAINEL

| Camada | Escolha | Motivo |
|---|---|---|
| Build/dev server | Vite | Start rápido, sem necessidade de SSR para um painel interno |
| UI | React 19 + TypeScript | Consistente com o restante do projeto (já usa React 19 e TS) |
| Data fetching/cache | TanStack Query | Evita re-fetch manual, cache automático, estados de loading/erro prontos |
| Tabelas | TanStack Table | Paginação/busca/ordenação client-side sem reinventar |
| Gráficos | Recharts | Padrão de mercado para dashboards React (diferente do `react-native-chart-kit` do mobile, que é específico RN) |
| Estilo | A decidir (Tailwind ou CSS puro) | Projeto mobile não usa Tailwind hoje — avaliar se vale introduzir só no painel ou manter CSS simples por consistência |

---

## 9. SEGURANÇA E OBSERVABILIDADE

- **CORS**: usar variável própria (`ADMIN_FRONTEND_URL`) nas rotas `/api/admin/*` — nunca `*` como hoje é aceitável para o app mobile.
- **Rate limiting**: aplicar `express-rate-limit` (já usado no `/api/auth`) também em `/api/admin/*`, limite mais permissivo (uso interno, mas ainda exposto na internet).
- **Nunca** expor `service_role_key`/`SUPABASE_JWT_SECRET` ao painel — toda chamada passa pelo backend.
- **RLS**: `admin_users` e `admin_audit_log` com RLS ligado e sem policies — só `service_role` acessa.
- **Auditoria**: toda mutação (`PATCH`/`POST`/`DELETE` em `/api/admin/*`) grava em `admin_audit_log`.
- **Logs**: reaproveitar `pino` (já configurado em `backend/src/utils/logger.js`).
- **Soft delete**: preferir flags (`is_active`) a `DELETE` físico em conteúdo com histórico associado.

---

## 10. ROADMAP POR FASES

### Fase 1 — Fundação
- Migrations `005_add_admin_users.sql` e `006_add_admin_audit_log.sql`.
- Inserir manualmente o primeiro `superadmin` via Supabase SQL Editor.
- `requireAdmin` middleware + endpoint `GET /api/admin/metrics/overview` (versão simples, sem todos os KPIs).
- Scaffold do app `admin/` (Vite+React+TS) com tela de Login funcionando contra esse endpoint.
- **Critério de conclusão:** login no painel autentica e exibe 1 KPI real vindo do banco.

### Fase 2 — Overview + Usuários
- Completar `GET /api/admin/metrics/overview` (todos os KPIs).
- `GET /api/admin/users` (lista paginada/buscável) + `GET /api/admin/users/:id` (detalhe).
- `PATCH /api/admin/users/:id` (toggle premium) com audit log.
- Páginas `Overview` e `Users`/`UserDetail` no painel.
- **Critério de conclusão:** dashboard geral e gestão básica de usuários funcionando ponta a ponta.

### Fase 3 — Engajamento
- `GET /api/admin/metrics/engagement` (DAU/WAU/MAU, streak médio).
- Migration `008_add_metrics_indexes.sql` se consultas estiverem lentas.
- Página `Engagement` com gráficos Recharts.
- **Critério de conclusão:** gráficos de DAU/WAU/MAU carregando com dados reais em < 2s.

### Fase 4 — Conteúdo e Desafios
- CRUD completo de `categories`, `sessions`, `weekly_challenges` (`/api/admin/content/*`).
- `GET /api/admin/metrics/content` e `/metrics/challenges`.
- Páginas `Content` e `Challenges` no painel.
- **Critério de conclusão:** equipe consegue criar/editar uma sessão de áudio pelo painel sem usar o Supabase Studio.

### Fase 5 — Relatos, Auditoria e Deploy
- Migration `007_add_reports_status.sql`.
- `GET/PATCH /api/admin/reports`.
- Página `Reports` + tela de visualização do `admin_audit_log` (somente leitura, para `superadmin`).
- Gestão de administradores (`/api/admin/admins`) + página `Admins`.
- Restringir CORS (`ADMIN_FRONTEND_URL`), revisar rate limiting.
- Deploy: backend (se ainda não estiver hospedado) em Render/Railway/Fly.io; painel como estático em Vercel/Netlify.
- **Critério de conclusão:** painel completo em produção, acesso restrito, nenhum secret exposto no bundle do frontend.

---

## 11. VARIÁVEIS DE AMBIENTE

### `backend/.env` (adições)

```env
# ─── PAINEL ADMIN ────────────────────────────────────
ADMIN_FRONTEND_URL=https://admin.motus.app   # ou http://localhost:5173 em dev
```

### `admin/.env.example` (novo app)

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> O painel usa apenas a **anon key** (para login via Supabase Auth) — a `service_role_key` fica só no backend, como já é hoje.

---

## 12. PRÓXIMOS PASSOS IMEDIATOS

1. Rodar `005_add_admin_users.sql` e `006_add_admin_audit_log.sql` no Supabase SQL Editor.
2. Inserir o primeiro `superadmin` manualmente (seu `user_id`).
3. Implementar `requireAdmin.js` + `GET /api/admin/metrics/overview` no backend.
4. Criar o app `admin/` (`npm create vite@latest admin -- --template react-ts`) com a tela de Login.

---

**_Versão 1.0 — 02/10/2026 — Complementar ao PLANO_BACKEND.md._**
