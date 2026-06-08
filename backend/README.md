# Motus — Backend

API REST em Node.js + Express para o app mobile Motus.

## Requisitos

- Node.js 18 LTS ou superior
- Conta e projeto no [Supabase](https://supabase.com)

## Instalação

```bash
cd backend
npm install
```

## Configuração

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

| Variável | Onde encontrar |
|----------|---------------|
| `SUPABASE_URL` | Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role → Reveal |
| `SUPABASE_JWT_SECRET` | Settings → API → JWT Secret → Reveal |
| `SUPABASE_STORAGE_BUCKET` | Nome do bucket de áudio (ex.: `audio`) |
| `FRONTEND_URL` | URL do app Expo — use `*` em desenvolvimento |

## Banco de dados

Execute as migrations no **Supabase SQL Editor** antes de subir o servidor:

```
migrations/001_add_is_premium_columns.sql
migrations/002_add_updated_at_columns.sql
migrations/003_make_optional_columns_nullable.sql
```

Veja [migrations/README.md](migrations/README.md) para detalhes.

## Rodando o servidor

```bash
# Desenvolvimento (hot reload)
npm run dev

# Produção
npm start
```

Servidor sobe em `http://localhost:3000` por padrão.

## Rotas disponíveis

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cadastra novo usuário |
| POST | `/api/auth/login` | — | Autentica usuário |
| PATCH | `/api/exercises/progress/mark-today` | Bearer token | Marca dia do exercício semanal |
| GET | `/api/sessions/:id` | Bearer token | Retorna sessão de áudio |

## Testes

Crie um `.env.test` com credenciais de um projeto Supabase de teste e execute:

```bash
npm test
```

## Estrutura de pastas

```
backend/
├── src/
│   ├── config/        ← env vars e cliente Supabase
│   ├── controllers/   ← recebe req/res, chama services
│   ├── middleware/    ← auth JWT, validação Joi, error handler
│   ├── routes/        ← definição das rotas Express
│   ├── services/      ← regras de negócio e queries Supabase
│   ├── utils/         ← respostas padronizadas e utilitários de data
│   └── validators/    ← schemas Joi
├── migrations/        ← SQL para alterações no banco
├── tests/             ← testes de integração com supertest
├── .env.example
└── server.js          ← entry point
```

## Adicionando novas rotas

1. Crie o schema Joi em `src/validators/`
2. Crie o service em `src/services/`
3. Crie o controller em `src/controllers/`
4. Registre a rota em `src/routes/` e importe no `server.js`
