import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { listUsers } from '../api/usersApi';
import type { UserListItem } from '../api/usersApi';
import DataTable from '../components/table/DataTable';
import Pagination from '../components/table/Pagination';
import { ErrorBox } from '../components/QueryState';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate, formatNumber } from '../utils/format';

const PAGE_SIZE = 20;
const col = createColumnHelper<UserListItem>();

const columns = [
  col.accessor('display_name', {
    header: 'Nome',
    cell: (info) => (
      <div className="cell-stack">
        <strong>{info.getValue() || '—'}</strong>
        <span className="muted">{info.row.original.full_name}</span>
      </div>
    ),
  }),
  col.accessor('email', { header: 'Email', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('level', { header: 'Nível', cell: (info) => formatNumber(info.getValue()) }),
  col.accessor('total_points', { header: 'Pontos', cell: (info) => formatNumber(info.getValue()) }),
  col.accessor('is_premium', {
    header: 'Plano',
    cell: (info) =>
      info.getValue() ? <span className="badge badge-premium">Premium</span> : <span className="badge">Gratuito</span>,
  }),
  col.accessor('created_at', { header: 'Cadastro', cell: (info) => formatDate(info.getValue()) }),
];

export default function Users() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['users', debouncedSearch, page],
    queryFn: () => listUsers({ search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  return (
    <section>
      <h2 className="page-title">Usuários</h2>

      <div className="toolbar">
        <input
          className="input search-input"
          type="search"
          placeholder="Buscar por nome ou email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Buscar usuários"
        />
      </div>

      {error && <ErrorBox error={error} onRetry={() => refetch()} />}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowId={(u) => u.user_id}
        onRowClick={(u) => navigate(`/users/${u.user_id}`)}
        loading={isPending || isFetching}
        emptyText={debouncedSearch ? 'Nenhum usuário encontrado para essa busca.' : 'Nenhum usuário cadastrado.'}
      />

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
    </section>
  );
}
