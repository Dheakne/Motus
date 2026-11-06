# Deploy do Painel Admin em produção

Passo a passo para colocar o painel administrativo (`admin/`) e as rotas novas do backend (`/api/admin/*`) no ar.

**Faça na ordem.** Algumas etapas dependem da anterior (as migrations precisam existir antes do código novo, e a URL do painel só existe depois de criá-lo no Render).

| Etapa | Onde | Quem pode fazer |
|---|---|---|
| 0. Reativar o Supabase (se estiver pausado) | Supabase | Quem é dono do projeto |
| 1. Rodar as migrations 007 a 010 | Supabase → SQL Editor | Qualquer pessoa com acesso ao projeto |
| 2. Conferir o bucket de áudio | Supabase → Storage | Idem |
| 3. Testar tudo localmente | Seu computador | Quem tem o `backend/.env` |
| 4. Levar a branch `feature` para a `main` | GitHub | Quem tem permissão no repositório |
| 5. Conferir o deploy do backend | Render | Quem tem acesso ao Render |
| 6. Criar o Static Site do painel | Render | Idem |
| 7. Liberar o painel no CORS do backend | Render | Idem |
| 8. Testar em produção | Navegador | Qualquer admin |
| 9. Dar acesso ao time | Painel | Superadmin |
| 10. Publicar o app mobile | EAS | Quem publica o app |

---

## 0. Reativar o Supabase (se estiver pausado)

Projetos do plano gratuito são **pausados** depois de alguns dias sem uso. Quando isso acontece, o endereço `https://xxxx.supabase.co` deixa de existir e **o app inteiro para de funcionar** (login, sessões, tudo).

1. Entre em https://supabase.com/dashboard e abra o projeto.
2. Se aparecer um aviso de projeto pausado, clique em **Restore project** e espere alguns minutos.
3. Teste no navegador: `https://SEU-PROJETO.supabase.co/rest/v1/` deve responder (um erro de "No API key" é normal e significa que está no ar).

## 1. Rodar as migrations

As migrations 005 e 006 já foram rodadas na Fase 1. Faltam quatro, **nesta ordem**:

| Arquivo | O que faz | Risco |
|---|---|---|
| `backend/migrations/007_add_reports_status.sql` | Coluna `status` nos relatos (todos os existentes ficam "em aberto") | Nenhum: só adiciona coluna com valor padrão |
| `backend/migrations/008_create_user_sessions.sql` | Cria a tabela de sessões concluídas, que o app já tentava usar mas não existia | Nenhum: cria tabela nova. A partir daí, as conclusões de áudio passam a ser registradas |
| `backend/migrations/009_add_sessions_is_active.sql` | Coluna `is_active` nas sessões (todas as existentes ficam ativas) | Nenhum: só adiciona coluna com valor padrão |
| `backend/migrations/010_add_metrics_indexes.sql` | Índices para as métricas ficarem rápidas | Nenhum: só cria índices |

Para cada uma:

1. No Supabase, menu lateral **SQL Editor** → **+ New**.
2. Abra o arquivo no VS Code, copie **todo** o conteúdo e cole no editor.
3. Clique em **Run** (ou Ctrl+Enter). O esperado é **"Success. No rows returned"**.

Conferência (numa query nova):

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE (table_name = 'reports' AND column_name IN ('status', 'updated_at'))
   OR (table_name = 'sessions' AND column_name = 'is_active')
   OR (table_name = 'user_sessions' AND column_name = 'completed_at');
