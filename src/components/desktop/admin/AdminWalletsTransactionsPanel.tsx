import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { AdminDataTable, type AdminColumn } from '@/components/desktop/admin/AdminDataTable';
import { ConfirmDialog } from '@/components/desktop/admin/ConfirmDialog';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { CustomDesktopDropdown, type DropdownOption } from '@/components/desktop/ui/CustomDesktopDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatMoney } from '@/lib/format';
import {
  listAdminProfiles,
  listAdminHouseholds,
  listAdminTransactions,
  listAdminWallets,
  adminUpdateTransaction,
  adminSetTransactionArchived,
  adminUpdateWallet,
  adminSetWalletArchived,
} from '@/lib/adminApi';
import {
  CATEGORIES,
  type AdminHouseholdRow,
  type AdminProfileRow,
  type AdminTransactionFilters,
  type AdminTransactionRow,
  type AdminWalletRow,
} from '@/lib/types';
import {
  Archive,
  ArchiveRestore,
  Pencil,
  RefreshCw,
  Calendar,
  X,
  FilterX,
  Home,
  Users,
  Tags,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ListFilter,
} from 'lucide-react';

type View = 'transactions' | 'wallets';

interface DateFilterButtonProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

/**
 * Custom date filter: a styled trigger that opens the shared floating calendar
 * (`CustomDatePicker` portals it, so it never gets clipped by the table card).
 */
