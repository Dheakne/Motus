import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { getContentMetrics, listSessions, updateSession } from '../../api/contentApi';
import type { AudioSession, StatusFilter } from '../../api/contentApi';
import DataTable from '../../components/table/DataTable';
import ChartCard from '../../components/charts/ChartCard';
import BarsChart from '../../components/charts/BarsChart';
import { ErrorBox } from '../../components/QueryState';
import SessionForm from './SessionForm';
import { SESSION_CATEGORIES, categoryLabel, formatDate, formatNumber } from '../../utils/format';

const STATUS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Inativas' },
  { value: 'all', label: 'Todas' },
];

const col = createColumnHelper<AudioSession>();
const plural = (n: number) => `${formatNumber(n)} ${n === 1 ? 'conclusão' : 'conclusões'}`;

export default function SessionsTab() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('active');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<AudioSession | 'new' | null>(null);

  const sessions = useQuery({
    queryKey: ['content', 'sessions', status, category],
    queryFn: () => listSessions({ status, category }),
  });
  const metrics = useQuery({ queryKey: ['metrics', 'content'], queryFn: getContentMetrics });

  const toggleActive = useMutation({
    mutationFn: (s: AudioSession) => updateSession(s.id, { is_active: !s.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content', 'sessions'] }),
  });

  const columns = useMemo(
    () => [
      col.accessor('title', { header: 'Título', cell: (i) => <strong>{i.getValue()}</strong> }),
      col.accessor('category', { header: 'Categoria', cell: (i) => categoryLabel(i.getValue()) }),
      col.accessor('duration', { header: 'Duração', cell: (i) => `${i.getValue()} min` }),
      col.accessor('is_premium', {
        header: 'Plano',
        cell: (i) => (i.getValue() ? <span className="badge badge-premium">Premium</span> : <span className="badge">Gratuita</span>),
      }),
      col.accessor('is_active', {
        header: 'Status',
        cell: (i) => (i.getValue() ? <span className="badge badge-active">Ativa</span> : <span className="badge">Inativa</span>),
      }),
      col.accessor('completions', { header: 'Conclusões', cell: (i) => formatNumber(i.getValue()) }),
      col.accessor('created_at', { header: 'Criada em', cell: (i) => formatDate(i.getValue()) }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="cell-actions">
              <button className="btn-link" onClick={() => setEditing(s)}>
                Editar
              </button>
              <button
                className="btn-link"
                disabled={toggleActive.isPending}
                onClick={() => {
                  const msg = s.is_active
                    ? `Desativar "${s.title}"? Ela some do app, mas o histórico de quem ouviu é mantido.`
                    : `Reativar "${s.title}"? Ela volta a aparecer no app.`;
                  if (window.confirm(msg)) toggleActive.mutate(s);
                }}
              >
                {s.is_active ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          );
        },
      }),
    ],
    [toggleActive]
  );

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <div className="tabs" role="group" aria-label="Status">
            {STATUS.map((s) => (
              <button
                key={s.value}
                className={`tab${s.value === status ? ' is-active' : ''}`}
                aria-pressed={s.value === status}
                onClick={() => setStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {Object.entries(SESSION_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          Nova sessão
        </button>
      </div>

      {sessions.error && <ErrorBox error={sessions.error} onRetry={() => sessions.refetch()} />}
      {toggleActive.error && <ErrorBox error={toggleActive.error} />}

      <DataTable
        columns={columns}
        data={sessions.data ?? []}
        getRowId={(s) => s.id}
        loading={sessions.isPending}
        emptyText="Nenhuma sessão com esses filtros."
      />

      {metrics.data && (
        <div className="chart-grid">
          <ChartCard title="Sessões mais concluídas" subtitle="Top 10, desde o início">
            {metrics.data.top_sessions.length ? (
              <BarsChart
                data={metrics.data.top_sessions}
                xKey="title"
                yKey="completions"
                orientation="horizontal"
                formatValue={(v) => plural(v)}
              />
            ) : (
              <p className="muted chart-empty">Nenhuma sessão concluída ainda.</p>
            )}
          </ChartCard>
          <ChartCard title="Conclusões por categoria" subtitle="Desde o início">
            <BarsChart
              data={metrics.data.completions_by_category}
              xKey="category"
              yKey="completions"
              orientation="horizontal"
              formatX={(v) => categoryLabel(v)}
              formatValue={(v) => plural(v)}
            />
          </ChartCard>
        </div>
      )}

      {editing && <SessionForm session={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
