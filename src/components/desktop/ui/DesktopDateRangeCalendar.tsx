import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DesktopDateRangeCalendarProps {
  /** Inclusive range start key (YYYY-MM-DD). */
  startDate: string;
  /** Inclusive range end key (YYYY-MM-DD); `''` while the user is picking. */
  endDate: string;
  onChange: (start: string, end: string) => void;
  testId?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const ID_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EN_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Desktop-native inline date-range calendar.
 *
 * Replaces the browser's default `<input type="date">` with an in-app, themed
 * calendar: click a start day then an end day, with live range highlighting,
 * month/year navigation, a quick month-jump grid, and arrow-key navigation.
 */
export const DesktopDateRangeCalendar: React.FC<DesktopDateRangeCalendarProps> = ({
  startDate,
  endDate,
  onChange,
  testId,
}) => {
  const { language } = useLanguage();
  const [viewDate, setViewDate] = useState(() => {
    const base = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [hoverKey, setHoverKey] = useState('');
  const [focusKey, setFocusKey] = useState(startDate);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const months = language === 'en' ? EN_MONTHS : ID_MONTHS;
  const weekdays = language === 'en' ? EN_DAYS : ID_DAYS;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const cells = useMemo(() => {
    const out: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) out.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) out.push(toKey(year, month, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month, firstWeekday, daysInMonth]);

  // Keep the keyboard highlight on the externally-selected start date.
  useEffect(() => {
    if (startDate) setFocusKey(startDate);
  }, [startDate]);

  // Move real DOM focus to the highlighted day (roving tabindex).
  useEffect(() => {
    const el = dayRefs.current[focusKey];
    if (el && document.activeElement !== el) el.focus();
  }, [focusKey, viewDate]);

  // While picking (no end yet) preview the range up to the hovered day.
  const effectiveEnd =
    endDate || (startDate && hoverKey && hoverKey > startDate ? hoverKey : '');

  const shiftMonth = (delta: number) =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const shiftYear = (delta: number) =>
    setViewDate((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1));

  const handleDayClick = (key: string) => {
    if (!startDate || (startDate && endDate)) {
      onChange(key, '');
      setFocusKey(key);
      return;
    }
    if (key < startDate) {
      onChange(key, '');
      setFocusKey(key);
      return;
    }
    onChange(startDate, key);
    setFocusKey(key);
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta =
      event.key === 'ArrowLeft' ? -1 :
      event.key === 'ArrowRight' ? 1 :
      event.key === 'ArrowUp' ? -7 :
      event.key === 'ArrowDown' ? 7 : 0;
    if (!delta) return;

    event.preventDefault();
    const base = focusKey ? new Date(`${focusKey}T00:00:00`) : new Date(year, month, 1);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + delta);
    setFocusKey(toKey(base.getFullYear(), base.getMonth(), base.getDate()));
    if (base.getMonth() !== month || base.getFullYear() !== year) {
      setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  };

  const formatShort = (key: string) => {
    if (!key) return '—';
    const d = new Date(`${key}T00:00:00`);
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      {/* Header — year / month navigation */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => shiftYear(-1)}
          aria-label="Previous year"
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary ${FOCUS_RING}`}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-surface-hover ${FOCUS_RING}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowMonthGrid((v) => !v)}
          aria-expanded={showMonthGrid}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-surface-hover ${FOCUS_RING}`}
        >
          {months[month]} {year}
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-surface-hover ${FOCUS_RING}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => shiftYear(1)}
          aria-label="Next year"
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary ${FOCUS_RING}`}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month quick-jump grid */}
      {showMonthGrid ? (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {months.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setViewDate(new Date(year, i, 1));
                setShowMonthGrid(false);
              }}
              className={`rounded-lg py-2 text-[11px] font-semibold transition-colors ${FOCUS_RING} ${
                i === month ? 'bg-accent text-accent-text' : 'bg-surface-hover/60 text-text-primary hover:bg-surface-hover'
              }`}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {weekdays.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div
            role="group"
            aria-label="Date range calendar"
            className="grid grid-cols-7 gap-1"
            onKeyDown={handleGridKeyDown}
          >
            {cells.map((key, index) => {
              if (!key) return <div key={`blank-${index}`} className="h-8 w-8" />;

              const isStart = key === startDate;
              const isEnd = key === endDate;
              const isEndpoint = isStart || isEnd;
              const inRange = Boolean(startDate && effectiveEnd && key > startDate && key < effectiveEnd);
              const isHighlighted = key === focusKey;

              return (
                <button
                  key={key}
                  type="button"
                  ref={(el) => { dayRefs.current[key] = el; }}
                  tabIndex={isHighlighted ? 0 : -1}
                  aria-pressed={isEndpoint || inRange}
                  aria-label={key}
                  data-date={key}
                  onClick={() => handleDayClick(key)}
                  onMouseEnter={() => setHoverKey(key)}
                  onMouseLeave={() => setHoverKey('')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${FOCUS_RING} ${
                    isEndpoint
                      ? 'bg-accent text-accent-text'
                      : inRange
                        ? 'bg-accent/20 text-text-primary'
                        : key === todayKey
                          ? 'text-accent ring-1 ring-inset ring-accent/40 hover:bg-surface-hover'
                          : 'text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {Number(key.slice(-2))}
                </button>
              );
            })}
          </div>

        </>
      )}

      {/* Selected range summary */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-hover/50 px-3 py-2 text-[11px]">
        <span className={`font-semibold ${startDate ? 'text-text-primary' : 'text-text-muted'}`}>
          {formatShort(startDate)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span className={`font-semibold ${endDate ? 'text-text-primary' : 'text-text-muted'}`}>
          {formatShort(endDate)}
        </span>
      </div>

    </div>
  );
};