const DateFilterButton: React.FC<DateFilterButtonProps> = ({ label, value, onChange, testId }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={testId}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-xl border bg-surface px-3 py-2 text-xs font-medium transition-colors hover:bg-surface-hover ${
          value ? 'border-accent/40 text-text-primary' : 'border-border text-text-muted'
        } ${value ? 'pr-7' : ''}`}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span className={value ? 'font-semibold' : ''}>
          {value ? formatDate(new Date(`${value}T00:00:00`)) : label}
        </span>
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`Clear ${label}`}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted transition-colors hover:bg-expense/10 hover:text-expense"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <CustomDatePicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={(next) => {
          onChange(next);
          setOpen(false);
        }}
        variant="floating"
        anchorRef={triggerRef}
      />
    </div>
  );
};

const EMPTY_FILTERS: AdminTransactionFilters = {
  userId: 'all',
  householdId: 'all',
  category: 'all',
  type: 'all',
  from: '',
  to: '',
  includeArchived: false,
};

export const AdminWalletsTransactionsPanel: React.FC = () => {
  const { showToast } = useToast();
  const [view, setView] = useState<View>('transactions');

  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [households, setHouseholds] = useState<AdminHouseholdRow[]>([]);

  const [txRows, setTxRows] = useState<AdminTransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [filters, setFilters] = useState<AdminTransactionFilters>(EMPTY_FILTERS);

  const [walletRows, setWalletRows] = useState<AdminWalletRow[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);

  const [error, setError] = useState('');
  const [mutating, setMutating] = useState(false);

  const [editingTx, setEditingTx] = useState<AdminTransactionRow | null>(null);
  const [txForm, setTxForm] = useState({ category: '', amount: 0, notes: '', spent_by: '', transaction_date: '' });
  const [editingWallet, setEditingWallet] = useState<AdminWalletRow | null>(null);
  const [walletForm, setWalletForm] = useState({ name: '', type: '', balance: 0 });
  const [saving, setSaving] = useState(false);

  const [archiveTx, setArchiveTx] = useState<AdminTransactionRow | null>(null);
  const [archiveWallet, setArchiveWallet] = useState<AdminWalletRow | null>(null);

  const loadTx = useCallback(async (active: AdminTransactionFilters) => {
    setTxLoading(true);
    setError('');
    try {
      setTxRows(await listAdminTransactions(active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.');
    } finally {
      setTxLoading(false);
    }
  }, []);

  const loadWallets = useCallback(async () => {
    setWalletLoading(true);
    try {
      setWalletRows(await listAdminWallets());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets.');
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([listAdminProfiles(), listAdminHouseholds()]);
      setProfiles(p);
      setHouseholds(h);
    } catch {
      // Filter options are non-critical; ignore failures silently.
    }
  }, []);

  useEffect(() => {
    void loadOptions();
    void loadTx(EMPTY_FILTERS);
    void loadWallets();
  }, [loadOptions, loadTx, loadWallets]);

  const applyFilters = (next: Partial<AdminTransactionFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    void loadTx(merged);
  };

  const openEditTx = (row: AdminTransactionRow) => {
    setEditingTx(row);
    setTxForm({
      category: row.category,
      amount: row.amount,
      notes: row.notes ?? '',
      spent_by: row.spent_by ?? '',
      transaction_date: row.transaction_date.slice(0, 10),
    });
  };

  const handleSaveTx = async () => {
    if (!editingTx) return;
    setSaving(true);
    try {
      await adminUpdateTransaction(editingTx.id, {
        category: txForm.category,
        amount: Number(txForm.amount) || 0,
        notes: txForm.notes,
        spent_by: txForm.spent_by,
        transaction_date: txForm.transaction_date
          ? `${txForm.transaction_date}T00:00:00.000Z`
          : editingTx.transaction_date,
      });
      showToast('Transaction updated.', 'success');
      setEditingTx(null);
      await loadTx(filters);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update transaction.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveTx = async () => {
    if (!archiveTx) return;
    const archive = !archiveTx.is_archived;
    setMutating(true);
    try {
      await adminSetTransactionArchived(archiveTx.id, archive);
      showToast(archive ? 'Transaction archived.' : 'Transaction restored.', 'success');
      setArchiveTx(null);
      await loadTx(filters);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update transaction.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const openEditWallet = (row: AdminWalletRow) => {
    setEditingWallet(row);
    setWalletForm({ name: row.name, type: row.type, balance: row.balance });
  };

  const handleSaveWallet = async () => {
    if (!editingWallet) return;
    setSaving(true);
    try {
      await adminUpdateWallet(editingWallet.id, {
        name: walletForm.name,
        type: walletForm.type,
        balance: Number(walletForm.balance) || 0,
      });
      showToast('Wallet updated.', 'success');
      setEditingWallet(null);
      await loadWallets();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update wallet.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveWallet = async () => {
    if (!archiveWallet) return;
    const archive = !archiveWallet.is_archived;
    setMutating(true);
    try {
      await adminSetWalletArchived(archiveWallet.id, archive);
      showToast(archive ? 'Wallet archived.' : 'Wallet restored.', 'success');
      setArchiveWallet(null);
      await loadWallets();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update wallet.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const txColumns = useMemo<AdminColumn<AdminTransactionRow>[]>(
    () => [
      {
        key: 'transaction_date',
        header: 'Date',
        sortable: true,
        accessor: (r) => new Date(r.transaction_date).getTime(),
        render: (r) => <span className="text-xs text-text-muted">{formatDate(r.transaction_date)}</span>,
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        accessor: (r) => r.category,
        render: (r) => (
          <span className="font-semibold capitalize text-text-primary">
            {r.category}
            {r.is_archived && <span className="ml-2 text-[10px] uppercase text-rose-500">archived</span>}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        accessor: (r) => r.type,
        render: (r) => (
          <Badge color={r.type === 'income' ? 'income' : r.type === 'expense' ? 'expense' : 'secondary'}>
            {r.type}
          </Badge>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        sortable: true,
        align: 'right',
        accessor: (r) => r.amount,
        render: (r) => <span className="font-semibold text-text-primary">{formatMoney(r.amount, 'IDR')}</span>,
      },
      {
        key: 'wallet_name',
        header: 'Wallet',
        sortable: true,
        accessor: (r) => r.wallet_name ?? '',
        render: (r) => <span className="text-text-muted">{r.wallet_name || r.wallet_id.slice(0, 8)}</span>,
      },
      {
        key: 'household_name',
        header: 'Household',
        sortable: true,
        accessor: (r) => r.household_name ?? '',
        render: (r) => <span className="text-text-muted">{r.household_name || '—'}</span>,
      },
      {
        key: 'spent_by',
        header: 'Spent By',
        sortable: true,
        accessor: (r) => r.spent_by,
        render: (r) => <span className="text-text-muted">{r.spent_by || '—'}</span>,
      },
    ],
    [],
  );

  const walletColumns = useMemo<AdminColumn<AdminWalletRow>[]>(
    () => [
      {
        key: 'name',
        header: 'Wallet',
        sortable: true,
        accessor: (r) => r.name,
        render: (r) => (
          <span className="font-semibold text-text-primary">
            {r.name}
            {r.is_archived && <span className="ml-2 text-[10px] uppercase text-rose-500">archived</span>}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        accessor: (r) => r.type,
        render: (r) => <span className="capitalize text-text-muted">{r.type}</span>,
      },
      {
        key: 'household_name',
        header: 'Household',
        sortable: true,
        accessor: (r) => r.household_name ?? '',
        render: (r) => <span className="text-text-muted">{r.household_name || '—'}</span>,
      },
      {
        key: 'balance',
        header: 'Balance',
        sortable: true,
        align: 'right',
        accessor: (r) => r.balance,
        render: (r) => <span className="font-semibold text-text-primary">{formatMoney(r.balance, 'IDR')}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        accessor: (r) => (r.is_archived ? 0 : 1),
        render: (r) => (r.is_archived ? <Badge color="expense">Archived</Badge> : <Badge color="income">Active</Badge>),
      },
    ],
    [],
  );

  const actionButton =
    'inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40';

  // Custom filter dropdown options (each carries its own icon).
  const householdOptions = useMemo<DropdownOption[]>(
    () => [
      { value: 'all', label: 'All households', icon: Home },
      ...households.map((h) => ({ value: h.id, label: h.name, icon: Home })),
    ],
    [households],
  );

  const userOptions = useMemo<DropdownOption[]>(
    () => [
      { value: 'all', label: 'All users', icon: Users },
      ...profiles.map((p) => ({ value: p.id, label: p.email, icon: Users })),
    ],
    [profiles],
  );

  const categoryOptions = useMemo<DropdownOption[]>(
    () => [
      { value: 'all', label: 'All categories', icon: Tags },
      ...CATEGORIES.map((c) => ({ value: c.key, label: c.label, icon: Tags })),
    ],
    [],
  );

  const typeOptions: DropdownOption[] = [
    { value: 'all', label: 'All types', icon: ListFilter },
    { value: 'income', label: 'Income', icon: ArrowDownLeft },
    { value: 'expense', label: 'Expense', icon: ArrowUpRight },
    { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  ];

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    void loadTx(EMPTY_FILTERS);
  };

  return (
    <div className="space-y-4" data-testid="admin-wallets-transactions-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Wallets &amp; Transactions</h2>
          <p className="text-xs text-text-muted">Centralized monitoring across every household.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
            {(['transactions', 'wallets'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  view === v ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-surface-hover'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (view === 'transactions' ? void loadTx(filters) : void loadWallets())}
            disabled={view === 'transactions' ? txLoading : walletLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${(view === 'transactions' ? txLoading : walletLoading) ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-xs text-expense">{error}</div>}

      {view === 'transactions' ? (
        <AdminDataTable<AdminTransactionRow>
          rows={txRows}
          columns={txColumns}
          getRowId={(r) => r.id}
          loading={txLoading}
          testId="admin-transactions-table"
          searchText={(r) => `${r.category} ${r.spent_by} ${r.wallet_name ?? ''} ${r.household_name ?? ''} ${r.notes ?? ''}`}
          searchPlaceholder="Search transactions…"
          emptyMessage="No transactions match the filters."
          filters={
            <>
              <CustomDesktopDropdown
                floating
                options={householdOptions}
                value={filters.householdId ?? 'all'}
                onChange={(value) => applyFilters({ householdId: value })}
                placeholder="All households"
                testId="admin-filter-household"
                className="min-w-[168px]"
              />
              <CustomDesktopDropdown
                floating
                options={userOptions}
                value={filters.userId ?? 'all'}
                onChange={(value) => applyFilters({ userId: value })}
                placeholder="All users"
                testId="admin-filter-user"
                className="min-w-[168px]"
              />
              <CustomDesktopDropdown
                floating
                options={categoryOptions}
                value={filters.category ?? 'all'}
                onChange={(value) => applyFilters({ category: value })}
                placeholder="All categories"
                testId="admin-filter-category"
                className="min-w-[160px]"
              />
              <CustomDesktopDropdown
                floating
                options={typeOptions}
                value={filters.type ?? 'all'}
                onChange={(value) => applyFilters({ type: value as AdminTransactionFilters['type'] })}
                placeholder="All types"
                testId="admin-filter-type"
                className="min-w-[140px]"
              />

              <DateFilterButton
                label="From"
                value={filters.from ?? ''}
                onChange={(value) => applyFilters({ from: value })}
                testId="admin-filter-from"
              />
              <DateFilterButton
                label="To"
                value={filters.to ?? ''}
                onChange={(value) => applyFilters({ to: value })}
                testId="admin-filter-to"
              />

              <button
                type="button"
                onClick={() => applyFilters({ includeArchived: !filters.includeArchived })}
                aria-pressed={Boolean(filters.includeArchived)}
                data-testid="admin-filter-archived"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  filters.includeArchived
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
                }`}
              >
                <Archive className="h-3.5 w-3.5" /> Archived
              </button>
              <button
                type="button"
                onClick={resetFilters}
                title="Reset all filters"
                data-testid="admin-filter-reset"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover hover:text-expense"
              >
                <FilterX className="h-3.5 w-3.5" /> Reset
              </button>
            </>
          }
          renderActions={(row) => (
            <div className="flex items-center justify-end gap-1.5">
              <button type="button" title="Edit" className={actionButton} onClick={() => openEditTx(row)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" title={row.is_archived ? 'Restore' : 'Soft delete'} className={actionButton} onClick={() => setArchiveTx(row)}>
                {row.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        />
      ) : (
        <AdminDataTable<AdminWalletRow>
          rows={walletRows}
          columns={walletColumns}
          getRowId={(r) => r.id}
          loading={walletLoading}
          testId="admin-wallets-table"
          searchText={(r) => `${r.name} ${r.type} ${r.household_name ?? ''}`}
          searchPlaceholder="Search wallets…"
          emptyMessage="No wallets found."
          renderActions={(row) => (
            <div className="flex items-center justify-end gap-1.5">
              <button type="button" title="Edit" className={actionButton} onClick={() => openEditWallet(row)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" title={row.is_archived ? 'Restore' : 'Soft delete'} className={actionButton} onClick={() => setArchiveWallet(row)}>
                {row.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        />
      )}

      {/* Edit transaction */}
      <DesktopDialog open={Boolean(editingTx)} onClose={() => setEditingTx(null)} title="Edit Transaction" maxWidthClass="max-w-md" testId="admin-edit-transaction">
        {editingTx && (
          <div className="space-y-4">
            <Select label="Category" value={txForm.category} onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </Select>
            <Input label="Amount" type="number" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
            <Input label="Date" type="date" value={txForm.transaction_date} onChange={(e) => setTxForm((f) => ({ ...f, transaction_date: e.target.value }))} />
            <Input label="Spent By" value={txForm.spent_by} onChange={(e) => setTxForm((f) => ({ ...f, spent_by: e.target.value }))} />
            <Input label="Notes" value={txForm.notes} onChange={(e) => setTxForm((f) => ({ ...f, notes: e.target.value }))} />
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => setEditingTx(null)} disabled={saving} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted hover:bg-surface-hover disabled:opacity-60">Cancel</button>
              <button type="button" onClick={() => void handleSaveTx()} disabled={saving} className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-semibold text-accent-text hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </DesktopDialog>

      {/* Edit wallet */}
      <DesktopDialog open={Boolean(editingWallet)} onClose={() => setEditingWallet(null)} title="Edit Wallet" maxWidthClass="max-w-md" testId="admin-edit-wallet">
        {editingWallet && (
          <div className="space-y-4">
            <Input label="Name" value={walletForm.name} onChange={(e) => setWalletForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Type" value={walletForm.type} onChange={(e) => setWalletForm((f) => ({ ...f, type: e.target.value }))} />
            <Input label="Balance" type="number" value={walletForm.balance} onChange={(e) => setWalletForm((f) => ({ ...f, balance: Number(e.target.value) }))} />
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => setEditingWallet(null)} disabled={saving} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted hover:bg-surface-hover disabled:opacity-60">Cancel</button>
              <button type="button" onClick={() => void handleSaveWallet()} disabled={saving} className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-semibold text-accent-text hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </DesktopDialog>

      {/* Archive transaction confirm */}
      <ConfirmDialog
        open={Boolean(archiveTx)}
        title={archiveTx?.is_archived ? 'Restore Transaction?' : 'Soft Delete Transaction?'}
        description={
          archiveTx && (
            <span>
              {archiveTx.is_archived ? 'Restore' : 'Archive'}{' '}
              <strong className="text-text-primary">{archiveTx.category}</strong> ({formatMoney(archiveTx.amount, 'IDR')})?
              Archived rows stay in the database as an audit trail.
            </span>
          )
        }
        confirmLabel={archiveTx?.is_archived ? 'Restore' : 'Archive'}
        tone={archiveTx?.is_archived ? 'primary' : 'danger'}
        loading={mutating}
        onConfirm={() => void handleArchiveTx()}
        onClose={() => setArchiveTx(null)}
        testId="admin-confirm-archive-tx"
      />

      {/* Archive wallet confirm */}
      <ConfirmDialog
        open={Boolean(archiveWallet)}
        title={archiveWallet?.is_archived ? 'Restore Wallet?' : 'Soft Delete Wallet?'}
        description={
          archiveWallet && (
            <span>
              {archiveWallet.is_archived ? 'Restore' : 'Archive'}{' '}
              <strong className="text-text-primary">{archiveWallet.name}</strong>?
            </span>
          )
        }
        confirmLabel={archiveWallet?.is_archived ? 'Restore' : 'Archive'}
        tone={archiveWallet?.is_archived ? 'primary' : 'danger'}
        loading={mutating}
        onConfirm={() => void handleArchiveWallet()}
        onClose={() => setArchiveWallet(null)}
        testId="admin-confirm-archive-wallet"
      />
    </div>
  );
};

export default AdminWalletsTransactionsPanel;
