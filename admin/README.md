# Motus Admin

Painel administrativo web do Motus (Vite + React + TypeScript). Plano completo em [PLANO_ADMIN.md](../PLANO_ADMIN.md).

O painel **nunca** acessa o banco direto: usa o Supabase só para o login (anon key) e busca tudo em `/api/admin/*` no backend.

## Rodando localmente

```bash
cd admin
npm install
cp .env.example .env     # preencha com a URL e a anon key do Supabase
npm run dev              # http://localhost:5173
```

Enquanto as rotas `/api/admin` não estiverem em produção no Render, rode também o backend local (`cd backend && npm run dev`) e mantenha `VITE_API_URL=http://localhost:3000`.

## Dar acesso a alguém

O login usa a mesma conta do app. Para liberar o painel, rode no Supabase SQL Editor (depois da migration `005_add_admin_users.sql`):

```sql
INSERT INTO admin_users (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'pessoa@exemplo.com';
```

Quem não estiver em `admin_users` recebe "Email ou senha inválidos, ou conta sem acesso ao painel". A mensagem é igual à de senha errada de propósito.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 5173 |
| `npm run build` | Checa tipos e gera `dist/` |
| `npm run typecheck` | Só checagem de tipos |
