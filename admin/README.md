# Motus Admin

Painel administrativo web do Motus (Vite + React + TypeScript). Plano completo em [PLANO_ADMIN.md](../PLANO_ADMIN.md).

O painel **nunca** acessa o banco direto: usa o Supabase só para o login (anon key) e para enviar arquivos de áudio com uma URL de upload assinada pelo backend. Todos os dados vêm de `/api/admin/*` no backend.

## Telas

| Tela | Quem vê | O que faz |
|---|---|---|
| Visão geral | admin e superadmin | KPIs (usuários, novos, premium, sessões, exercícios ativos, relatos em aberto) e crescimento de usuários em 30 dias |
| Engajamento | admin e superadmin | Ativos por dia, WAU, MAU, média de dias marcados na semana e sessões por dia (7, 30 ou 90 dias) |
| Conteúdo | admin e superadmin | Sessões de áudio (criar, editar, enviar áudio, ativar/desativar) e categorias da Home |
| Exercícios semanais | admin e superadmin | Criar, editar, ativar/desativar exercícios; participantes e média de dias |
| Usuários | admin e superadmin | Busca por nome/email, detalhe com histórico e ativar/remover premium |
| Relatos | admin e superadmin | Fila de bugs e sugestões enviados pelo app, com status de atendimento |
| Administradores | só superadmin | Conceder, alterar papel e revogar acesso ao painel |
| Histórico | só superadmin | Tudo que foi alterado pelo painel (audit log), somente leitura |

Desativar uma sessão ou exercício **não apaga nada**: ele só some do app, e o histórico de quem já usou continua.

## Rodando localmente

```bash
cd admin
npm install
cp .env.example .env     # preencha com a URL e a anon key do Supabase
npm run dev              # http://localhost:5173
```

Rode também o backend local (`cd backend && npm run dev`) com `VITE_API_URL=http://localhost:3000`, ou aponte `VITE_API_URL` para o backend de produção depois do deploy.

O banco é o mesmo do app. Ao testar criação de conteúdo, marque como **inativo** e use nomes como "TESTE - não usar".

## Dar acesso a alguém

Pelo próprio painel: **Administradores → Conceder acesso** (só superadmin). A pessoa precisa ter conta no app.

O primeiro superadmin é criado no Supabase SQL Editor (ver [backend/migrations/README.md](../backend/migrations/README.md)).

Quem não estiver em `admin_users` recebe "Email ou senha inválidos, ou conta sem acesso ao painel". A mensagem é igual à de senha errada de propósito.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 5173 |
| `npm run build` | Checa tipos e gera `dist/` |
| `npm run typecheck` | Só checagem de tipos |

## Produção

Static Site no Render, na mesma conta do backend. Passo a passo completo em [DEPLOY_ADMIN.md](../DEPLOY_ADMIN.md).
