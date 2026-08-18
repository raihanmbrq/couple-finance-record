import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { walletTypeIcon } from '@/lib/walletIcons';
import { type Wallet, type HouseholdMember } from '@/lib/types';
import { ArrowDown, ArrowUp, ChevronDown, Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface WalletTransferSheetProps {
  open: boolean;
  onClose: () => void;
  sourceWalletId?: string;
  destWalletId?: string;
}

export function WalletTransferSheet({ open, onClose, sourceWalletId, destWalletId }: WalletTransferSheetProps) {
  const { wallets, walletTypes, profile, householdMembers, addTransaction } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();

  const [srcId, setSrcId] = useState('');
  const [dstId, setDstId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSrcPicker, setShowSrcPicker] = useState(false);
  const [showDstPicker, setShowDstPicker] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);

  const memberName = (m: HouseholdMember) =>
    m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';

  const formatWalletType = (type: string) => {
    const row = walletTypes.find((wt) => wt.id === type);
    if (row) return row.name;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const walletOwnerLabel = (w: Wallet) => {
    if (w.user_id === profile?.id) return t('common.me');
    const member = householdMembers.find((m) => m.user_id === w.user_id);
    return member ? memberName(member) : t('common.unknownUser');
  };

  // Group wallets by owner for the picker
  const walletGroups = useMemo(() => {
    const groups: { label: string; wallets: Wallet[] }[] = [];
    const byOwner = new Map<string, Wallet[]>();

    for (const w of wallets) {
      const key = w.user_id ?? 'unknown';
      if (!byOwner.has(key)) byOwner.set(key, []);
      byOwner.get(key)!.push(w);
    }

    // Me first
    const myWallets = byOwner.get(profile?.id ?? '');
    if (myWallets && myWallets.length > 0) {
      groups.push({ label: t('common.me'), wallets: myWallets });
      byOwner.delete(profile?.id ?? '');
    }

    // Circle members
    for (const m of householdMembers) {
      if (m.user_id === profile?.id) continue;
      const memberWallets = byOwner.get(m.user_id);
      if (memberWallets && memberWallets.length > 0) {
        groups.push({ label: memberName(m), wallets: memberWallets });
        byOwner.delete(m.user_id);
      }
    }

    // Any remaining
    for (const [, ws] of byOwner) {
      if (ws.length > 0) groups.push({ label: t('common.unknownUser'), wallets: ws });
    }

    return groups;
  }, [wallets, householdMembers, profile]);

  useEffect(() => {
    if (open) {
      setSrcId(sourceWalletId ?? '');
      setDstId(destWalletId ?? '');
      setAmount('');
      setNotes('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setError('');
      setShowSrcPicker(false);
      setShowDstPicker(false);
    }
  }, [open, sourceWalletId, destWalletId]);

  const srcWallet = useMemo(() => wallets.find((w) => w.id === srcId), [wallets, srcId]);
  const dstWallet = useMemo(() => wallets.find((w) => w.id === dstId), [wallets, dstId]);

  const handleSubmit = async () => {
    const amt = parseMoneyInput(amount);
    if (!amt) {
      setError(t('transfer.enterAmount'));
      return;
    }
    if (!srcId) {
      setError(t('tx.selectWallet'));
      return;
    }
    if (!dstId) {
      setError(t('transfer.selectDest'));
      return;
    }
    if (srcId === dstId) {
      setError(t('transfer.sameWallet'));
      return;
    }
    if (srcWallet && amt > srcWallet.balance) {
      setError(t('transfer.insufficientBalance'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      const sourceName = srcWallet?.name ?? 'Unknown';
      const targetName = dstWallet?.name ?? 'Unknown';

      // Expense from source wallet
      await addTransaction({
        wallet_id: srcId,
        amount: amt,
        type: 'expense',
        category: 'transfer',
        notes: notes.trim() || t('transfer.to', { name: targetName }),
        spent_by: profile?.full_name ?? 'Me',
        transaction_date: `${transactionDate}T12:00:00.000Z`,
      });

      // Income to destination wallet
      await addTransaction({
        wallet_id: dstId,
        amount: amt,
        type: 'income',
        category: 'transfer',
        notes: notes.trim() || t('transfer.from', { name: sourceName }),
        spent_by: profile?.full_name ?? 'Me',
        transaction_date: `${transactionDate}T12:00:00.000Z`,
      });

      onClose();
      showToast(t('transfer.success'));
    } catch {
      setError(t('transfer.failed'));
    } finally {
      setLoading(false);
    }
  };

  const renderWalletPicker = (
    label: string,
    selectedWallet: Wallet | undefined,
    onSelect: (id: string) => void,
    excludeId: string,
    showPicker: boolean,
    setShowPicker: (v: boolean) => void,
    icon: 'up' | 'down',
  ) => (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
          selectedWallet ? 'border-primary bg-primary/5' : 'border-secondary bg-secondary'
        }`}
      >
        {selectedWallet ? (
          <>
            <WalletPickerIcon wallet={selectedWallet} />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm text-text-primary truncate">{selectedWallet.name}</p>
              <p className="text-xs text-text-secondary">{formatWalletType(selectedWallet.type)} · {formatMoney(selectedWallet.balance, currency)}</p>
            </div>
            <span className="text-[10px] font-semibold text-text-secondary px-1.5 py-0.5 bg-secondary rounded-md">{walletOwnerLabel(selectedWallet)}</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              {icon === 'up' ? <ArrowUp className="w-5 h-5 text-text-secondary" /> : <ArrowDown className="w-5 h-5 text-text-secondary" />}
            </div>
            <span className="flex-1 text-sm text-text-secondary text-left">{t('tx.selectWallet')}</span>
          </>
        )}
        <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
      </button>

      {showPicker && (
        <div className="mt-2 border border-secondary rounded-xl overflow-hidden divide-y divide-secondary max-h-52 overflow-y-auto no-scrollbar">
          {walletGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-3 pt-2 pb-1 bg-secondary/30">{group.label}</p>
              {group.wallets
                .filter((w) => w.id !== excludeId)
                .map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { onSelect(w.id); setShowPicker(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors text-left"
                  >
                    <WalletPickerIcon wallet={w} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{w.name}</p>
                      <p className="text-xs text-text-secondary">{formatMoney(w.balance, currency)}</p>
                    </div>
                  </button>
                ))}
            </div>
          ))}
          {/* Add Wallet button */}
          <button
            type="button"
            onClick={() => { setShowPicker(false); setShowAddWallet(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors text-left border-t border-secondary"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-primary/40 flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-sm text-primary">{t('tx.addNewWallet')}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('transfer.title')}>
      <div className="space-y-5">
        {/* Source Wallet */}
        {renderWalletPicker(
          t('transfer.sourceWallet'),
          srcWallet,
          setSrcId,
          dstId,
          showSrcPicker,
          setShowSrcPicker,
          'up',
        )}

        {/* Destination Wallet */}
        {renderWalletPicker(
          t('transfer.destWallet'),
          dstWallet,
          setDstId,
          srcId,
          showDstPicker,
          setShowDstPicker,
          'down',
        )}

        {/* Amount */}
        <Input
          label={t('transfer.amount')}
          prefix={getCurrencySymbol(currency)}
          placeholder="0"
          inputMode="numeric"
          value={formatMoneyInput(parseMoneyInput(amount), currency)}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold"
        />

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('transfer.date')}</label>
          <CustomDatePicker
            value={transactionDate}
            onChange={setTransactionDate}
            open={datePickerOpen}
            onClose={() => setDatePickerOpen(false)}
          />
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-secondary/35 rounded-xl hover:border-primary/50 transition-all font-medium text-sm text-text-primary min-h-[48px]"
          >
            <span>{transactionDate || t('transfer.date')}</span>
            <span className="text-primary font-bold text-xs">Change</span>
          </button>
        </div>

        {/* Note */}
        <Input
          label={t('transfer.noteOptional')}
          placeholder={t('transfer.notePlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? t('transfer.processing') : t('transfer.submit')}
        </Button>
      </div>
      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
    </Sheet>
  );
}

function WalletPickerIcon({ wallet }: { wallet: Wallet }) {
  const { walletTypes } = useApp();
  const typeRow = walletTypes.find((wt) => wt.id === wallet.type);
  const Icon = walletTypeIcon(typeRow?.icon);
  return (
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
  );
}
