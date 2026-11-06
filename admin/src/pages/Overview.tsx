import { useQuery } from '@tanstack/react-query';
import { getOverview } from '../api/metricsApi';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/charts/ChartCard';
import TrendChart from '../components/charts/TrendChart';
import { ErrorBox } from '../components/QueryState';
import { formatNumber, formatPercent } from '../utils/format';

export default function Overview() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: getOverview,
  });

  return (
    <section>
      <h2 className="page-title">Visão geral</h2>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}

      <div className="kpi-grid">
        <KpiCard label="Total de usuários" value={data ? formatNumber(data.total_users) : null} loading={isPending} />
        <KpiCard
          label="Novos nos últimos 7 dias"
          value={data ? formatNumber(data.new_users_7d) : null}
          hint={data ? `${formatNumber(data.new_users_24h)} em 24h · ${formatNumber(data.new_users_30d)} em 30 dias` : undefined}
          loading={isPending}
        />
        <KpiCard
          label="Usuários premium"
          value={data ? formatNumber(data.premium_users) : null}
          hint={data ? `${formatPercent(data.premium_rate)} do total` : undefined}
          loading={isPending}
        />
        <KpiCard
          label="Sessões concluídas"
          value={data ? formatNumber(data.sessions_completed_total) : null}
          hint="Desde o início"
          loading={isPending}
        />
        <KpiCard
          label="Exercícios semanais ativos"
          value={data ? formatNumber(data.active_challenges) : null}
          loading={isPending}
        />
        <KpiCard
          label="Relatos em aberto"
          value={data ? formatNumber(data.open_reports) : null}
          hint={data && data.open_reports === null ? 'Rode a migration 007' : undefined}
          loading={isPending}
        />
      </div>

      {data && (
        <div className="chart-grid">
          <ChartCard title="Usuários cadastrados" subtitle="Total acumulado nos últimos 30 dias">
            <TrendChart
              data={data.user_growth}
              xKey="day"
              yKey="total_users"
              formatValue={(v, p) =>
                `${formatNumber(v)} usuários (+${formatNumber(p.new_users)} no dia)`
              }
            />
          </ChartCard>
        </div>
      )}
    </section>
  );
}
