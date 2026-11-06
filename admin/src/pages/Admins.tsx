import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { grantAdmin, listAdmins, revokeAdmin } from '../api/adminsApi';
import type { AdminUser } from '../api/adminsApi';
import type { AdminRole } from '../api/adminApi';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox, Loading } from '../components/QueryState';
import { formatDate, formatDateTime } from '../utils/format';

const ROLE_LABELS: Record<AdminRole, string> = { admin: 'Admin', superadmin: 'Superadmin' };

export default function Admins() {
  const { state } = useAuth();
  const myId = state.status === 'signedIn' ? state.admin.user_id : null;
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');

  const admins = useQuery({ queryKey: ['admins'], queryFn: listAdmins });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admins'] });

  const grant = useMutation({
    mutationFn: () => grantAdmin(email.trim(), role),
    onSuccess: () => {
      setEmail('');
      setRole('admin');
      refresh();
    },
  });

  const changeRole = useMutation({
    mutationFn: (a: AdminUser) => grantAdmin(a.email ?? '', a.role === 'admin' ? 'superadmin' : 'admin'),
    onSuccess: refresh,
  });

  const revoke = useMutation({ mutationFn: (a: AdminUser) => revokeAdmin(a.user_id), onSuccess: refresh });

  function handleGrant(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) grant.mutate();
  }

  const actionError = changeRole.error ?? revoke.error;

  return (
    <section>
      <h2 className="page-title">Administradores</h2>

      <form className="grant-form" onSubmit={handleGrant}>
        <input
          className="input"
          type="email"
          placeholder="Email da conta no app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
        />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value as AdminRole)} aria-label="Papel">
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <button className="btn btn-primary btn-sm" type="submit" disabled={grant.isPending}>
          {grant.isPending ? 'Concedendo…' : 'Conceder acesso'}
        </button>
      </form>
      <p className="muted page-note">
        A pessoa precisa ter conta no app. <strong>Admin</strong> usa todas as telas de conteúdo, usuários e relatos;{' '}
        <strong>Superadmin</strong> também gerencia administradores e vê o histórico de ações.
      </p>

      {grant.error && <ErrorBox error={grant.error} />}
      {actionError && <ErrorBox error={actionError} />}
      {admins.error && <ErrorBox error={admins.error} onRetry={() => admins.refetch()} />}
      {admins.isPending && <Loading />}

      {admins.data && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Papel</th>
                <th>Acesso desde</th>
                <th>Último login</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {admins.data.map((a) => {
                const isMe = a.user_id === myId;
                return (
                  <tr key={a.user_id}>
                    <td>
                      <div className="cell-stack">
                        <strong>
                          {a.email ?? '—'} {isMe && <span className="muted">(você)</span>}
                        </strong>
                        {a.created_by_email && <span className="muted">Concedido por {a.created_by_email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={a.role === 'superadmin' ? 'badge badge-premium' : 'badge'}>{ROLE_LABELS[a.role]}</span>
                    </td>
                    <td>{formatDate(a.created_at)}</td>
                    <td>{formatDateTime(a.last_sign_in_at)}</td>
                    <td>
                      {!isMe && (
                        <div className="cell-actions">
                          <button
                            className="btn-link"
                            disabled={changeRole.isPending}
                            onClick={() => {
                              const next = a.role === 'admin' ? 'Superadmin' : 'Admin';
                              if (window.confirm(`Mudar ${a.email} para ${next}?`)) changeRole.mutate(a);
                            }}
                          >
                            Tornar {a.role === 'admin' ? 'superadmin' : 'admin'}
                          </button>
                          <button
                            className="btn-link danger-link"
                            disabled={revoke.isPending}
                            onClick={() => {
                              if (window.confirm(`Revogar o acesso de ${a.email} ao painel?`)) revoke.mutate(a);
                            }}
                          >
                            Revogar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
