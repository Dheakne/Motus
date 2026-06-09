# PLANO_BACKEND — MOTUS

> **Versão 1.0** · Elaborado em 30/05/2026 · Documentação pronta: 01/06/2026
> **Implementação: 10 dias úteis** · Equipe: Carlos (Arquitetura), Letícia (Backend/BD), Sofia (Docs/Testes)

---

## SUMÁRIO

1. [MER — Modelo Entidade-Relacionamento](#1-mer)
2. [Arquitetura do Backend](#2-arquitetura)
3. [Especificação das 4 Rotas](#3-rotas)
4. [Cronograma 10 Dias](#4-cronograma)
5. [Variáveis de Ambiente](#5-variaveis)
6. [Integração com o App Mobile](#6-integracao)

---

## 1. MER — MODELO ENTIDADE-RELACIONAMENTO

### 1.1 Diagrama Textual

```
auth.users ─────1:1──── user_profiles
     │
     ├───1:N──── user_sessions ────N:1──── sessions ────N:1──── categories
     │
     ├───1:N──── user_challenge_progress ────N:1──── weekly_challenges
     │
     └───1:N──── reports
```

### 1.2 Entidades Detalhadas

---

#### Tabela: `auth.users` _(gerenciada pelo Supabase Auth — somente leitura)_

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK | Identificador único do usuário |
| email | text | NOT NULL | UNIQUE | Email de login |
| encrypted_password | text | NOT NULL | — | Hash bcrypt gerenciado pelo Supabase |
| created_at | timestamptz | NOT NULL | DEFAULT now() | Data de criação da conta |
| updated_at | timestamptz | NULL | — | Última atualização |
| raw_user_meta_data | jsonb | NULL | — | Metadados extras (não usado pelo app) |

**Índices:** `PRIMARY KEY (id)`, `UNIQUE INDEX ON (email)`

---

#### Tabela: `user_profiles`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| user_id | uuid | NOT NULL | PK, FK → auth.users(id) ON DELETE CASCADE | Chave do usuário |
| display_name | text | NOT NULL | — | Primeiro nome exibido no app |
| full_name | text | NOT NULL | — | Nome completo "Nome Sobrenome" |
| phone | text | NULL | — | Telefone (opcional no cadastro) |
| birth_date | date | NULL | — | Data de nascimento (YYYY-MM-DD internamente) |
| level | integer | NOT NULL | DEFAULT 1, CHECK (level >= 1) | Nível do usuário |
| total_points | integer | NOT NULL | DEFAULT 0, CHECK (total_points >= 0) | Pontos acumulados |
| has_seen_tutus | boolean | NOT NULL | DEFAULT false | Controla exibição do MascotScreen |
| is_premium | boolean | NOT NULL | DEFAULT false | Acesso a conteúdo premium |
| created_at | timestamptz | NOT NULL | DEFAULT now() | Data de criação do perfil |
| updated_at | timestamptz | NULL | — | Última atualização do perfil |

**Índices:** `PRIMARY KEY (user_id)`

**Relacionamentos:**
- `user_id` → `auth.users(id)` · cardinalidade 1:1

**Nota:** `is_premium` pode não existir ainda no banco atual. Migration necessária:
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz;
```

---

#### Tabela: `categories`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| title | text | NOT NULL | — | Nome exibido (ex.: "Meditação") |
| color | text | NULL | — | Cor hex do card (ex.: "#7B68EE") |
| icon_emoji | text | NULL | — | Emoji do ícone da categoria |
| order | integer | NOT NULL | DEFAULT 0 | Ordem de exibição na HomeScreen |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

**Índices:** `PRIMARY KEY (id)`, `INDEX ON (order ASC)`

**Relacionamentos:**
- `categories` 1:N `sessions` (uma categoria contém várias sessões)

---

#### Tabela: `sessions`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| title | text | NOT NULL | — | Nome da sessão de áudio |
| duration | integer | NOT NULL | CHECK (duration > 0) | Duração em minutos |
| audio_url | text | NOT NULL | — | Path relativo no Supabase Storage ou URL pública |
| category | text | NOT NULL | CHECK (category IN ('gratidao','atencao','meditacao','reflexao','descanso')) | Tipo da sessão |
| is_premium | boolean | NOT NULL | DEFAULT false | Requer assinatura premium |
| category_id | uuid | NULL | FK → categories(id) | Referência estruturada à categoria |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

**Índices:** `PRIMARY KEY (id)`, `INDEX ON (category)`, `INDEX ON (is_premium)`

**Relacionamentos:**
- `sessions` N:1 `categories` via `category_id`
- `sessions` 1:N `user_sessions`

**Nota:** Migration necessária para `is_premium`:
```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);
```

---

#### Tabela: `user_sessions`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| user_id | uuid | NOT NULL | FK → auth.users(id) ON DELETE CASCADE | Usuário que completou |
| session_id | uuid | NOT NULL | FK → sessions(id) ON DELETE CASCADE | Sessão completada |
| completed | boolean | NOT NULL | DEFAULT false | true quando concluída |
| progress_seconds | integer | NOT NULL | DEFAULT 0 | Segundos ouvidos (= duration * 60) |
| completed_at | timestamptz | NULL | — | Timestamp da conclusão |
| points_earned | integer | NOT NULL | DEFAULT 0 | Pontos ganhos (= duration * 5) |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

**Índices:** `PRIMARY KEY (id)`, `INDEX ON (user_id, session_id)`, `INDEX ON (user_id, completed_at DESC)`

**Relacionamentos:**
- N:1 `auth.users` · N:1 `sessions`

---

#### Tabela: `weekly_challenges`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| title | text | NOT NULL | — | Nome do exercício semanal |
| description | text | NULL | — | Descrição longa |
| discoveries | text | NULL | — | Descobertas (string com \n entre itens) |
| tips | text | NULL | — | Dicas (string com \n entre itens) |
| duration_minutes | integer | NOT NULL | CHECK (duration_minutes > 0) | Tempo diário sugerido |
| category | text | NOT NULL | — | Categoria do exercício |
| is_free | boolean | NOT NULL | DEFAULT true | false = conteúdo premium |
| is_active | boolean | NOT NULL | DEFAULT false | true = visível no app |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

**Índices:** `PRIMARY KEY (id)`, `INDEX ON (is_active)`, `INDEX ON (created_at DESC)`

**Relacionamentos:**
- `weekly_challenges` 1:N `user_challenge_progress`

---

#### Tabela: `user_challenge_progress`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| user_id | uuid | NOT NULL | FK → auth.users(id) ON DELETE CASCADE | Usuário |
| challenge_id | uuid | NOT NULL | FK → weekly_challenges(id) ON DELETE CASCADE | Exercício escolhido |
| week_start | date | NOT NULL | — | Segunda-feira da semana atual (YYYY-MM-DD) |
| monday | boolean | NOT NULL | DEFAULT false | Dia 1 concluído |
| tuesday | boolean | NOT NULL | DEFAULT false | Dia 2 |
| wednesday | boolean | NOT NULL | DEFAULT false | Dia 3 |
| thursday | boolean | NOT NULL | DEFAULT false | Dia 4 |
| friday | boolean | NOT NULL | DEFAULT false | Dia 5 |
| saturday | boolean | NOT NULL | DEFAULT false | Dia 6 |
| sunday | boolean | NOT NULL | DEFAULT false | Dia 7 |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |
| updated_at | timestamptz | NULL | — | Atualizado ao marcar um dia |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON (user_id, challenge_id, week_start)` — impede duplicatas por semana
- `INDEX ON (user_id, week_start)` — busca rápida por usuário + semana

**Relacionamentos:**
- N:1 `auth.users` · N:1 `weekly_challenges`

**Nota:** Migration `updated_at`:
```sql
ALTER TABLE user_challenge_progress ADD COLUMN IF NOT EXISTS updated_at timestamptz;
```

---

#### Tabela: `reports`

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| user_id | uuid | NULL | FK → auth.users(id) ON DELETE SET NULL | Usuário reportante (opcional) |
| email | text | NOT NULL | — | Email de contato |
| type | text | NOT NULL | CHECK (type IN (...)) | Tipo do reporte |
| subject | text | NOT NULL | — | Assunto do reporte |
| description | text | NOT NULL | — | Descrição detalhada |
| created_at | timestamptz | NOT NULL | DEFAULT now() | — |

**CHECK constraint:**
```sql
CHECK (type IN ('Bug ou erro','Sugestão de melhoria','Conteúdo inadequado','Outro'))
```

**Índices:** `PRIMARY KEY (id)`, `INDEX ON (created_at DESC)`, `INDEX ON (user_id)`

---

### 1.3 Resumo de Relacionamentos

| Tabela A | Cardinalidade | Tabela B | Via FK |
|---|---|---|---|
| auth.users | 1:1 | user_profiles | user_profiles.user_id |
| auth.users | 1:N | user_sessions | user_sessions.user_id |
| auth.users | 1:N | user_challenge_progress | user_challenge_progress.user_id |
| auth.users | 1:N | reports | reports.user_id (nullable) |
| categories | 1:N | sessions | sessions.category_id |
| sessions | 1:N | user_sessions | user_sessions.session_id |
| weekly_challenges | 1:N | user_challenge_progress | user_challenge_progress.challenge_id |

---

## 2. ARQUITETURA DO BACKEND

### 2.1 Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Runtime | Node.js | 18 LTS | Suporte a ESM, crypto nativo, LTS estável |
| Framework | Express | ^4.18 | Maduro, sem overhead, ecossistema vasto |
| Supabase Client | @supabase/supabase-js | ^2.x | Service role para ops admin |
| Validação | Joi | ^17.x | Schemas declarativos, mensagens customizadas |
| Variáveis | dotenv | ^16.x | Carregamento de .env |
| Segurança | helmet | ^7.x | Headers HTTP seguros |
| Rate limiting | express-rate-limit | ^7.x | Proteção contra brute-force no login |
| Logger | pino | ^8.x | Logs estruturados em JSON |
| Testes | jest + supertest | ^29 / ^6 | Testes de integração das rotas |

### 2.2 Estrutura de Pastas Completa

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              ← valida e exporta todas as env vars
│   │   └── supabase.js         ← cria cliente com service_role_key
│   │
│   ├── middleware/
│   │   ├── auth.js             ← verifica JWT via supabase.auth.getUser()
│   │   ├── validate.js         ← factory de middleware Joi
│   │   └── errorHandler.js     ← handler global (último middleware)
│   │
│   ├── routes/
│   │   ├── auth.js             ← POST /api/auth/login, /register
│   │   ├── exercises.js        ← PATCH /api/exercises/progress/mark-today
│   │   └── sessions.js         ← GET /api/sessions/:id
│   │
│   ├── controllers/
│   │   ├── authController.js   ← login(), register()
│   │   ├── exerciseController.js ← markToday()
│   │   └── sessionController.js ← getSession()
│   │
│   ├── services/
│   │   ├── authService.js      ← loginUser(), registerUser()
│   │   ├── exerciseService.js  ← markTodayProgress()
│   │   └── sessionService.js   ← getSessionById()
│   │
│   └── utils/
│       ├── responses.js        ← success(res, data), error(res, code, msg)
│       └── dateUtils.js        ← getWeekStart(), getDayColumn()
│
├── tests/
│   ├── auth.test.js
│   ├── exercises.test.js
│   └── sessions.test.js
│
├── migrations/
│   ├── 001_add_is_premium_columns.sql
│   └── 002_add_updated_at_columns.sql
│
├── .env.example
├── .env                        ← NÃO comitar (no .gitignore)
├── .gitignore
├── package.json
└── server.js                   ← entry point
```

### 2.3 Responsabilidades por Camada

#### `config/env.js`
Valida que todas as env vars obrigatórias estão presentes na inicialização.
Falha com mensagem clara se alguma estiver faltando.

```javascript
// src/config/env.js
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_STORAGE_BUCKET',
];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Env var ${key} is required`);
});
module.exports = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
};
```

#### `config/supabase.js`
Cliente único com service_role_key. Usado internamente; nunca exposto ao cliente.

```javascript
// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey } = require('./env');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
module.exports = supabase;
```

#### `middleware/auth.js`
Extrai o Bearer token do header Authorization e verifica via Supabase.
Injeta `req.user` para uso nos controllers.

```javascript
// src/middleware/auth.js
const supabase = require('../config/supabase');
module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'MISSING_TOKEN',
      message: 'Token de autenticação não fornecido' });
  }
  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: 'INVALID_TOKEN',
      message: 'Token inválido ou expirado' });
  }
  req.user = user;
  next();
};
```

#### `middleware/validate.js`
Factory que recebe um schema Joi e retorna middleware de validação.

```javascript
// src/middleware/validate.js
module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.details.map(d => d.message).join('; '),
    });
  }
  next();
};
```

#### `middleware/errorHandler.js`
Captura qualquer erro não tratado e retorna 500 estruturado.

```javascript
// src/middleware/errorHandler.js
module.exports = (err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor' });
};
```

#### `utils/responses.js`

```javascript
// src/utils/responses.js
exports.success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });
exports.error = (res, statusCode, errorCode, message) =>
  res.status(statusCode).json({ success: false, error: errorCode, message });
```

#### `utils/dateUtils.js`

```javascript
// src/utils/dateUtils.js
const DAY_MAP = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};
// Retorna "YYYY-MM-DD" da segunda-feira da semana atual (fuso de Brasília, UTC-3)
exports.getWeekStart = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const day = now.getDay(); // 0=Dom, 1=Seg ...
  const diff = (day === 0) ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
};
// Retorna nome da coluna para o dia atual (ex.: "monday")
exports.getDayColumn = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return DAY_MAP[now.getDay()];
};
```

#### `server.js`

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/auth');
const exerciseRoutes = require('./src/routes/exercises');
const sessionRoutes = require('./src/routes/sessions');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // 20 req/15min

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Motus backend rodando na porta ${PORT}`));
```

---

## 3. ESPECIFICAÇÃO DAS 4 ROTAS

### ROTA 1 — Login

**`POST /api/auth/login`**

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "sofia@example.com",
  "password": "minimo6chars"
}
```

#### Resposta de Sucesso — `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.token...",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": {
      "id": "d4c2e3b1-...",
      "email": "sofia@example.com",
      "created_at": "2025-01-10T12:00:00Z"
    },
    "profile": {
      "user_id": "d4c2e3b1-...",
      "display_name": "Sofia",
      "full_name": "Sofia Silva",
      "phone": "11999999999",
      "birth_date": "1990-01-15",
      "level": 3,
      "total_points": 150,
      "has_seen_tutus": true,
      "is_premium": false
    }
  }
}
```

#### Respostas de Erro
```json
{ "success": false, "error": "VALIDATION_ERROR", "message": "\"email\" must be a valid email" }
{ "success": false, "error": "INVALID_CREDENTIALS", "message": "Email ou senha incorretos" }
{ "success": false, "error": "INTERNAL_ERROR", "message": "Erro interno do servidor" }
```

#### Regras de Negócio
1. Validar `email` e `password` (mínimo 6 chars) via Joi antes de qualquer I/O
2. Chamar `supabase.auth.signInWithPassword({ email, password })`
3. Se erro → retornar 401
4. Após sucesso, buscar `user_profiles` com `user_id = session.user.id`
5. Retornar session + profile em única resposta

#### SQL Executado
```sql
SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1;
```

---

### ROTA 2 — Registrar Usuário

**`POST /api/auth/register`**

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "sofia@example.com",
  "password": "minimo6chars",
  "name": "Sofia",
  "lastName": "Silva",
  "phone": "11999999999",
  "birthDate": "15/01/1990"
}
```

#### Resposta de Sucesso — `201 Created`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.token...",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": {
      "id": "d4c2e3b1-...",
      "email": "sofia@example.com",
      "created_at": "2026-05-30T10:00:00Z"
    },
    "profile": {
      "user_id": "d4c2e3b1-...",
      "display_name": "Sofia",
      "full_name": "Sofia Silva",
      "phone": "11999999999",
      "birth_date": "1990-01-15",
      "level": 1,
      "total_points": 0,
      "has_seen_tutus": false,
      "is_premium": false
    }
  }
}
```

#### Respostas de Erro
```json
{ "success": false, "error": "VALIDATION_ERROR", "message": "\"password\" length must be at least 6 characters long" }
{ "success": false, "error": "INVALID_BIRTH_DATE", "message": "Data de nascimento inválida. Use o formato DD/MM/YYYY" }
{ "success": false, "error": "EMAIL_ALREADY_EXISTS", "message": "Este email já está cadastrado" }
{ "success": false, "error": "INTERNAL_ERROR", "message": "Erro interno do servidor" }
```

#### Regras de Negócio
1. Validar campos via Joi
2. Se `birthDate` fornecido: converter `DD/MM/YYYY` → `YYYY-MM-DD`; validar data real
3. Chamar `supabase.auth.signUp({ email, password })`
4. Se erro de email duplicado → 409
5. Após `signUp`, inserir `user_profiles`
6. Se insert falhar após auth criado → logar erro crítico e retornar 500
7. Retornar session + profile

#### SQL Executado
```sql
INSERT INTO user_profiles
  (user_id, display_name, full_name, phone, birth_date, level, total_points, has_seen_tutus, is_premium)
