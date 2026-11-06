import { Fragment, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listAuditLog } from '../api/adminsApi';
import Pagination from '../components/table/Pagination';
import { ErrorBox, Loading } from '../components/QueryState';
import { formatDateTime } from '../utils/format';

// Prefixos de action gravados pelo backend (utils/auditLog.js)
const ACTION_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'user', label: 'Usuários' },
  { value: 'session', label: 'Sessões' },
  { value: 'category', label: 'Categorias' },
  { value: 'challenge', label: 'Exercícios' },
  { value: 'report', label: 'Relatos' },
  { value: 'admin', label: 'Administradores' },
];

const ACTION_LABELS: Record<string, string> = {
  'user.update': 'Alterou usuário',
  'session.create': 'Criou sessão',
  'session.update': 'Editou sessão',
  'session.deactivate': 'Desativou sessão',
  'category.create': 'Criou categoria',
  'category.update': 'Editou categoria',
  'category.delete': 'Excluiu categoria',
  'challenge.create': 'Criou exercício',
  'challenge.update': 'Editou exercício',
  'challenge.deactivate': 'Desativou exercício',
  'report.update': 'Mudou status de relato',
  'admin.grant': 'Concedeu acesso',
  'admin.revoke': 'Revogou acesso',
};

export default function AuditLog() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['audit-log', action, page],
    queryFn: () => listAuditLog({ page, action }),
    placeholderData: keepPreviousData,
  });

  return (
    <section>
      <div className="toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          Histórico de ações
        </h2>
        <select
          className="select"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          aria-label="Filtrar por tipo de ação"
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <p className="muted page-note">Tudo que foi alterado pelo painel, mais recente primeiro. Somente leitura.</p>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isPending && <Loading />}

      {data && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Quem</th>
                <th>Ação</th>
                <th>Registro</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{row.admin_email ?? row.admin_id}</td>
                    <td>{ACTION_LABELS[row.action] ?? row.action}</td>
                    <td className="muted mono">
                      {row.target_table}
                      {row.target_id && ` · ${row.target_id.slice(0, 8)}`}
                    </td>
                    <td>
                      {row.payload && (
                        <button className="btn-link" onClick={() => setOpen(open === row.id ? null : row.id)}>
                          {open === row.id ? 'Ocultar' : 'Detalhes'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {open === row.id && (
                    <tr>
                      <td colSpan={5}>
                        <pre className="payload">{JSON.stringify(row.payload, null, 2)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td className="table-empty" colSpan={5}>
                    Nenhuma ação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
      )}
    </section>
  );
}
