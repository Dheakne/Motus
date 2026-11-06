import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { listChallenges, updateChallenge } from '../api/contentApi';
import type { Challenge } from '../api/contentApi';
import DataTable from '../components/table/DataTable';
import ChartCard from '../components/charts/ChartCard';
import BarsChart from '../components/charts/BarsChart';
import { ErrorBox } from '../components/QueryState';
import ChallengeForm from './ChallengeForm';
import { formatDecimal, formatNumber } from '../utils/format';

const col = createColumnHelper<Challenge>();

export default function Challenges() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Challenge | 'new' | null>(null);

  const challenges = useQuery({ queryKey: ['content', 'challenges'], queryFn: listChallenges });

  const toggleActive = useMutation({
    mutationFn: (c: Challenge) => updateChallenge(c.id, { is_active: !c.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const columns = useMemo(
    () => [
      col.accessor('title', {
        header: 'Exercício',
        cell: ({ row }) => (
          <div className="cell-stack">
            <strong>{row.original.title}</strong>
            <span className="muted">{row.original.category}</span>
          </div>
        ),
      }),
      col.accessor('duration_minutes', { header: 'Tempo diário', cell: (i) => `${i.getValue()} min` }),
      col.accessor('is_free', {
        header: 'Plano',
        cell: (i) => (i.getValue() ? <span className="badge">Gratuito</span> : <span className="badge badge-premium">Premium</span>),
      }),
      col.accessor('is_active', {
        header: 'Status',
        cell: (i) => (i.getValue() ? <span className="badge badge-active">Ativo</span> : <span className="badge">Inativo</span>),
      }),
      col.accessor('participants', { header: 'Participantes', cell: (i) => formatNumber(i.getValue()) }),
      col.accessor('avg_days_completed', {
        header: 'Média de dias feitos',
        cell: (i) => `${formatDecimal(i.getValue())} de 7`,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="cell-actions">
              <button className="btn-link" onClick={() => setEditing(c)}>
                Editar
              </button>
              <button
                className="btn-link"
                disabled={toggleActive.isPending}
                onClick={() => {
                  const msg = c.is_active
                    ? `Desativar "${c.title}"? Ele some da lista do app; o progresso de quem já fez é mantido.`
                    : `Ativar "${c.title}"? Ele passa a aparecer na lista do app.`;
                  if (window.confirm(msg)) toggleActive.mutate(c);
                }}
              >
                {c.is_active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          );
        },
      }),
    ],
    [toggleActive]
  );

  const withParticipants = (challenges.data ?? [])
    .filter((c) => c.participants > 0)
    .sort((a, b) => b.participants - a.participants);

  return (
    <section>
      <div className="toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          Exercícios semanais
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          Novo exercício
        </button>
      </div>

      {challenges.error && <ErrorBox error={challenges.error} onRetry={() => challenges.refetch()} />}
      {toggleActive.error && <ErrorBox error={toggleActive.error} />}

      <DataTable
        columns={columns}
        data={challenges.data ?? []}
        getRowId={(c) => String(c.id)}
        loading={challenges.isPending}
        emptyText="Nenhum exercício cadastrado."
      />

      {challenges.data && (
        <div className="chart-grid">
          <ChartCard title="Participantes por exercício" subtitle="Pessoas diferentes que escolheram cada exercício, desde o início">
            {withParticipants.length ? (
              <BarsChart
                data={withParticipants}
                xKey="title"
                yKey="participants"
                orientation="horizontal"
                formatValue={(v, p) =>
                  `${formatNumber(v)} ${v === 1 ? 'participante' : 'participantes'} · média de ${formatDecimal(p.avg_days_completed)} dias`
                }
              />
            ) : (
              <p className="muted chart-empty">Ninguém escolheu um exercício ainda.</p>
            )}
          </ChartCard>
        </div>
      )}

      {editing && <ChallengeForm challenge={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
