import { useCallback, useEffect, useState } from 'react';
import { getOverview } from '../api/adminApi';
import type { OverviewMetrics } from '../api/adminApi';

const numberFmt = new Intl.NumberFormat('pt-BR');
const percentFmt = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export default function Overview() {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getOverview());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <h2 className="page-title">Visão geral</h2>

      {error && (
        <div className="card error-card">
          <p>{error}</p>
          <button className="btn btn-ghost" onClick={load}>
            Tentar de novo
          </button>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard
          label="Total de usuários"
          value={data ? numberFmt.format(data.total_users) : null}
          loading={loading}
        />
        <KpiCard
          label="Usuários premium"
          value={data ? numberFmt.format(data.premium_users) : null}
          loading={loading}
        />
        <KpiCard
          label="Taxa premium"
          value={data ? percentFmt.format(data.premium_rate) : null}
          loading={loading}
        />
      </div>
    </section>
  );
}

function KpiCard({ label, value, loading }: { label: string; value: string | null; loading: boolean }) {
  return (
    <div className="card kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{loading ? '…' : (value ?? '—')}</span>
    </div>
  );
}
