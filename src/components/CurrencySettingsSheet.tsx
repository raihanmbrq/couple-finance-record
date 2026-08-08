import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/context/ToastContext';
import { CURRENCIES, getCurrencyInfo } from '@/lib/currencies';
import { Search, Check } from 'lucide-react';

interface CurrencySettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CurrencySettingsSheet({ open, onClose }: CurrencySettingsSheetProps) {
  const { profile, updateCurrency } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const activeCode = profile?.currency ?? 'IDR';

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = async (code: string) => {
    if (code === activeCode) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateCurrency(code);
      showToast(t('currency.updatedToast'));
      onClose();
    } catch {
      showToast(t('currency.failedToast'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('currency.title')}>
      <div className="flex flex-col h-full max-h-[70vh]">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-10 -mx-5 px-5 pt-2 pb-3 bg-surface border-b border-secondary">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('currency.searchPlaceholder')}
              className="input-field pl-11"
            />
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-5 px-5 py-3 space-y-1">
          {filteredCurrencies.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              {t('currency.notFound')}
            </p>
          ) : (
            filteredCurrencies.map((c) => {
              const isActive = c.code === activeCode;
              return (
                <button
                  key={c.code}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border-2 ${
                    isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary'
                  }`}
                >
                  <span className="text-xl leading-none shrink-0">{c.flag}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                        {c.code}
                      </span>
                      <span className="text-xs text-text-secondary">({c.symbol})</span>
                    </span>
                    <span className="block text-xs text-text-secondary truncate">{c.name}</span>
                  </span>
                  {isActive && (
                    <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="pt-3 -mx-5 px-5 border-t border-secondary">
          <p className="text-xs text-text-secondary">
            {t('currency.active')}: <span className="font-semibold text-text-primary">{activeCode} ({getCurrencyInfo(activeCode).symbol})</span>
          </p>
        </div>
      </div>
    </Sheet>
  );
}