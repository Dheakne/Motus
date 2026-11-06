import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { deleteCategory, listCategories } from '../../api/contentApi';
import type { Category } from '../../api/contentApi';
import DataTable from '../../components/table/DataTable';
import { ErrorBox } from '../../components/QueryState';
import CategoryForm from './CategoryForm';
import { formatNumber } from '../../utils/format';

const col = createColumnHelper<Category>();

export default function CategoriesTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const categories = useQuery({ queryKey: ['content', 'categories'], queryFn: listCategories });

  const remove = useMutation({
    mutationFn: (c: Category) => deleteCategory(c.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content', 'categories'] }),
  });

  const columns = useMemo(
    () => [
      col.accessor('order', { header: 'Ordem', cell: (i) => formatNumber(i.getValue()) }),
      col.accessor('title', {
        header: 'Categoria',
        cell: ({ row }) => (
          <span className="category-cell">
            <span className="category-emoji" aria-hidden="true">
              {row.original.icon_emoji}
            </span>
            <strong>{row.original.title}</strong>
          </span>
        ),
      }),
      col.accessor('color', {
        header: 'Cor',
        cell: (i) =>
          i.getValue() ? (
            <span className="color-cell">
              <span className="color-dot" style={{ background: i.getValue() ?? undefined }} />
              {i.getValue()}
            </span>
          ) : (
            '—'
          ),
      }),
      col.accessor('sessions_count', { header: 'Sessões vinculadas', cell: (i) => formatNumber(i.getValue()) }),
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
                className="btn-link danger-link"
                disabled={remove.isPending}
                title={c.sessions_count > 0 ? 'Categorias com sessões vinculadas não podem ser excluídas' : undefined}
                onClick={() => {
                  if (window.confirm(`Excluir a categoria "${c.title}"? Ela some da Home do app.`)) remove.mutate(c);
                }}
              >
                Excluir
              </button>
            </div>
          );
        },
      }),
    ],
    [remove]
  );

  const nextOrder = Math.max(0, ...(categories.data ?? []).map((c) => c.order + 1));

  return (
    <>
      <div className="toolbar">
        <p className="muted page-note" style={{ margin: 0 }}>
          Cards da Home do app, na ordem em que aparecem.
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          Nova categoria
        </button>
      </div>

      {categories.error && <ErrorBox error={categories.error} onRetry={() => categories.refetch()} />}
      {remove.error && <ErrorBox error={remove.error} />}

      <DataTable
        columns={columns}
        data={categories.data ?? []}
        getRowId={(c) => c.id}
        loading={categories.isPending}
        emptyText="Nenhuma categoria cadastrada."
      />

      {editing && (
        <CategoryForm
          category={editing === 'new' ? undefined : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