```

Deve listar **4 linhas**: `status`, `updated_at`, `is_active` e `completed_at`.

> A 009 precisa rodar **antes** do app mobile novo ser publicado (etapa 10): o app passa a filtrar sessões por `is_active`. Rodando agora, já fica garantido.

## 2. Conferir o bucket de áudio

O app toca o áudio direto da URL gravada em `sessions.audio_url`. O painel envia o arquivo para o Storage e grava a **URL pública**. Para isso funcionar, o bucket precisa ser **público** (provavelmente já é, porque os áudios atuais tocam no app).

1. Supabase → **Storage**.
2. Encontre o bucket com o mesmo nome de `SUPABASE_STORAGE_BUCKET` (no `backend/.env` ou no Environment do Render).
3. Ele deve ter o selo **Public**. Se não tiver: abra os três pontinhos do bucket → **Edit bucket** → ative **Public bucket** → Save.
4. Ainda no bucket, confira o **limite de tamanho de arquivo** (o painel aceita até 50 MB, que é o padrão do plano free).

## 3. Testar tudo localmente

Com o backend (`cd backend && npm run dev`) e o painel (`cd admin && npm run dev`) rodando, entre em http://localhost:5173 e percorra:

- [ ] **Visão geral**: os 6 números aparecem e o gráfico de crescimento carrega. "Relatos em aberto" mostra um número (se mostrar "Rode a migration 007", a etapa 1 não pegou).
- [ ] **Engajamento**: troque entre 7, 30 e 90 dias; os gráficos mudam.
- [ ] **Usuários**: busque pelo seu email; abra o seu usuário; os históricos aparecem.
- [ ] **Usuários → ativar premium**: teste **só na sua conta**, depois remova.
- [ ] **Conteúdo → Nova sessão**: envie um mp3 curto com o título "TESTE - não usar", **desmarque "Ativa"**, salve. Depois clique em Editar → "Ouvir áudio atual" e confira se toca.
- [ ] **Conteúdo → Categorias**: só abra e feche um "Editar" (não renomeie: o app encontra as sessões pelo nome da categoria).
- [ ] **Exercícios semanais**: crie um "TESTE - não usar" (já nasce inativo) e edite.
- [ ] **Relatos**: mude o status de um relato e volte para o original.
- [ ] **Administradores** e **Histórico**: as ações acima aparecem no Histórico.

Depois dos testes, o conteúdo "TESTE" pode ser apagado no Supabase (Table Editor → `sessions` / `weekly_challenges` → selecionar a linha → Delete), ou só deixado inativo.

**Testes automatizados (opcional):** os testes de integração rodam contra o banco do `.env.test`. Hoje o único banco é o de produção; os testes criam usuários e conteúdo temporários (inativos) e apagam tudo no final.

```bash
cd backend
cp .env .env.test
npm test
```

## 4. Levar a branch `feature` para a `main`

O Render faz deploy da `main`. Antes de abrir o PR, traga o que o time fez na `main` para evitar conflitos:

```bash
git checkout feature
git fetch origin
git merge origin/main      # resolva conflitos se aparecerem
git push origin feature
```

Depois, no GitHub: **Pull requests → New pull request**, base `main` ← compare `feature`. Cada fase está num commit separado, então dá para revisar fase por fase. Combine com o time e faça o **merge**.

> Confirme antes em **Render → serviço do backend → Settings → Branch** que o deploy é mesmo da `main`.

## 5. Conferir o deploy do backend

O Render redeploya sozinho depois do merge (veja em **Render → serviço → Events**; leva alguns minutos).

Teste no navegador: https://motus-dm29.onrender.com/api/admin/me

- `{"success":false,"error":"MISSING_TOKEN",...}` → **certo**, as rotas novas estão no ar.
- `NOT_FOUND` → o deploy ainda não terminou ou foi de outra branch.
- Demora ~50 segundos → normal, o plano free estava "dormindo".

## 6. Criar o Static Site do painel no Render

1. https://dashboard.render.com → **+ New** → **Static Site**.
2. Conecte o repositório `Dheakne/Motus`.
3. Preencha:

| Campo | Valor |
|---|---|
| Name | `motus-admin` (vira parte da URL) |
| Branch | `main` |
| Root Directory | `admin` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. Em **Environment Variables** (ou **Advanced → Add Environment Variable**), cadastre:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://motus-dm29.onrender.com` |
| `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` (**sem** `/rest/v1` no final) |
| `VITE_SUPABASE_ANON_KEY` | a chave **anon** (pública). **Nunca** a service_role |

5. Clique em **Create Static Site** e espere o primeiro deploy terminar (status **Live**).
6. Anote a URL gerada, algo como `https://motus-admin.onrender.com`.

