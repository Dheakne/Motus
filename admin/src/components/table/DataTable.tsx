import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  /** Chave estável de cada linha (id do registro) */
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  loading?: boolean;
}

/**
 * Tabela padrão do painel (TanStack Table). Paginação e busca são feitas no backend,
 * então aqui só renderizamos a página atual.
 */
export default function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  emptyText = 'Nenhum registro encontrado.',
  loading = false,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-wrap">
      <table className={`data-table${loading ? ' is-loading' : ''}`}>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter') onRowClick(row.original);
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
          {!loading && data.length === 0 && (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
