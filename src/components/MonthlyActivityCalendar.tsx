import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { formatMoneyCompact } from '@/lib/format';

interface MonthlyActivityCalendarProps {
  onSelectDate: (dateKey: string) => void;
  /** Optional year override (defaults to the current year). */
  year?: number;
  /** Optional month override, 0-based (defaults to the current month). */
  month?: number;
  /** Hide the built-in heading when the parent card already renders its own title + month picker. */
  hideHeader?: boolean;
}

// Monday-first weekday labels per language (id: SN SL RB KM JM SB MG).
const WEEKDAY_LABELS: Record<string, string[]> = {
  id: ['SN', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'],
  en: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
};

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function MonthlyActivityCalendar({ onSelectDate, year, month, hideHeader = false }: MonthlyActivityCalendarProps) {
  const { transactions, profile } = useApp();
  const { t, language } = useLanguage();
  const currency = profile?.currency ?? 'IDR';

  const now = new Date();
  const viewYear = year ?? now.getFullYear();
  const viewMonth = month ?? now.getMonth();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  // Month heading, e.g. "AUGUST 2026"
  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleString(locale, { month: 'long', year: 'numeric' })
    .toUpperCase();

  // Daily expense totals (excludes transfers) for the viewed month
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of transactions) {
      // Internal transfers are not spend of any kind.
      if (tx.type !== 'expense') continue;
      const d = new Date(tx.transaction_date || tx.created_at);
      if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) continue;
      const key = localDayKey(d);
      totals[key] = (totals[key] || 0) + tx.amount;
    }
    return totals;
  }, [transactions, viewMonth, viewYear]);

  // Days that have any recorded transaction (for highlighted background)
  const activeDays = useMemo(() => {
    const days = new Set<string>();
    for (const tx of transactions) {
      const d = new Date(tx.transaction_date || tx.created_at);
      if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) continue;
      days.add(localDayKey(d));
    }
    return days;
  }, [transactions, viewMonth, viewYear]);

  const leadingBlanks = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = localDayKey(now);

  return (
    <div>
      {!hideHeader && (
        <div className="mb-3">
          <h3 className="font-display font-bold text-xl text-text-primary">{t('home.monthlyActivity')}</h3>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mt-0.5">{monthLabel}</p>
        </div>
      )}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS[language]?.map((label) => (
            <p key={label} className="text-center text-[10px] font-bold text-text-secondary uppercase py-1">
              {label}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} className="min-h-[60px] rounded-lg" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const key = localDayKey(date);
            const total = dailyTotals[key] || 0;
            const isToday = key === todayKey;
            const hasTx = activeDays.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(key)}
                aria-label={date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                className={`min-h-[60px] rounded-lg transition-all flex flex-col items-center pt-1.5 pb-1 px-0.5 overflow-hidden active:scale-95 ${
                  hasTx ? 'bg-primary/20 hover:bg-primary/30' : 'bg-secondary/30 hover:bg-secondary'
                }`}
              >
                <span
                  className={`text-xs w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : hasTx
                        ? 'text-primary-dark font-display font-extrabold'
                        : 'text-text-primary font-semibold'
                  }`}
                >
                  {day}
                </span>
                <span className="flex-1 w-full flex items-start justify-center pt-0.5">
                  {total > 0 && (
                    <span className="text-[9px] font-bold text-expense-dark bg-expense/20 px-1 py-0.5 rounded-md truncate w-full text-center tabular-nums">
                      -{formatMoneyCompact(total, currency)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