7. **Redirects/Rewrites** (obrigatório): no Static Site, menu **Redirects/Rewrites** → **Add Rule**:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | **Rewrite** |

Sem essa regra, recarregar a página em `/users` ou `/login` dá 404.

8. **Headers** (recomendado): menu **Headers** → **Add Header**, com Path `/*`:

| Name | Value |
|---|---|
| `X-Robots-Tag` | `noindex, nofollow` |
| `X-Frame-Options` | `DENY` |

> As variáveis `VITE_...` entram no build. Se mudar alguma depois, use **Manual Deploy → Deploy latest commit** para valer.

## 7. Liberar o painel no CORS do backend

O backend só aceita chamadas do painel vindas das URLs listadas em `ADMIN_FRONTEND_URL`.

1. Render → serviço do **backend** → **Environment** → **Add Environment Variable**.
2. Key `ADMIN_FRONTEND_URL`, Value com a URL da etapa 6 **e** o localhost (para o painel local continuar funcionando), separados por vírgula, **sem `/` no final**:

```
https://motus-admin.onrender.com,http://localhost:5173
```

3. **Save Changes**. O backend reinicia sozinho.

## 8. Testar em produção

1. Abra a URL do painel e entre com sua conta (o primeiro acesso pode levar até 1 minuto enquanto o backend acorda; o painel avisa).
2. Navegue por todas as telas.
3. Recarregue a página dentro de **Usuários** (F5): não pode dar 404.
4. Abra o DevTools (F12) → aba **Console**: não pode haver erro de CORS.

| Sintoma | Causa provável |
|---|---|
| "Não foi possível conectar" no login | `ADMIN_FRONTEND_URL` errado ou faltando (etapa 7), ou URL com `/` no final |
| Erro de CORS no console | Idem |
| Tela branca com "Defina VITE_SUPABASE_URL…" | Variáveis do Static Site faltando; cadastre e faça **Manual Deploy** |
| 404 ao recarregar a página | Regra de Rewrite faltando (etapa 6, item 7) |
| "Email ou senha inválidos…" com a senha certa | Sua conta não está em `admin_users` |
| "Relatos em aberto: Rode a migration 007" | Migration 007 não foi rodada |
| Erro ao listar sessões de áudio | Migration 009 não foi rodada |
| Erro na Visão geral, Engajamento ou Detalhe do usuário | Migration 008 (`user_sessions`) não foi rodada |
| Áudio enviado não toca no app | Bucket não é público (etapa 2) |

## 9. Dar acesso ao time

No painel, **Administradores → Conceder acesso**, com o email da conta do app de cada pessoa:

- **Admin**: usa todas as telas de conteúdo, usuários, engajamento e relatos.
- **Superadmin**: tudo isso + gerencia administradores e vê o Histórico.

A pessoa precisa já ter conta no app. Ninguém consegue alterar ou revogar o próprio acesso.

## 10. Publicar o app mobile

O app ganhou uma mudança pequena: a tela de categoria só mostra sessões **ativas** (para "Desativar" no painel funcionar). Ela chega aos usuários na próxima versão do app (`eas build` / atualização). Quem usa Expo Go em desenvolvimento recebe ao fazer `git pull`.

Como a migration 009 já foi rodada na etapa 1, não há ordem a respeitar aqui.

---

## Se precisar voltar atrás

- **Painel com problema**: no Static Site, **Suspend** (o app não é afetado; ele não usa o painel).
- **Backend com problema**: Render → serviço → **Events** → escolha o deploy anterior → **Rollback**.
- **Migrations**: não precisam ser desfeitas. Elas só adicionam colunas e índices, e o código antigo continua funcionando com elas.

## Observações

- O backend no plano free "dorme" sem uso; o primeiro acesso do dia demora ~50s. O Static Site do painel não dorme.
- Uma conta que já fez ações pelo painel não pode ser excluída do Supabase Auth enquanto tiver linhas no Histórico (`admin_audit_log`), que é o que garante a auditoria. Para excluir, revogue o acesso e apague antes as linhas dela em `admin_audit_log`.
- O painel não mostra telefone nem data de nascimento dos usuários de propósito (minimização de dados pessoais, LGPD).
