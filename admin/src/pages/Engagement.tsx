import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getEngagement } from '../api/metricsApi';
import type { EngagementRange } from '../api/metricsApi';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/charts/ChartCard';
import TrendChart from '../components/charts/TrendChart';
import BarsChart from '../components/charts/BarsChart';
import { ErrorBox } from '../components/QueryState';
import { formatDayLong, formatDayShort, formatDecimal, formatNumber } from '../utils/format';

const RANGES: Array<{ value: EngagementRange; label: string }> = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

export default function Engagement() {
  const [range, setRange] = useState<EngagementRange>('30d');
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['metrics', 'engagement', range],
    queryFn: () => getEngagement(range),
    placeholderData: keepPreviousData,
  });
  const rangeLabel = RANGES.find((r) => r.value === range)?.label;

  return (
    <section>
      <div className="toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          Engajamento
        </h2>
        <div className="tabs" role="group" aria-label="Período">
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`tab${r.value === range ? ' is-active' : ''}`}
              aria-pressed={r.value === range}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="muted page-note">
        Usuário ativo = concluiu uma sessão de áudio ou marcou um dia do exercício semanal.
      </p>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}

      <div className="kpi-grid">
        <KpiCard label="Ativos nos últimos 7 dias (WAU)" value={data ? formatNumber(data.wau) : null} loading={isPending} />
        <KpiCard label="Ativos nos últimos 30 dias (MAU)" value={data ? formatNumber(data.mau) : null} loading={isPending} />
        <KpiCard
          label="Média de dias marcados na semana"
          value={data ? `${formatDecimal(data.avg_streak)} de 7` : null}
          hint={data ? `${plural(data.weekly_participants, 'pessoa fazendo', 'pessoas fazendo')} exercício nesta semana` : undefined}
          loading={isPending}
        />
      </div>

      {data && (
        <div className={`chart-grid${isFetching ? ' is-loading' : ''}`}>
          <ChartCard title="Usuários ativos por dia" subtitle={`Últimos ${rangeLabel}`}>
            <TrendChart
              data={data.dau}
              xKey="day"
              yKey="active_users"
              formatValue={(v) => plural(v, 'usuário ativo', 'usuários ativos')}
            />
          </ChartCard>
          <ChartCard title="Sessões de áudio concluídas por dia" subtitle={`Últimos ${rangeLabel}`}>
            <BarsChart
              data={data.sessions_completed_by_day}
              xKey="day"
              yKey="count"
              formatX={formatDayShort}
              formatTooltipLabel={formatDayLong}
              formatValue={(v) => plural(v, 'sessão concluída', 'sessões concluídas')}
            />
          </ChartCard>
        </div>
      )}
    </section>
  );
}
