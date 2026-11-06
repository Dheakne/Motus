import { Link } from 'react-router-dom';

interface KpiCardProps {
  label: string;
  value: string | null;
  loading?: boolean;
  /** Linha de apoio abaixo do número (ex.: "8 nas últimas 24h") */
  hint?: string;
  /** Torna o card um link (ex.: abrir a fila de relatos) */
  to?: string;
}

export default function KpiCard({ label, value, loading = false, hint, to }: KpiCardProps) {
  const body = (
    <>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{loading ? '…' : (value ?? '—')}</span>
      {hint && !loading && <span className="kpi-hint">{hint}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="kpi-card kpi-link">
      {body}
    </Link>
  ) : (
    <div className="kpi-card">{body}</div>
  );
}
