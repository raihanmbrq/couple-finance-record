import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { AdminDataTable, type AdminColumn } from '@/components/desktop/admin/AdminDataTable';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { ADMIN_RAW_TABLES, listAdminRawTable, type AdminRawTable } from '@/lib/adminApi';
import {
  RefreshCw,
  Database,
  AlertTriangle,
  Users,
  Users2,
  Home,
  Wallet,
  TableProperties,
  Target,
  PiggyBank,
  Tags,
  Ticket,
} from 'lucide-react';

/** Per-table icon shown in the custom table dropdown. */
const TABLE_ICONS: Record<AdminRawTable, React.ElementType> = {
  profiles: Users,
  households: Home,
  household_members: Users2,
  wallets: Wallet,
  transactions: TableProperties,
  budgets: Target,
  goals: PiggyBank,
  wallet_types: Wallet,
  categories: Tags,
  invitation_tokens: Ticket,
};

/** Renders any JSON value as a readable table cell. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

type Row = Record<string, unknown>;

/**
 * Raw database browser: pick any table in the schema and see every row exactly
 * as stored. Visibility is governed by the admin RLS policies, so this is the
 * quickest way to confirm the admin migration is applied.
 */
export const AdminRawTablesPanel: React.FC = () => {
  const { showToast } = useToast();

  const [table, setTable] = useState<AdminRawTable>('profiles');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (target: AdminRawTable) => {
    setLoading(true);
    setError('');
    try {
      setRows(await listAdminRawTable(target));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(table);
  }, [table, load]);

  // Columns are derived from the actual row shape so every field is visible.
  const columns = useMemo<AdminColumn<Row>[]>(() => {
    const keys = new Set<string>();
    rows.slice(0, 200).forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
    return Array.from(keys).map((key) => ({
      key,
      header: key,
      sortable: true,
      accessor: (row) => formatCell(row[key]),
      render: (row) => (
        <span className="block max-w-[240px] truncate text-xs text-text-secondary" title={formatCell(row[key])}>
          {formatCell(row[key])}
        </span>
      ),
    }));
  }, [rows]);

  // Options for the custom (non-native) table dropdown.
  const tableOptions = useMemo(
    () => ADMIN_RAW_TABLES.map((t) => ({ value: t, label: t, icon: TABLE_ICONS[t] })),
    [],
  );

  return (
    <div className="space-y-4" data-testid="admin-raw-tables-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Raw Database Browser</h2>
            <p className="text-xs text-text-muted">Every table, every row — exactly as stored.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CustomDesktopDropdown
            options={tableOptions}
            value={table}
            onChange={(value) => setTable(value as AdminRawTable)}
            placeholder="Select table…"
            testId="admin-raw-table-select"
            className="min-w-[200px]"
          />
          <button
            type="button"
            onClick={() => {
              void load(table);
              showToast('Table reloaded.', 'success');
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* RLS diagnostic: admin should see everything. A single-row table usually
          means the admin migration was not applied to this project. */}
      {!loading && rows.length <= 1 && (table === 'profiles' || table === 'households') && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Only {rows.length} row(s) visible. This almost always means the admin RLS migration
            (<code className="font-semibold">20261011000000_admin_console.sql</code>) is not applied on this Supabase
            project. Run it in the SQL editor, then hit Refresh.
          </span>
        </div>
      )}

      {error && <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-xs text-expense">{error}</div>}

      <div className="text-xs text-text-muted">
        Table <span className="font-semibold text-text-primary">{table}</span> · {rows.length} row(s)
      </div>

      <AdminDataTable<Row>
        rows={rows}
        columns={columns}
        getRowId={(row, index) => String(row.id ?? row.key ?? index)}
        loading={loading}
        testId="admin-raw-table"
        searchText={(row) => Object.values(row).map(formatCell).join(' ')}
        searchPlaceholder="Search all fields…"
        emptyMessage="No rows returned (check the admin RLS migration)."
      />
    </div>
  );
};

export default AdminRawTablesPanel;
