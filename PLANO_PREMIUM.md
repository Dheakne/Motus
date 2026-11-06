# PLANO_PREMIUM — Assinatura Premium (Stripe, modo de teste)

> **Versão 1.0** · Elaborado em 23/10/2026 · branch `feature-premium`
> Complementa o [PLANO_BACKEND.md](./PLANO_BACKEND.md) e o [PLANO_ADMIN.md](./PLANO_ADMIN.md).

---

## SUMÁRIO

1. [Decisões](#1-decisoes)
2. [Modelo de dados](#2-modelo-de-dados)
3. [Segurança](#3-seguranca)
4. [Fluxo de compra](#4-fluxo-de-compra)
5. [Endpoints](#5-endpoints)
6. [Configuração passo a passo](#6-configuracao)
7. [Como testar](#7-como-testar)
8. [Integração com o painel admin](#8-painel-admin)
9. [Relatórios](#9-relatorios)
10. [Limitações conhecidas](#10-limitacoes)

---

## 1. DECISÕES

| Tema | Decisão | Motivo |
|---|---|---|
| Pagamento | **Stripe em modo de teste** | Projeto acadêmico, não será publicado nas lojas. O Stripe de teste demonstra o fluxo completo (checkout, cartão, webhook, renovação, cancelamento) sem cobrança real e sem contas de Apple/Google. |
| Compra in-app (App Store / Play) | Não usada | Exigiria Apple Developer (US$ 99/ano), Play Console e app cadastrado nas lojas. Se o app fosse publicado, as regras das lojas obrigariam compra in-app (ex.: via RevenueCat). |
| Planos | Mensal **R$ 13,00** · Anual **R$ 104,90** (≈ R$ 8,74/mês, 33% de desconto) | Preço acessível para o público brasileiro. Sem teste grátis. |
| O que o premium libera | Exercícios semanais com `is_free = false` e áudios com `is_premium = true` | — |
| Quem grava `is_premium` | **Só o backend** (`premiumService.syncUserPremium`) | O app nunca escreve esse campo. |

---

## 2. MODELO DE DADOS

Migration [`007_add_premium_subscriptions.sql`](backend/migrations/007_add_premium_subscriptions.sql).

### `premium_subscriptions` (nova)

Uma linha por assinatura do Stripe **ou** por liberação manual feita no painel.

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `auth.users` |
| source | text | `stripe` ou `admin` |
| plan | text | `monthly`, `annual` (null para `admin`) |
| status | text | `active`, `past_due`, `incomplete`, `canceled` — **só `active` dá acesso** |
| amount_cents / currency | int / text | Valor cobrado (ex.: 1300 / `brl`) |
| stripe_customer_id / stripe_subscription_id | text | IDs no Stripe (`stripe_subscription_id` é único) |
| cancel_at_period_end | boolean | Usuário pediu cancelamento; segue premium até `current_period_end` |
| current_period_end | timestamptz | Fim do período pago / próxima renovação |
| started_at | timestamptz | Início da assinatura |
| canceled_at | timestamptz | Quando o acesso terminou de fato |
| granted_by | uuid | Admin que liberou (só `source = admin`) |

RLS ligado: o usuário lê só as próprias linhas; escrita só pela `service_role`.

### `user_profiles.is_premium` (já existia)

Continua sendo o campo que o app consulta. É **derivado**: premium = existe alguma linha `active` em `premium_subscriptions`. Assim, uma liberação do painel e uma assinatura paga convivem sem que uma desfaça a outra.

---

## 3. SEGURANÇA

**Problema encontrado:** a policy `perfil: editar o proprio` (UPDATE em `user_profiles` para `authenticated`) não restringe colunas, e a policy de INSERT também não. Qualquer usuário logado podia virar premium com a anon key. Exemplo: `update user_profiles set is_premium = true`.

**Correção (migration 007):**
- Trigger `trg_protect_is_premium`: para os papéis `anon`/`authenticated`, INSERT força `is_premium = false` e UPDATE que altera `is_premium` é recusado. O backend (`service_role`) e o SQL Editor (`postgres`) não são afetados.
- Trigger `trg_enforce_premium_challenge`: a escolha do exercício semanal é gravada direto pelo app em `user_challenge_progress`, então o banco recusa escolher exercício premium sem ser premium. Marcar os dias do exercício já escolhido continua liberado.
- Áudios premium: o player pede a URL ao backend (`GET /api/sessions/:id`), que confere o premium.
- Webhook: validado pela assinatura `stripe-signature` (corpo cru).
- Retorno do checkout: só redireciona para `exp://`, `exps://`, `motusapp://`, `localhost` ou `FRONTEND_URL`, para não virar redirecionamento aberto.

---

## 4. FLUXO DE COMPRA

```
App (PlansScreen)                Backend                         Stripe
──────────────────               ───────                         ──────
"Assinar Premium" ─────────────► POST /api/billing/checkout ───► cria Checkout Session
                  ◄───────────── { url }
abre a url no navegador ───────────────────────────────────────► página de pagamento
                                                                 (cartão 4242...)
                                 GET /api/billing/return ◄────── redireciona após pagar
                                 ├─ sincroniza a assinatura
                                 └─ volta para o app (deep link)
                                 POST /api/webhooks/stripe ◄──── eventos (criada, renovada,
                                 └─ atualiza premium_subscriptions    cancelada, expirada)
                                    e recalcula is_premium
consulta /api/premium/status ──►
até is_premium = true
```

O retorno do checkout já sincroniza a assinatura, então a compra funciona mesmo que o webhook ainda não esteja configurado. **Renovação, cancelamento e expiração** chegam pelo webhook. Se um evento se perder (por exemplo, `stripe listen` desconectado), o `GET /api/premium/status` confere no Stripe as assinaturas que ainda constam como ativas e corrige o banco na próxima vez que o app abrir a tela de planos.

---

## 5. ENDPOINTS

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/premium/status` | Bearer | `{ is_premium, subscription }` |
| POST | `/api/billing/checkout` | Bearer | Body `{ plan: 'monthly' \| 'annual', return_url? }` → `{ url }`. 409 `ALREADY_PREMIUM` se já for premium |
| POST | `/api/billing/cancel` | Bearer | Cancela ao fim do período. 404 `NO_ACTIVE_SUBSCRIPTION` |
| POST | `/api/billing/resume` | Bearer | Desfaz o cancelamento enquanto o período pago não acabou. Nenhuma cobrança imediata: a próxima é na data de renovação original. 404 `NO_ACTIVE_SUBSCRIPTION` |
| GET | `/api/billing/return` | — | Página de retorno do Stripe |
| POST | `/api/webhooks/stripe` | Assinatura | `checkout.session.completed`, `customer.subscription.created/updated/deleted` |

Sem `STRIPE_SECRET_KEY`, as rotas de pagamento respondem 503 `BILLING_NOT_CONFIGURED` (o resto do backend funciona normalmente).

---

## 6. CONFIGURAÇÃO

### 6.1 Banco
Rodar [`007_add_premium_subscriptions.sql`](backend/migrations/007_add_premium_subscriptions.sql) no SQL Editor do Supabase.

### 6.2 Conta Stripe
1. Criar conta em [stripe.com](https://stripe.com) (gratuito; o modo de teste não pede CNPJ).
2. Com o seletor **"Test mode"** ligado: Developers → API keys → copiar a **Secret key** (`sk_test_...`).
3. Em `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   API_PUBLIC_URL=http://192.168.x.x:3000        # local: IP do computador na rede; no Render: https://motus-dm29.onrender.com
   ```
   Não use `localhost`: depois do pagamento, quem abre essa URL é o navegador do celular, e no celular `localhost` é o próprio aparelho.
4. Criar produto e preços: `cd backend && npm run stripe:setup`.

### 6.3 Webhook
- **Local:** instalar a [Stripe CLI](https://docs.stripe.com/stripe-cli), rodar `stripe login` e depois `npm run stripe:listen`. Copiar o `whsec_...` exibido para `STRIPE_WEBHOOK_SECRET` no `.env` e reiniciar o backend.
- **Render:** no Stripe, Developers → Webhooks → Add endpoint `https://motus-dm29.onrender.com/api/webhooks/stripe`, com os eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`. Copiar o *Signing secret* para `STRIPE_WEBHOOK_SECRET` nas variáveis do Render, junto com `STRIPE_SECRET_KEY` e `API_PUBLIC_URL`.

> O app usa o backend do Render por padrão (`EXPO_PUBLIC_API_URL`). Para testar o pagamento no celular, o Render precisa estar com o código desta branch e com as variáveis acima.

---

## 7. COMO TESTAR

| Cartão | Resultado |
|---|---|
| `4242 4242 4242 4242` | Aprovado |
| `4000 0000 0000 0002` | Recusado |
| `4000 0000 0000 9995` | Saldo insuficiente |

Qualquer data futura, qualquer CVC e qualquer nome. Mais cartões em [docs.stripe.com/testing](https://docs.stripe.com/testing).

- **Renovação e expiração:** no Stripe, em Billing → Test clocks, dá para "avançar o tempo" de um cliente e gerar renovações e cancelamentos. Isso é útil para popular os relatórios.
- **Cancelamento:** no app, Planos → "Cancelar assinatura". O usuário continua premium até o fim do período. Quando o período termina, o webhook muda o status para `canceled` e desliga o premium.
- **Reativação:** enquanto o período pago não acabou, "Reativar assinatura" desfaz o cancelamento sem cobrar nada na hora. Depois que o período acaba, o usuário assina de novo pelo checkout normal.

---

## 8. PAINEL ADMIN

O painel (branch `feature`) **não foi alterado**. O premium deixa pronto no backend:

### Liberar ou revogar premium manualmente
O `PATCH /api/admin/users/:id` previsto no PLANO_ADMIN **não deve gravar `is_premium` direto**. Ele deve chamar:

```js
const { grantAdminPremium, revokeAdminPremium } = require('../../services/premiumService');

// { is_premium: true }
await grantAdminPremium(userId, req.user.id);   // cria linha source='admin' e recalcula is_premium
// { is_premium: false }
await revokeAdminPremium(userId);               // encerra só a liberação do painel
```

E continuar gravando o `admin_audit_log` (`action: 'user.set_premium'`).

`revokeAdminPremium` **não cancela assinatura paga**. Se o usuário pagou pelo Stripe, ele continua premium. Para mostrar isso na tela de usuários, basta listar as linhas de `premium_subscriptions` do usuário.

### KPIs já existentes
`premium_users` e `premium_rate` da Visão geral continuam corretos, porque contam `user_profiles.is_premium`.

---

## 9. RELATÓRIOS

Serviço pronto: [`premiumReportService.getPremiumReport({ from, to })`](backend/src/services/premiumReportService.js). Sugestão de rota no painel: `GET /api/admin/metrics/premium?from=...&to=...`.

| Métrica | Descrição |
|---|---|
| `active_premium_users` | Usuários com acesso premium agora |
| `active_by_source` | Pagantes (Stripe) × liberados pelo painel |
| `active_by_plan` | Mensal × anual |
| `new_subscriptions` / `new_admin_grants` | Novos no período |
| `cancellations` / `churn_rate` | Acessos encerrados no período / ativos no início do período |
| `mrr_cents` | Receita recorrente mensal (anual ÷ 12) |

Ideia para depois: um gráfico de novos assinantes por semana, a partir de `premium_subscriptions.started_at`.

---

## 10. LIMITAÇÕES CONHECIDAS

- **Bucket `audio-files` é público.** Quem tiver a URL de um áudio consegue ouvi-lo sem login. O app só busca a URL de áudios premium pelo backend, mas para proteger de verdade seria preciso tornar o bucket privado e salvar caminhos relativos em `sessions.audio_url` (o backend já gera URL assinada nesse caso). Hoje **nenhum áudio está marcado como premium**.
- `past_due` (pagamento de renovação falhou) **remove** o acesso até o Stripe conseguir cobrar.
- Na web, o checkout abre na mesma aba e o app recarrega ao voltar.
- Cada checkout abandonado sem assinatura anterior cria um *customer* novo no Stripe (sem impacto no modo de teste).
