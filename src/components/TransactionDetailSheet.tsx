import { useState, type ReactNode } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { type Transaction } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { useLanguage } from '@/context/LanguageContext';
import { X, Trash2, ImageIcon, Clock, Wallet, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TransactionDetailSheetProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  currency: string;
  walletName: string | null;
  categoryName: string;
  categoryIcon: LucideIcon;
}

export function TransactionDetailSheet({
  open,
  transaction,
  onClose,
  onEdit,
  onDelete,
  currency,
  walletName,
  categoryName,
  categoryIcon: Icon,
}: TransactionDetailSheetProps) {
  const { t } = useLanguage();
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const dateStr = transaction.transaction_date
    ? formatDate(new Date(transaction.transaction_date))
    : '—';

  return (
    <>
      <Sheet open={open} onClose={onClose} title={t('tx.detailTitle')}>
        <div className="space-y-5">
          {/* Category + Type */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isIncome ? 'bg-income/10' : 'bg-secondary'
            }`}>
              <Icon className={`w-6 h-6 ${isIncome ? 'text-income' : 'text-text-secondary'}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{categoryName}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
              }`}>
                {isIncome ? t('common.income') : t('common.expense')}
              </span>
            </div>
          </div>

          {/* Amount */}
          <p className={`text-3xl font-bold ${isIncome ? 'text-income' : 'text-text-primary'}`}>
            {isIncome ? '+' : '-'}{formatMoney(transaction.amount, currency)}
          </p>

          {/* Divider */}
          <div className="border-t border-secondary" />

          {/* Info rows */}
          <div className="space-y-3">
            <InfoRow icon={<Clock className="w-4 h-4" />} label={t('tx.date')} value={dateStr} />
            <InfoRow icon={<Wallet className="w-4 h-4" />} label={t('common.wallet')} value={walletName ?? '—'} />
            <InfoRow icon={<User className="w-4 h-4" />} label={t('tx.loggedBy')} value={transaction.spent_by} />
            {transaction.notes && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary font-medium">{t('tx.noteOptional')}</p>
                  <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{transaction.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Receipt image */}
          {transaction.receipt_url && (
            <div>
              <p className="text-xs text-text-secondary font-medium mb-2">{t('tx.attachReceipt')}</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-full h-40 rounded-xl border border-secondary overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img src={transaction.receipt_url} alt="" className="w-full h-full object-cover" />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Button fullWidth onClick={() => onEdit(transaction)}>
              {t('tx.editTransaction')}
            </Button>
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-expense bg-expense/10 border-2 border-expense/20 hover:bg-expense/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Full-size receipt preview overlay */}
      {previewOpen && transaction.receipt_url && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={transaction.receipt_url}
            alt={t('tx.receiptPreview')}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary font-medium">{label}</p>
        <p className="text-sm text-text-primary font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}