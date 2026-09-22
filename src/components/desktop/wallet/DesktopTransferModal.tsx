import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { ArrowRightLeft, ArrowDownToLine, CalendarDays } from 'lucide-react';
import type { HouseholdMember, Wallet } from '@/lib/types';

export type DesktopTransferMode = 'transfer' | 'topup';

interface DesktopTransferModalProps {
  open: boolean;
  onClose: () => void;
  /** `transfer` acts on the source wallet, `topup` on the destination wallet. */
  mode: DesktopTransferMode;
  /** The wallet selected in the workspace (pre-filled for the active side). */
  walletId?: string;
}

/**
 * Desktop-native Transfer / Top-Up dialog. Mirrors the mobile
 * `WalletTransferSheet` (a transfer is a paired `transfer` expense + income)
 * but laid out for the desktop workspace.
 */
export const DesktopTransferModal: React.FC<DesktopTransferModalProps> = ({ open, onClose, mode, walletId }) => {
  const { wallets, householdMembers, profile, addTransaction } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = profile?.currency ?? 'IDR';

  const [srcId, setSrcId] = useState('');
  const [dstId, setDstId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const memberName = (m: HouseholdMember) =>
    m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';

  const ownerLabel = (w: Wallet) => {
    if (w.user_id === profile?.id) return t('common.me');
    const member = householdMembers.find((m) => m.user_id === w.user_id);
    return member ? memberName(member) : t('common.unknownUser');
  };

  useEffect(() => {
    if (!open) return;
    if (mode === 'transfer') {
      setSrcId(walletId ?? '');
      setDstId('');
    } else {
      setSrcId('');
      setDstId(walletId ?? '');
    }
    setAmount('');
    setNotes('');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setError('');
    setDatePickerOpen(false);
  }, [open, mode, walletId]);

  const srcWallet = useMemo(() => wallets.find((w) => w.id === srcId), [wallets, srcId]);
  const dstWallet = useMemo(() => wallets.find((w) => w.id === dstId), [wallets, dstId]);

  const buildOptions = (excludeId: string) =>
    wallets
      .filter((w) => w.id !== excludeId)
      .map((w) => ({
        value: w.id,
        label: `${w.name} · ${ownerLabel(w)} · ${formatMoney(w.balance, currency)}`,
      }));

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
      const targetName = dstWallet?.name ?? 'Unknown';

      // Single `transfer` row (debits the source, credits the destination and is
      // ignored by income/expense aggregates) instead of the old expense+income
      // pair that double-counted every transfer.
      await addTransaction({
        wallet_id: srcId,
        amount: amt,
        type: 'transfer',
        category: 'transfer',
        source_wallet_id: srcId,
        destination_wallet_id: dstId,
        destination_wallet_name: targetName,
        notes: notes.trim() || t('transfer.to', { name: targetName }),
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

  const isTopUp = mode === 'topup';

  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      title={isTopUp ? t('wallet.topUp') : t('transfer.title')}
      description={isTopUp ? t('wallet.topUp') : t('walletWs.transferBalance')}
      icon={isTopUp ? ArrowDownToLine : ArrowRightLeft}
      maxWidthClass="max-w-lg"
      testId="desktop-transfer-modal"
    >
      <div className="space-y-5">
        {/* Source wallet */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('transfer.sourceWallet')}</label>
          <CustomDesktopDropdown
            options={buildOptions(dstId)}
            value={srcId}
            onChange={setSrcId}
            placeholder={t('tx.selectWallet')}
            className="w-full"
            testId="desktop-transfer-source"
          />
          {srcWallet && (
            <p className="mt-1 text-[11px] text-text-muted">
              {formatMoney(srcWallet.balance, currency)} {t('wallet.currentBalance')}
            </p>
          )}
        </div>

        {/* Destination wallet */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('transfer.destWallet')}</label>
          <CustomDesktopDropdown
            options={buildOptions(srcId)}
            value={dstId}
            onChange={setDstId}
            placeholder={t('tx.selectWallet')}
            className="w-full"
            testId="desktop-transfer-dest"
          />
        </div>

        {/* Amount */}
        <Input
          label={t('transfer.amount')}
          prefix={getCurrencySymbol(currency)}
          placeholder="0"
          inputMode="numeric"
          value={amount ? formatMoneyInput(parseMoneyInput(amount), currency) : ''}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold"
          data-testid="desktop-transfer-amount"
        />

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('transfer.date')}</label>
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-hover/60 px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-text-muted" />
              {transactionDate}
            </span>
            <span className="text-xs font-bold text-accent">{t('common.edit') || 'Change'}</span>
          </button>
          <CustomDatePicker
            value={transactionDate}
            onChange={setTransactionDate}
            open={datePickerOpen}
            onClose={() => setDatePickerOpen(false)}
            variant="inline"
          />
        </div>

        {/* Note */}
        <Input
          label={t('transfer.noteOptional')}
          placeholder={t('transfer.notePlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          data-testid="desktop-transfer-note"
        />

        {error && <p className="text-sm text-expense" role="alert">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={loading} data-testid="desktop-transfer-submit">
            {loading ? t('transfer.processing') : t('transfer.submit')}
          </Button>
        </div>
      </div>
    </DesktopDialog>
  );
};
