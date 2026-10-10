import React, { useEffect, useMemo, useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Value used for sorting (and searching when no `searchText` is given). */
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface AdminDataTableProps<T> {
  rows: T[];
  columns: AdminColumn<T>[];
  /** Unique row key; receives the row and its absolute (all-pages) index. */
  getRowId: (row: T, index: number) => string;
  /** Text searched by the search box; omit to hide the search input. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra filter controls rendered alongside the search box. */
  filters?: React.ReactNode;
  /** Trailing "Actions" column renderer; omit for a read-only table. */
  renderActions?: (row: T) => React.ReactNode;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  testId?: string;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

const alignClass = (align: AdminColumn<unknown>['align']) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

const toComparable = (value: string | number | null | undefined): string | number => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase();
};

/**
 * Generic, dependency-free data table for the Admin Console: search, per-column
 * sorting, an optional filter slot, and pagination. Styled to match the rest of
 * the desktop dashboard (Tailwind design tokens).
 */
export function AdminDataTable<T>({
  rows,
  columns,
  getRowId,
  searchText,
  searchPlaceholder = 'Search…',
  filters,
  renderActions,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  loading = false,
  emptyMessage = 'No records found.',
  testId,
}: AdminDataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return filtered;
    const accessor =
      column.accessor ??
      ((row: T) => (row as Record<string, unknown>)[column.key] as string | number | null | undefined);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = toComparable(accessor(a));
      const bv = toComparable(accessor(b));
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Keep the page in range as rows / filters shrink the result set.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
  };

  const showActions = Boolean(renderActions);
  const colSpan = columns.length + (showActions ? 1 : 0);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden" data-testid={testId}>
      {/* Toolbar: search + filters */}
      {(searchText || filters) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {searchText && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="input-field pl-9 py-2 text-xs"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-muted">
              {columns.map((column) => {
                const isSorted = sort?.key === column.key;
                return (
                  <th key={column.key} className={`px-4 py-3 font-semibold ${alignClass(column.align)}`}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-text-primary ${
                          isSorted ? 'text-accent' : ''
                        }`}
                      >
                        {column.header}
                        {isSorted ? (
                          sort?.dir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {showActions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-text-muted">
                  Loading…
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={getRowId(row, start + index)} className="border-b border-border/60 last:border-0 hover:bg-surface-hover/40">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 align-middle ${alignClass(column.align)} ${column.className ?? ''}`}>
                      {column.render
                        ? column.render(row)
                        : String(
                            (column.accessor
                              ? column.accessor(row)
                              : (row as Record<string, unknown>)[column.key]) ?? '',
                          )}
                    </td>
                  ))}
                  {showActions && <td className="px-4 py-3 text-right">{renderActions?.(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-text-muted">
        <span>
          {total === 0 ? '0' : `${start + 1}–${Math.min(start + pageSize, total)}`} of {total}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-secondary"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="font-semibold text-text-secondary">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
