import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Check, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange, type GlobalRangeKey } from '@/context/FinanceDateRangeContext';

const PRESET_OPTIONS: { key: GlobalRangeKey; tKey: string; fallback: string }[] = [
  { key: 'thisMonth', tKey: 'filter.thisMonth', fallback: 'This Month' },
  { key: 'last30', tKey: 'filter.last30', fallback: 'Last 30 Days' },
  { key: 'thisYear', tKey: 'filter.thisYear', fallback: 'This Year' },
  { key: 'custom', tKey: 'filter.customRange', fallback: 'Custom Range' },
];

const localShort = (dateKey: string, locale: string): string => {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

/**
 * Global Quick Date Period Selector — a pill/dropdown on the Dashboard Overview
 * top bar. Every Overview metric card & analytics chart reacts through
 * FinanceDateRangeProvider.
 */
export const GlobalQuickDateFilter: React.FC<{ align?: 'left' | 'right' }> = ({ align = 'right' }) => {
  const { t, language } = useLanguage();
  const { rangeKey, setRangeKey, customStartKey, customEndKey, applyCustomRange, range } =
    useFinanceDateRange();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(rangeKey === 'custom');
  const [draftStart, setDraftStart] = useState(customStartKey);
  const [draftEnd, setDraftEnd] = useState(customEndKey);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const selectedPreset =
    PRESET_OPTIONS.find((o) => o.key === rangeKey) || PRESET_OPTIONS[0];

  const handleSelectPreset = (key: GlobalRangeKey) => {
    if (key === 'custom') {
      setShowCustom(true);
      return; // wait for the user to pick a range (or re-use previous)
    }
    setShowCustom(false);
    setRangeKey(key);
    setOpen(false);
  };

  const handleApplyCustom = () => {
    if (!draftStart || !draftEnd) return;
    const orderedStart = draftStart <= draftEnd ? draftStart : draftEnd;
    const orderedEnd = draftStart <= draftEnd ? draftEnd : draftStart;
    applyCustomRange(orderedStart, orderedEnd);
    setOpen(false);
  };

  const pillLabel =
    rangeKey === 'custom' && range.startKey && range.endKey
      ? `${localShort(range.startKey, locale)} – ${localShort(range.endKey, locale)}`
      : t(selectedPreset.tKey) || selectedPreset.fallback;

  return (
    <div ref={containerRef} className="relative inline-block" data-testid="global-date-filter">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-3 pr-2.5 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary shadow-xs transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <CalendarDays className="w-4 h-4 text-accent" />
        <span className="min-w-[70px] text-left">{pillLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute z-50 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl p-2 text-xs ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('filter.periodLabel') || 'Time Period'}
          </p>
          <div className="py-1">
            {PRESET_OPTIONS.map((opt) => {
              const isActive = rangeKey === opt.key && !(opt.key === 'custom' && showCustom);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectPreset(opt.key)}
                  className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                    isActive ? 'bg-accent/10 font-bold text-accent' : 'text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <span>{t(opt.tKey) || opt.fallback}</span>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {showCustom && (
            <div className="border-t border-border pt-2 pb-1 px-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                    {t('filter.from') || 'From'}
                  </span>
                  <input
                    type="date"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                    {t('filter.to') || 'To'}
                  </span>
                  <input
                    type="date"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!draftStart || !draftEnd}
                  className="flex-1 py-2 rounded-xl bg-accent text-accent-text font-bold transition-colors hover:opacity-90 disabled:opacity-40"
                >
                  {t('filter.customApply') || 'Apply Range'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom(false);
                    if (rangeKey === 'custom') setRangeKey('thisMonth');
                  }}
                  className="p-2 rounded-xl text-text-muted hover:bg-surface-hover"
                  aria-label={t('common.close') || 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
