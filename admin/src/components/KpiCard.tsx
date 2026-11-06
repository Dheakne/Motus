interface KpiCardProps {
  label: string;
  value: string | null;
  loading?: boolean;
  /** Linha de apoio abaixo do número (ex.: "8 nas últimas 24h") */
  hint?: string;
}

export default function KpiCard({ label, value, loading = false, hint }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{loading ? '…' : (value ?? '—')}</span>
      {hint && !loading && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}
