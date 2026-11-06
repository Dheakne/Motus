import { formatNumber } from '../../utils/format';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span className="muted">
        {formatNumber(first)}–{formatNumber(last)} de {formatNumber(total)}
      </span>
      <div className="pagination-buttons">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </button>
        <button className="btn btn-ghost" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}
