import React, { useState } from 'react';
import { X, Pencil, Loader2, UserRound, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Transaction } from '@/lib/types';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { getIcon } from '@/lib/icons';
import { walletTypeIcon } from '@/lib/walletIcons';
import { formatDate } from '@/lib/format';

export type BulkTransactionUpdates = Partial<Pick<Transaction, 'category' | 'wallet_id' | 'spent_by' | 'transaction_date' | 'notes'>>;

interface BulkEditTransactionsModalProps {
  selectedCount: number;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (updates: BulkTransactionUpdates) => Promise<void>;
}

export const BulkEditTransactionsModal: React.FC<BulkEditTransactionsModalProps> = ({
  selectedCount,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { wallets, categories, householdMembers } = useApp();
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [spentBy, setSpentBy] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const updates: BulkTransactionUpdates = {};
    if (category) updates.category = category;
    if (walletId) updates.wallet_id = walletId;
    if (spentBy) updates.spent_by = spentBy;
    if (transactionDate) updates.transaction_date = `${transactionDate}T12:00:00.000Z`;
    if (notes.trim()) updates.notes = notes.trim();
    await onSubmit(updates);
  };

  const memberNames = householdMembers
    .map((member) => member.profile?.full_name)
    .filter((name): name is string => Boolean(name));

  const categoryOptions = categories.map((item) => ({
    value: item.id,
    label: item.name,
    icon: getIcon(item.icon),
  }));
  const walletOptions = wallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.name,
    icon: walletTypeIcon(wallet.icon || wallet.type),
  }));
  const memberOptions = memberNames.map((name) => ({
    value: name,
    label: name,
    icon: UserRound,
  }));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-visible">
        <div className="h-14 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-primary">
            <Pencil className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold">Edit Massal ({selectedCount} transaksi)</h2>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-text-muted">Isi hanya properti yang ingin diperbarui. Properti yang kosong akan dilewati.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-text-muted">Change Category</span>
              <CustomDesktopDropdown options={categoryOptions} value={category} onChange={setCategory} placeholder="Tidak diubah" className="w-full" testId="bulk-edit-category-dropdown" />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-text-muted">Change Wallet</span>
              <CustomDesktopDropdown options={walletOptions} value={walletId} onChange={setWalletId} placeholder="Tidak diubah" className="w-full" testId="bulk-edit-wallet-dropdown" />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-text-muted">Change Logged By / Spent By</span>
              <CustomDesktopDropdown options={memberOptions} value={spentBy} onChange={setSpentBy} placeholder="Tidak diubah" className="w-full" testId="bulk-edit-member-dropdown" />
            </div>
            <div className="relative space-y-1.5">
              <span className="block text-xs font-semibold text-text-muted">Change Date</span>
              <button
                type="button"
                onClick={() => setDatePickerOpen((open) => !open)}
                aria-expanded={datePickerOpen}
                aria-haspopup="dialog"
                data-testid="bulk-edit-date-trigger"
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-medium text-text-primary shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarDays className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className={transactionDate ? '' : 'text-text-muted'}>
                    {transactionDate ? formatDate(`${transactionDate}T00:00:00`) : 'Tidak diubah'}
                  </span>
                </span>
                {transactionDate && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Hapus tanggal"
                    onClick={(event) => { event.stopPropagation(); setTransactionDate(''); setDatePickerOpen(false); }}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setTransactionDate(''); setDatePickerOpen(false); } }}
                    className="text-text-muted hover:text-text-primary px-1"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
              {datePickerOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-3rem))]">
                  <CustomDatePicker
                    value={transactionDate}
                    onChange={setTransactionDate}
                    open={datePickerOpen}
                    onClose={() => setDatePickerOpen(false)}
                    title="Pilih Tanggal Transaksi"
                    variant="inline"
                  />
                </div>
              )}
            </div>
          </div>
          <label className="space-y-1.5 block">
            <span className="block text-xs font-semibold text-text-muted">Append / Replace Notes</span>
            <input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan baru (opsional)" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted" />
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-muted hover:bg-surface-hover">Batal</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Menyimpan...' : 'Terapkan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
