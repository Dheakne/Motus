import { useQuery } from '@tanstack/react-query';
import { getOverview, getPremiumMetrics } from '../api/metricsApi';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/charts/ChartCard';
import TrendChart from '../components/charts/TrendChart';
import { ErrorBox } from '../components/QueryState';
import { formatCents, formatNumber, formatPercent } from '../utils/format';

export default function Overview() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: getOverview,
  });
  const premium = useQuery({ queryKey: ['metrics', 'premium', 30], queryFn: () => getPremiumMetrics(30) });
  const p = premium.data;

  return (
    <section>
      <h2 className="page-title">Visão geral</h2>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}

      <div className="kpi-grid kpi-grid-3">
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
          hint={data && data.open_reports === null ? 'Rode a migration 008' : 'Abrir a fila de relatos'}
          loading={isPending}
          to="/reports"
        />
      </div>

      <h3 className="section-title">Premium · últimos 30 dias</h3>
      {premium.error && <ErrorBox error={premium.error} onRetry={() => premium.refetch()} />}
      <div className="kpi-grid kpi-grid-3">
        <KpiCard
          label="Assinantes pagantes"
          value={p ? formatNumber(p.active_by_source.stripe) : null}
          hint={p ? `${formatNumber(p.active_by_plan.monthly)} mensal · ${formatNumber(p.active_by_plan.annual)} anual` : undefined}
          loading={premium.isPending}
        />
        <KpiCard
          label="Liberados pelo painel"
          value={p ? formatNumber(p.active_by_source.admin) : null}
          hint={p ? `${formatNumber(p.new_admin_grants)} novas liberações no período` : undefined}
          loading={premium.isPending}
        />
        <KpiCard
          label="Receita recorrente mensal"
          value={p ? formatCents(p.mrr_cents) : null}
          hint={
            p
              ? `${formatNumber(p.new_subscriptions)} novas · ${formatNumber(p.cancellations)} encerradas · churn ${formatPercent(p.churn_rate)}`
              : undefined
          }
          loading={premium.isPending}
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
