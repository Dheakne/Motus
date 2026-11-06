import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listReports, REPORT_STATUS_LABELS, updateReportStatus } from '../api/reportsApi';
import type { Report, ReportStatus } from '../api/reportsApi';
import Pagination from '../components/table/Pagination';
import { ErrorBox, Loading } from '../components/QueryState';
import { formatDateTime, formatNumber } from '../utils/format';

const FILTERS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'open', label: 'Em aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'all', label: 'Todos' },
];

const BADGE: Record<ReportStatus, string> = {
  open: 'badge badge-open',
  in_progress: 'badge badge-progress',
  resolved: 'badge badge-active',
};

function ReportCard({ report }: { report: Report }) {
  const queryClient = useQueryClient();
  const change = useMutation({
    mutationFn: (status: ReportStatus) => updateReportStatus(report.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['metrics', 'overview'] });
    },
  });

  return (
    <article className="report-card">
      <header className="report-header">
        <div className="cell-stack">
          <strong>{report.subject}</strong>
          <span className="muted">
            {report.type} · {formatDateTime(report.created_at)}
          </span>
        </div>
        <span className={BADGE[report.status]}>{REPORT_STATUS_LABELS[report.status]}</span>
      </header>

      <p className="report-description">{report.description}</p>

      <footer className="report-footer">
        <a className="muted" href={`mailto:${report.email}?subject=${encodeURIComponent(`Re: ${report.subject}`)}`}>
          {report.email}
        </a>
        <label className="report-status">
          <span className="muted">Status</span>
          <select
            className="select"
            value={report.status}
            disabled={change.isPending}
            onChange={(e) => change.mutate(e.target.value as ReportStatus)}
          >
            {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </footer>
      {change.error && <ErrorBox error={change.error} />}
    </article>
  );
}

export default function Reports() {
  const [filter, setFilter] = useState<ReportStatus | 'all'>('open');
  const [page, setPage] = useState(1);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['reports', filter, page],
    queryFn: () => listReports({ status: filter === 'all' ? undefined : filter, page }),
    placeholderData: keepPreviousData,
  });

  const countFor = (value: ReportStatus | 'all') => {
    if (!data) return '';
    const n = value === 'all' ? Object.values(data.counts).reduce((a, b) => a + b, 0) : data.counts[value];
    return ` (${formatNumber(n)})`;
  };

  return (
    <section>
      <div className="toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          Relatos de bugs e sugestões
        </h2>
        <div className="tabs" role="group" aria-label="Filtrar por status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`tab${f.value === filter ? ' is-active' : ''}`}
              aria-pressed={f.value === filter}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
            >
              {f.label}
              {countFor(f.value)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isPending && <Loading />}

      <div className="report-list">
        {data?.items.map((r) => <ReportCard key={r.id} report={r} />)}
        {data && data.items.length === 0 && <p className="muted table-empty">Nenhum relato aqui. 🎉</p>}
      </div>

      {data && data.total > 0 && (
        <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
      )}
    </section>
  );
}