VALUES
  ($1, $2, $3, $4, $5, 1, 0, false, false)
RETURNING *;
```

---

### ROTA 3 — Marcar Dia do Exercício Semanal

**`PATCH /api/exercises/progress/mark-today`**

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{}
```

#### Resposta de Sucesso — `200 OK`
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": "abc123...",
      "user_id": "d4c2e3b1-...",
      "challenge_id": "ff123...",
      "week_start": "2026-05-25",
      "monday": true,
      "tuesday": false,
      "wednesday": true,
      "thursday": false,
      "friday": false,
      "saturday": false,
      "sunday": false,
      "updated_at": "2026-05-27T14:30:00Z"
    },
    "day_marked": "wednesday",
    "streak": 2
  }
}
```

#### Respostas de Erro
```json
{ "success": false, "error": "MISSING_TOKEN", "message": "Token de autenticação não fornecido" }
{ "success": false, "error": "NO_ACTIVE_EXERCISE", "message": "Nenhum exercício selecionado para esta semana. Acesse a lista de exercícios primeiro." }
{ "success": false, "error": "ALREADY_MARKED", "message": "Exercício já marcado para hoje. Não é possível marcar retroativamente (RNE-003)." }
{ "success": false, "error": "INTERNAL_ERROR", "message": "Erro interno do servidor" }
```

#### Regras de Negócio (RNE-003 — Anti-retroativo)
1. Extrair `user.id` de `req.user` (injetado por middleware `auth`)
2. Calcular `weekStart` = segunda-feira da semana atual (fuso `America/Sao_Paulo`)
3. Calcular `dayColumn` = nome do dia atual (`monday`, `tuesday`, etc.)
4. Buscar `user_challenge_progress` onde `user_id = req.user.id AND week_start = weekStart`
5. Se não encontrado → 404
6. Se `row[dayColumn] === true` → 409 (já marcado hoje — RNE-003)
7. UPDATE com coluna do whitelist (NUNCA interpolar string)
8. Calcular `streak` = contagem de colunas boolean `true`
9. Retornar progress atualizado + `day_marked` + `streak`

#### Proteção contra SQL Injection
```javascript
const ALLOWED_COLUMNS = new Set(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
if (!ALLOWED_COLUMNS.has(dayColumn)) throw new Error('Invalid day column');
```

#### SQL Executado
```sql
SELECT id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, challenge_id
FROM user_challenge_progress
WHERE user_id = $1 AND week_start = $2
LIMIT 1;

UPDATE user_challenge_progress
SET <dayColumn> = true, updated_at = NOW()
WHERE user_id = $1 AND week_start = $2
RETURNING *;
```

---

### ROTA 4 — Obter Sessão de Áudio

**`GET /api/sessions/:id`**

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Params
| Param | Tipo | Descrição |
|---|---|---|
| id | uuid | ID da sessão de áudio |

#### Resposta de Sucesso — `200 OK`
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "ff456...",
      "title": "Meditação Matinal para Iniciantes",
      "duration": 15,
      "category": "meditacao",
      "is_premium": false,
      "audio_url": "https://xxx.supabase.co/storage/v1/object/sign/audio/meditacao/matinal.mp3?token=...",
      "created_at": "2025-03-01T00:00:00Z"
    }
  }
}
```

#### Respostas de Erro
```json
{ "success": false, "error": "MISSING_TOKEN", "message": "Token de autenticação não fornecido" }
{ "success": false, "error": "PREMIUM_REQUIRED", "message": "Esta sessão requer uma assinatura premium. Faça upgrade para continuar." }
{ "success": false, "error": "SESSION_NOT_FOUND", "message": "Sessão não encontrada" }
{ "success": false, "error": "STORAGE_ERROR", "message": "Erro ao acessar o arquivo de áudio" }
```

#### Regras de Negócio
1. Extrair `user.id` de `req.user`
2. Buscar `sessions` onde `id = params.id`
3. Se não encontrado → 404
4. Se `session.is_premium === true`:
   - Buscar `user_profiles.is_premium` onde `user_id = req.user.id`
   - Se `is_premium === false` → 403
5. Se `session.audio_url` é path relativo: gerar URL assinada com `supabase.storage.from(BUCKET).createSignedUrl(path, 3600)`
6. Retornar session com `audio_url` válida por 1 hora

#### SQL Executado
```sql
SELECT id, title, duration, audio_url, category, is_premium, created_at
FROM sessions
WHERE id = $1
LIMIT 1;

SELECT is_premium FROM user_profiles WHERE user_id = $2 LIMIT 1;
```

---

## 4. CRONOGRAMA 10 DIAS — 3 PESSOAS

> **Carlos** = Arquitetura & Backend Lead
> **Letícia** = Banco de Dados & Backend
> **Sofia** = Documentação & Testes

---

### DIA 1 (Segunda) — Setup do Projeto

**Objetivo:** Repositório backend funcionando, servidor Express sobe sem erros, cliente Supabase configurado.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Inicializa `backend/` com `npm init -y` | `package.json` |
| **Carlos** | Instala: express, @supabase/supabase-js, joi, helmet, express-rate-limit, dotenv, pino | `package.json` |
| **Carlos** | Instala dev: jest, supertest, nodemon | `package.json` |
| **Carlos** | Cria `server.js` Express básico porta 3000 | `server.js` |
| **Carlos** | Cria `src/config/env.js` | `src/config/env.js` |
| **Carlos** | Cria `src/config/supabase.js` | `src/config/supabase.js` |
| **Carlos** | Configura `.gitignore` | `.gitignore` |
| **Letícia** | Documenta schema atual no banco (confirma colunas) | `migrations/schema_audit.md` |
| **Letícia** | Executa migrations: `001_add_is_premium_columns.sql` | `migrations/001_add_is_premium_columns.sql` |
| **Letícia** | Executa migrations: `002_add_updated_at_columns.sql` | `migrations/002_add_updated_at_columns.sql` |
| **Letícia** | Cria `.env.example` | `.env.example` |
| **Sofia** | Setup workspace Postman com variável `{{base_url}}` | Postman collection |
| **Sofia** | Documenta RNE-003 e lógica premium | `docs/rules.md` |

**Critério de conclusão:** `node server.js` sobe sem erro, porta 3000 ativa.

---

### DIA 2 (Terça) — Middleware e Estrutura

**Objetivo:** Todos os middlewares implementados, estrutura de rotas esqueleto integrada.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Implementa `src/middleware/auth.js` | `src/middleware/auth.js` |
| **Carlos** | Implementa `src/middleware/errorHandler.js` | `src/middleware/errorHandler.js` |
| **Carlos** | Implementa `src/middleware/validate.js` | `src/middleware/validate.js` |
| **Carlos** | Implementa `src/utils/responses.js` | `src/utils/responses.js` |
| **Carlos** | Implementa `src/utils/dateUtils.js` | `src/utils/dateUtils.js` |
| **Letícia** | Cria esqueleto de `src/routes/auth.js`, `exercises.js`, `sessions.js` | rotas |
| **Letícia** | Integra rotas no `server.js` | `server.js` |
| **Sofia** | Testa middleware `auth` manualmente | Postman |
| **Sofia** | Documenta error codes | `docs/error-codes.md` |

**Critério de conclusão:** Todas rotas retornam 501; middleware funciona.

---

### DIA 3 (Quarta) — Rota de Login

**Objetivo:** `POST /api/auth/login` funcionando end-to-end.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Cria `src/services/authService.js` → `loginUser()` | `src/services/authService.js` |
| **Carlos** | Cria `src/controllers/authController.js` → `login()` | `src/controllers/authController.js` |
| **Letícia** | Define `loginSchema` | `src/middleware/validate.js` |
| **Letícia** | Conecta controller + validação na rota | `src/routes/auth.js` |
| **Letícia** | Mapeia erros Supabase para HTTP corretos | `src/services/authService.js` |
| **Sofia** | Testa login com credenciais válidas | Postman |
| **Sofia** | Testa cases: email não cadastrado, senha errada, sem body, email malformado | Postman |

**Critério de conclusão:** Login válido retorna 200 com `access_token` + profile.

---

### DIA 4 (Quinta) — Rota de Registro

**Objetivo:** `POST /api/auth/register` criando usuário + perfil atomicamente.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Adiciona `registerUser()` em authService.js | `src/services/authService.js` |
| **Carlos** | Implementa conversão `DD/MM/YYYY → YYYY-MM-DD` | `src/services/authService.js` |
| **Carlos** | Implementa criação em duas etapas + erro handling | `src/services/authService.js` |
| **Letícia** | Define `registerSchema` | `src/middleware/validate.js` |
| **Letícia** | Adiciona função `register()` em authController.js | `src/controllers/authController.js` |
| **Letícia** | Conecta na rota `POST /api/auth/register` | `src/routes/auth.js` |
| **Sofia** | Testa registro completo, mínimo, email duplicado, password curta, data inválida | Postman |
| **Sofia** | Testa login imediato com novo usuário | Postman |

**Critério de conclusão:** Registrar + login com novo usuário funciona; row em `user_profiles` correto.

---

### DIA 5 (Sexta) — Rota Mark-Today

**Objetivo:** `PATCH /api/exercises/progress/mark-today` com proteção RNE-003.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Cria `src/services/exerciseService.js` → `markTodayProgress()` | `src/services/exerciseService.js` |
| **Carlos** | Implementa: busca linha, verifica dia, UPDATE, cálculo de streak | `src/services/exerciseService.js` |
| **Carlos** | Cria `src/controllers/exerciseController.js` → `markToday()` | `src/controllers/exerciseController.js` |
| **Letícia** | Testa `getDayColumn()` para cada dia da semana | console |
| **Letícia** | Implementa whitelist Set para coluna dinâmica | `src/services/exerciseService.js` |
| **Letícia** | Conecta controller na rota com middleware `auth` | `src/routes/exercises.js` |
| **Letícia** | Insere row de teste em `user_challenge_progress` | Supabase |
| **Sofia** | Testa: sem token → 401, sem progresso → 404, marcar com sucesso → 200, retry → 409 | Postman |
| **Sofia** | Documenta fuso horário | `docs/rules.md` |

**Critério de conclusão:** Mark-today funciona; segunda chamada retorna 409; coluna marcada como `true` no banco.

---

### DIA 6 (Sábado) — Rota Get Session

**Objetivo:** `GET /api/sessions/:id` com verificação premium e URL assinada.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Cria `src/services/sessionService.js` → `getSessionById()` | `src/services/sessionService.js` |
| **Carlos** | Implementa: busca session, verifica premium, gera URL assinada | `src/services/sessionService.js` |
| **Carlos** | Cria `src/controllers/sessionController.js` → `getSession()` | `src/controllers/sessionController.js` |
| **Carlos** | Conecta controller na rota `GET /api/sessions/:id` | `src/routes/sessions.js` |
| **Letícia** | Confirma formato de `sessions.audio_url` no Supabase | Supabase |
| **Letícia** | Implementa geração de URL assinada se path relativo | `src/services/sessionService.js` |
| **Letícia** | Adiciona `SUPABASE_STORAGE_BUCKET` ao `.env` | `.env` |
| **Sofia** | Testa: sem token → 401, ID inexistente → 404, free/premium combinations | Postman |

**Critério de conclusão:** Todas as 4 combinações retornam HTTP correto; URL assinada válida.

---

### DIA 7 (Domingo) — Testes de Integração

**Objetivo:** Suite de testes automatizados cobrindo casos críticos; todos passando.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Configura jest e scripts `test`, `test:watch` | `package.json` |
| **Carlos** | Cria `.env.test` com credenciais de teste | `.env.test` |
| **Carlos** | Cria `tests/helpers/seed.js` | `tests/helpers/seed.js` |
| **Carlos** | Escreve `tests/auth.test.js` | `tests/auth.test.js` |
| **Letícia** | Escreve `tests/exercises.test.js` | `tests/exercises.test.js` |
| **Letícia** | Escreve `tests/sessions.test.js` | `tests/sessions.test.js` |
| **Sofia** | Executa `npm test` e reporta resultados | `docs/test-results-day7.md` |
| **Sofia** | Abre issues para testes falhando | GitHub |

**Critério de conclusão:** `npm test` ≥ 90% passando.

---

### DIA 8 (Segunda) — Integração com App Mobile

**Objetivo:** LoginScreen e SignUpScreen usando novas rotas; fluxo testado no emulador.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Cria `src/api/api.js` no app mobile | `src/api/api.js` |
| **Carlos** | Cria `src/api/authApi.js` | `src/api/authApi.js` |
| **Carlos** | Atualiza `LoginScreen.js` para usar `authApi.login()` | `src/screens/LoginScreen.js` |
| **Carlos** | Armazena `access_token` no `AsyncStorage` | `src/screens/LoginScreen.js` |
| **Letícia** | Atualiza `SignUpScreen.js` para usar `authApi.register()` | `src/screens/SignUpScreen.js` |
| **Letícia** | Cria `src/api/exerciseApi.js` e `sessionApi.js` | `src/api/` |
| **Letícia** | Adiciona `EXPO_PUBLIC_API_URL` ao `.env.local` | `.env.local` |
| **Sofia** | Testa fluxo completo no emulador: login → home → categoria → player | Emulador |
| **Sofia** | Testa cadastro e exercício em emulador | Emulador |
| **Sofia** | Documenta erros de CORS/SSL | `docs/integration-issues.md` |

**Critério de conclusão:** LoginScreen e SignUpScreen funcionam via nova API; token armazenado.

---

### DIA 9 (Terça) — Documentação Técnica

**Objetivo:** Documentação completa; novo dev consegue rodar em 15 minutos.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Escreve `backend/README.md` | `backend/README.md` |
| **Carlos** | Documenta script de migrations | `backend/README.md` |
| **Carlos** | Adiciona `helmet` e `express-rate-limit` | `server.js` |
| **Letícia** | Adiciona comentários JSDoc em services/controllers | todos |
| **Letícia** | Substitui `console.log` por `pino` logger | todos |
| **Letícia** | Escreve `migrations/README.md` | `migrations/README.md` |
| **Sofia** | Exporta collection Postman como JSON | `docs/motus-api.postman_collection.json` |
| **Sofia** | Cria `docs/TESTING.md` | `docs/TESTING.md` |
| **Sofia** | Gera/escreve `docs/openapi.yaml` | `docs/openapi.yaml` |

**Critério de conclusão:** README claro; `npm install && npm start` funciona seguindo o README.

---

### DIA 10 (Quarta) — Ajustes Finais e Entrega

**Objetivo:** Revisão de segurança, todos os testes passando, entrega formal.

| Pessoa | Tarefas | Arquivo(s) |
|---|---|---|
| **Carlos** | Code review completo: nenhuma service_role_key em response | todos |
| **Carlos** | Verifica SQL injection (especialmente coluna dinâmica) | todos |
| **Carlos** | Adiciona CORS para origem do app mobile | `server.js` |
| **Carlos** | Executa `npm audit` e corrige críticas | terminal |
| **Letícia** | Executa `npm test` completo | terminal |
| **Letícia** | Revisa índices do banco (user_id + week_start) | Supabase |
| **Letícia** | Documenta como adicionar futuras rotas | `backend/README.md` |
| **Sofia** | Executa smoke tests completos (todas as 4 rotas) | Postman + Emulador |
| **Sofia** | Apresentação final ao vivo | — |
| **Sofia** | Entrega: repo + collection Postman + docs/ | — |

**Critério de conclusão:** `npm test` 100% passando; smoke tests confirmados; nenhum secret exposto.

---

## 5. VARIÁVEIS DE AMBIENTE

### `backend/.env.example`

```env
# ─── SERVIDOR ───────────────────────────────────────
PORT=3000
NODE_ENV=development          # development | production | test

# ─── SUPABASE ────────────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=seu-jwt-secret-aqui

# ─── STORAGE ─────────────────────────────────────────
SUPABASE_STORAGE_BUCKET=audio

# ─── CORS ────────────────────────────────────────────
FRONTEND_URL=exp://192.168.1.100:8081
```

### `app/.env.local` (mobile)

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 6. INTEGRAÇÃO COM O APP MOBILE

### 6.1 Novo arquivo: `src/api/api.js`

```javascript
// src/api/api.js
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();
  if (!res.ok) throw { status: res.status, ...json };
  return json.data;
}

export const api = {
  post: (path, body, token) => request('POST', path, body, token),
  patch: (path, body, token) => request('PATCH', path, body, token),
  get: (path, token) => request('GET', path, null, token),
};
```

### 6.2 Atualização: `src/screens/LoginScreen.js`

**Antes:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

**Depois:**
```javascript
import { api } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const data = await api.post('/api/auth/login', { email, password });
await AsyncStorage.setItem('access_token', data.access_token);
await AsyncStorage.setItem('user_profile', JSON.stringify(data.profile));
navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
```

### 6.3 Atualização: `src/screens/SignUpScreen.js`

**Antes:**
```javascript
await supabase.auth.signUp({ email, password });
await supabase.from('user_profiles').insert([...]);
```

**Depois:**
```javascript
const data = await api.post('/api/auth/register', {
  email, password, name, lastName, phone, birthDate,
});
await AsyncStorage.setItem('access_token', data.access_token);
navigation.replace('Home');
```

### 6.4 Novo arquivo: `src/api/exerciseApi.js`

```javascript
// src/api/exerciseApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export async function markTodayExercise() {
  const token = await AsyncStorage.getItem('access_token');
  return api.patch('/api/exercises/progress/mark-today', {}, token);
}
```

### 6.5 Novo arquivo: `src/api/sessionApi.js`

```javascript
// src/api/sessionApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export async function getSession(sessionId) {
  const token = await AsyncStorage.getItem('access_token');
  return api.get(`/api/sessions/${sessionId}`, token);
}
```

### 6.6 Telas que NÃO precisam ser migradas nesta sprint

| Tela | Operação |
|---|---|
| `HomeScreen.js` | SELECT categories, user_profiles |
| `AudioPlayerScreen.js` | INSERT user_sessions |
| `EditProfileScreen.js` | SELECT/UPDATE user_profiles |
| `ReportProblemScreen.js` | INSERT reports |
| `MascotScreen.js` | UPDATE has_seen_tutus |

---

**_Versão 1.0 — 30/05/2026 — Documentação pronta para implementação._**