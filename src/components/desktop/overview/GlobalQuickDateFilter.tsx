import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Check, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange, type GlobalRangeKey } from '@/context/FinanceDateRangeContext';
import { DesktopDateRangeCalendar } from '@/components/desktop/ui/DesktopDateRangeCalendar';

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

  // Escape closes the popover.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Re-sync the custom-range drafts from the persisted range each time the
  // popover opens, so the calendar always reflects the applied range.
  useEffect(() => {
    if (open) {
      setDraftStart(customStartKey);
      setDraftEnd(customEndKey);
      setShowCustom(rangeKey === 'custom');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
          className={`absolute z-50 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl p-2 text-xs ${
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
            <div className="border-t border-border pt-3 pb-1 px-1 space-y-3">
              <DesktopDateRangeCalendar
                startDate={draftStart}
                endDate={draftEnd}
                onChange={(start, end) => {
                  setDraftStart(start);
                  setDraftEnd(end);
                }}
                testId="global-date-filter-calendar"
              />
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
