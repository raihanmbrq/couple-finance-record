import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { AdminDataTable, type AdminColumn } from '@/components/desktop/admin/AdminDataTable';
import { ConfirmDialog } from '@/components/desktop/admin/ConfirmDialog';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatMoney } from '@/lib/format';
import { listAdminHouseholds, adminUnpairHousehold, listAdminWallets, listAdminHouseholdTransactions } from '@/lib/adminApi';
import { Unlink, RefreshCw, Eye, Copy, Check } from 'lucide-react';
import type { AdminHouseholdRow, AdminTransactionRow, AdminWalletRow } from '@/lib/types';

export const AdminHouseholdsPanel: React.FC = () => {
  const { showToast } = useToast();

  const [rows, setRows] = useState<AdminHouseholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [unpairTarget, setUnpairTarget] = useState<AdminHouseholdRow | null>(null);
  const [mutating, setMutating] = useState(false);

  const [drill, setDrill] = useState<AdminHouseholdRow | null>(null);
  const [drillWallets, setDrillWallets] = useState<AdminWalletRow[]>([]);
  const [drillTx, setDrillTx] = useState<AdminTransactionRow[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listAdminHouseholds());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load households.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDrill = async (household: AdminHouseholdRow) => {
    setDrill(household);
    setDrillLoading(true);
    setDrillWallets([]);
    setDrillTx([]);
    try {
      const [wallets, txs] = await Promise.all([listAdminWallets(), listAdminHouseholdTransactions(household.id)]);
      setDrillWallets(wallets.filter((w) => w.household_id === household.id));
      setDrillTx(txs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load household data.', 'error');
    } finally {
      setDrillLoading(false);
    }
  };

  const handleUnpair = async () => {
    if (!unpairTarget) return;
    setMutating(true);
    try {
      await adminUnpairHousehold(unpairTarget.id);
      showToast('Household unpair completed.', 'success');
      setUnpairTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to unpair household.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Invite code copied.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy invite code.', 'error');
    }
  };

  const columns = useMemo<AdminColumn<AdminHouseholdRow>[]>(
    () => [
      {
        key: 'name',
        header: 'Household',
        sortable: true,
        accessor: (r) => r.name,
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{r.name}</span>
            <span className="font-mono text-[10px] text-text-muted">{r.id.slice(0, 8)}…</span>
          </div>
        ),
      },
      {
        key: 'mode',
        header: 'Mode',
        sortable: true,
        accessor: (r) => r.mode,
        render: (r) => (
          <Badge color={r.mode === 'Circle' ? 'primary' : 'secondary'}>{r.mode === 'Circle' ? 'Circle' : 'Single'}</Badge>
        ),
      },
      {
        key: 'invite_code',
        header: 'Invite Code',
        sortable: true,
        accessor: (r) => r.invite_code,
        render: (r) => (
          <div className="flex items-center gap-2">
            <code className="font-semibold tracking-widest text-text-secondary">{r.invite_code}</code>
            <button
              type="button"
              onClick={() => void copyCode(r.invite_code)}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-accent"
              title="Copy invite code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ),
      },
      {
        key: 'members',
        header: 'Members',
        sortable: true,
        accessor: (r) => r.member_count,
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{r.member_count}</span>
            <span className="max-w-[220px] truncate text-[10px] text-text-muted">
              {(r.member_names ?? []).join(', ') || 'No members'}
            </span>
          </div>
        ),
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        accessor: (r) => new Date(r.created_at).getTime(),
        render: (r) => <span className="text-xs text-text-muted">{formatDate(r.created_at)}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copied],
  );

  const actionButton =
    'inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40';

  return (
    <div className="space-y-4" data-testid="admin-households-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Households &amp; Circles</h2>
          <p className="text-xs text-text-muted">{rows.length} household(s) · {rows.filter((r) => r.mode === 'Circle').length} circle(s)</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-xs text-expense">{error}</div>}

      <AdminDataTable<AdminHouseholdRow>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        testId="admin-households-table"
        searchText={(r) => `${r.name} ${r.invite_code} ${(r.member_names ?? []).join(' ')}`}
        searchPlaceholder="Search households by name, code or member…"
        emptyMessage="No households found."
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button type="button" title="View wallets & transactions" className={actionButton} onClick={() => void openDrill(row)}>
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="Unpair household" className={actionButton} disabled={row.member_count === 0} onClick={() => setUnpairTarget(row)}>
              <Unlink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />

      {/* Drill-in: wallets + transactions */}
      <DesktopDialog
        open={Boolean(drill)}
        onClose={() => setDrill(null)}
        title={drill ? `Household data — ${drill.name}` : 'Household data'}
        description={drill ? `${drillWallets.length} wallet(s) · ${drillTx.length} transaction(s)` : undefined}
        maxWidthClass="max-w-3xl"
        testId="admin-household-detail"
      >
        {drillLoading ? (
          <p className="py-6 text-center text-sm text-text-muted">Loading household data…</p>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-text-muted">Wallets</h3>
              {drillWallets.length === 0 ? (
                <p className="text-sm text-text-muted">No wallets.</p>
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border">
                  {drillWallets.map((w) => (
                    <li key={w.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">
                          {w.name}
                          {w.is_archived && <span className="ml-2 text-[10px] uppercase text-rose-500">archived</span>}
                        </span>
                        <span className="text-[10px] capitalize text-text-muted">{w.type}</span>
                      </div>
                      <span className="font-semibold text-text-primary">{formatMoney(w.balance, 'IDR')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-text-muted">Recent Transactions</h3>
              {drillTx.length === 0 ? (
                <p className="text-sm text-text-muted">No transactions.</p>
              ) : (
                <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border">
                  {drillTx.slice(0, 100).map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary capitalize">{tx.category}</span>
                        <span className="text-[10px] text-text-muted">
                          {formatDate(tx.transaction_date)} · {tx.spent_by || 'unknown'}
                          {tx.is_archived && <span className="ml-2 uppercase text-rose-500">archived</span>}
                        </span>
                      </div>
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-text-secondary'}`}>
                        {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                        {formatMoney(tx.amount, 'IDR')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DesktopDialog>

      {/* Unpair confirm */}
      <ConfirmDialog
        open={Boolean(unpairTarget)}
        title="Unpair Household?"
        description={
          unpairTarget && (
            <span>
              Detach all <strong className="text-text-primary">{unpairTarget.member_count} member(s)</strong> from{' '}
              <strong className="text-text-primary">{unpairTarget.name}</strong>? The household reverts to single mode
              and members will get a fresh personal household on next login. Data rows are preserved.
            </span>
          )
        }
        confirmLabel="Unpair"
        loading={mutating}
        onConfirm={() => void handleUnpair()}
        onClose={() => setUnpairTarget(null)}
        testId="admin-confirm-unpair"
      />
    </div>
  );
};

export default AdminHouseholdsPanel;
