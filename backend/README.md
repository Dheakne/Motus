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
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key (**modo de teste**, `sk_test_...`). Opcional: sem ela as rotas de pagamento respondem 503 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` do `stripe listen` (local) ou do endpoint de webhook criado no Stripe (Render) |
| `API_PUBLIC_URL` | URL pública deste backend (ex.: `https://motus-dm29.onrender.com`), usada no retorno do checkout |

## Banco de dados

Execute as migrations no **Supabase SQL Editor** antes de subir o servidor:

```
migrations/001_add_is_premium_columns.sql
migrations/002_add_updated_at_columns.sql
migrations/003_make_optional_columns_nullable.sql
migrations/004_add_consent_columns.sql
migrations/007_add_premium_subscriptions.sql
```

(005 e 006 são do painel admin, na branch `feature`.)

Veja [migrations/README.md](migrations/README.md) para detalhes.

## Rodando o servidor

```bash
# Desenvolvimento (hot reload)
npm run dev

# Produção
npm start
```

Servidor sobe em `http://localhost:3000` por padrão.

## Produção

O backend está em deploy no Render: **https://motus-dm29.onrender.com**

Configuração do serviço no Render:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plano | Free |

Variáveis de ambiente configuradas no dashboard do Render (iguais ao `.env` local, exceto `PORT`, que o Render injeta automaticamente, e `SUPABASE_ANON_KEY`, que não é usada pelo backend):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_STORAGE_BUCKET`, `FRONTEND_URL`, `NODE_ENV=production`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `API_PUBLIC_URL`.

> **Plano free "dorme" após inatividade.** A primeira requisição depois de um tempo sem uso pode levar 30-50s para responder enquanto o serviço acorda — não é bug.

No app mobile, aponte `EXPO_PUBLIC_API_URL` (em `.env`, na raiz do projeto) para essa URL em vez de `localhost`.

### Troubleshooting: "só funciona no meu celular"

Se o login/cadastro só funciona no celular de uma pessoa específica da equipe, o motivo quase sempre é `EXPO_PUBLIC_API_URL=http://localhost:3000` no `.env` dela. Em um **dispositivo físico**, `localhost` aponta para o próprio celular, não para o computador — então isso só "funciona" em emulador/simulador, ou se o `.env` tiver sido trocado manualmente para o IP da rede local de quem testou (o que só funciona na rede Wi-Fi dessa pessoa). Usar a URL de produção do Render acima resolve isso para qualquer rede.

## Rotas disponíveis

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cadastra novo usuário |
| POST | `/api/auth/login` | — | Autentica usuário |
| PATCH | `/api/exercises/progress/mark-today` | Bearer token | Marca dia do exercício semanal |
| GET | `/api/sessions/:id` | Bearer token | Retorna sessão de áudio |
| GET | `/api/premium/status` | Bearer token | Status premium e assinatura ativa |
| POST | `/api/billing/checkout` | Bearer token | Cria o checkout do Stripe (`{ plan: 'monthly' \| 'annual', return_url? }`) |
| POST | `/api/billing/cancel` | Bearer token | Cancela a assinatura ao fim do período pago |
| POST | `/api/billing/resume` | Bearer token | Desfaz o cancelamento (sem cobrança imediata) |
| GET | `/api/billing/return` | — | Página de retorno do checkout (abre no navegador) |
| POST | `/api/webhooks/stripe` | Assinatura Stripe | Eventos de assinatura do Stripe |

## Pagamentos (Stripe, modo de teste)

O premium é vendido pelo Stripe em **modo de teste**: nenhuma cobrança real acontece.
Passo a passo de configuração, cartões de teste e integração com o painel em [PLANO_PREMIUM.md](../PLANO_PREMIUM.md).

```bash
npm run stripe:setup    # cria o produto e os preços (R$ 13,00/mês e R$ 104,90/ano)
npm run stripe:listen   # repassa os webhooks para o backend local (precisa da Stripe CLI)
```

## Testes

Crie um `.env.test` com credenciais de um projeto Supabase de teste e execute:

```bash
npm test
```

## Estrutura de pastas

```
backend/
├── src/
│   ├── config/        ← env vars e clientes Supabase e Stripe
│   ├── controllers/   ← recebe req/res, chama services
│   ├── middleware/    ← auth JWT, validação Joi, error handler
│   ├── routes/        ← definição das rotas Express
│   ├── services/      ← regras de negócio e queries Supabase
│   ├── utils/         ← respostas padronizadas e utilitários de data
│   └── validators/    ← schemas Joi
├── migrations/        ← SQL para alterações no banco
├── scripts/           ← utilitários (stripe-setup.js)
├── tests/             ← testes de integração com supertest
├── .env.example
└── server.js          ← entry point
```

## Adicionando novas rotas

1. Crie o schema Joi em `src/validators/`
2. Crie o service em `src/services/`
3. Crie o controller em `src/controllers/`
4. Registre a rota em `src/routes/` e importe no `server.js`
