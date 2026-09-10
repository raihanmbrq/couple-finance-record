import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
  title?: string;
  /**
   * `sheet` (default) keeps the mobile bottom-sheet used across the app.
   * `inline` renders an in-flow dark panel intended to sit directly beneath a
   * desktop trigger button (no viewport-centred overlay).
   */
  variant?: 'sheet' | 'inline';
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function CustomDatePicker({ value, onChange, open, onClose, title, variant = 'sheet' }: CustomDatePickerProps) {
  const { language } = useLanguage();
  const isInline = variant === 'inline';
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(`${value}T00:00:00`) : new Date();
  });
  // The day that currently owns the keyboard highlight (roving tabindex).
  const [focusedDay, setFocusedDay] = useState(() => value || toDateKey(new Date()));
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const idMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const months = language === 'en' ? enMonths : idMonths;
  const daysOfWeek = language === 'en' 
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] 
    : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonthDays = month === 0 ? getDaysInMonth(year - 1, 11) : getDaysInMonth(year, month - 1);

  // When the popover opens (or the bound value changes) snap the calendar to that
  // month and place the roving highlight on the selected day.
  useEffect(() => {
    if (!open) return;
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    const safe = Number.isNaN(base.getTime()) ? new Date() : base;
    setCurrentDate(new Date(safe.getFullYear(), safe.getMonth(), 1));
    setFocusedDay(value || toDateKey(safe));
  }, [open, value]);

  const monthPrefix = `${year}-${pad(month + 1)}`;

  // Keep the roving highlight inside the visible month and move real DOM focus to it.
  useEffect(() => {
    if (!open) return;
    let key = focusedDay;
    if (!key.startsWith(monthPrefix)) {
      key = `${monthPrefix}-01`;
      setFocusedDay(key);
    }
    const el = dayRefs.current[key];
    if (el) el.focus();
  }, [open, focusedDay, currentDate, monthPrefix]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const prevM = prev.getMonth() === 0 ? 11 : prev.getMonth() - 1;
      const prevY = prev.getMonth() === 0 ? prev.getFullYear() - 1 : prev.getFullYear();
      return new Date(prevY, prevM, 1);
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const nextM = prev.getMonth() === 11 ? 0 : prev.getMonth() + 1;
      const nextY = prev.getMonth() === 11 ? prev.getFullYear() + 1 : prev.getFullYear();
      return new Date(nextY, nextM, 1);
    });
  };

  const handleSelectDay = (day: number) => {
    onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
    onClose();
  };

  // Arrow keys move the highlight one day (Left/Right) or one week (Up/Down),
  // automatically flipping to the neighbouring month at the edges.
  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta =
      event.key === 'ArrowLeft' ? -1 :
      event.key === 'ArrowRight' ? 1 :
      event.key === 'ArrowUp' ? -7 :
      event.key === 'ArrowDown' ? 7 : 0;
    if (!delta) return;

    event.preventDefault();
    const base = new Date(`${focusedDay}T00:00:00`);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + delta);
    if (base.getMonth() !== month || base.getFullYear() !== year) {
      setCurrentDate(new Date(base.getFullYear(), base.getMonth(), 1));
    }
    setFocusedDay(toDateKey(base));
  };

  // Only sizing differs between variants — colours always follow the app theme.
  const navBarClass = 'flex items-center justify-between rounded-xl bg-secondary/40 px-2 py-1';
  const navBtnClass = `flex items-center justify-center rounded-lg text-text-primary transition-all hover:bg-secondary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    isInline ? 'h-9 w-9' : 'h-10 w-10'
  }`;
  const monthLabelClass = `font-bold text-text-primary ${isInline ? 'text-sm' : 'text-base'}`;
  const weekHeaderClass = `mb-1 grid grid-cols-7 gap-1 text-center font-bold uppercase tracking-wider text-text-secondary ${
    isInline ? 'text-[10px]' : 'text-xs'
  }`;
  const dayBaseClass = `flex w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    isInline ? 'h-10' : 'h-11'
  }`;
  const daySelectedClass = 'bg-primary text-white border-primary shadow-soft';
  const dayTodayClass = 'bg-secondary/60 text-primary border-primary/20';
  const dayIdleClass = 'bg-transparent text-text-primary border-transparent hover:bg-secondary/40';
  const prevTailClass = `flex items-center justify-center text-sm font-medium text-text-secondary/40 ${
    isInline ? 'h-10' : 'h-11'
  }`;

  const daysGrid: JSX.Element[] = [];

  // Empty cells or prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    daysGrid.push(
      <div key={`prev-${d}`} className={prevTailClass}>
        {d}
      </div>
    );
  }

  // Days in current month
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedStr = value;

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = currentDayStr === selectedStr;
    const isToday = currentDayStr === todayStr;

    const isFocused = currentDayStr === focusedDay;

    daysGrid.push(
      <button
        key={`day-${d}`}
        ref={(el) => { dayRefs.current[currentDayStr] = el; }}
        type="button"
        data-testid={`date-picker-day-${currentDayStr}`}
        aria-label={currentDayStr}
        aria-pressed={isSelected}
        aria-current={isToday ? 'date' : undefined}
        tabIndex={isFocused ? 0 : -1}
        onClick={() => handleSelectDay(d)}
        className={`${dayBaseClass} ${
          isSelected ? daySelectedClass : isToday ? dayTodayClass : dayIdleClass
        }`}
      >
        {d}
      </button>
    );
  }

  const calendarBody = (
    <>
      <div className={navBarClass}>
        <button type="button" onClick={handlePrevMonth} className={navBtnClass} aria-label="Previous Month">
          <ChevronLeft className={isInline ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
        <div className={monthLabelClass}>
          {months[month]} {year}
        </div>
        <button type="button" onClick={handleNextMonth} className={navBtnClass} aria-label="Next Month">
          <ChevronRight className={isInline ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
      </div>

      <div className={weekHeaderClass}>
        {daysOfWeek.map((day) => (
          <div key={day} className={isInline ? 'py-1.5' : 'py-2'}>
            {day}
          </div>
        ))}
      </div>

      <div
        role="group"
        aria-label={language === 'en' ? 'Calendar days' : 'Hari kalender'}
        data-testid="date-picker-grid"
        onKeyDown={handleGridKeyDown}
        className="grid grid-cols-7 gap-1"
      >
        {daysGrid}
      </div>
    </>
  );

  // Desktop: in-flow dark panel rendered directly beneath the trigger button.
  // Escape closes only the calendar (stopPropagation keeps the dialog open).
  if (variant === 'inline') {
    if (!open) return null;
    return (
      <div
        data-testid="date-picker-inline"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            onClose();
          }
        }}
        className="mt-2 space-y-3 rounded-2xl border border-border bg-background p-4 shadow-lg"
      >
        {calendarBody}
      </div>
    );
  }

  // Default: mobile bottom sheet (unchanged behaviour for existing consumers).
  return (
    <Sheet open={open} onClose={onClose} title={title || (language === 'en' ? 'Select Date' : 'Pilih Tanggal')}>
      <div className="space-y-4 pb-2">{calendarBody}</div>
    </Sheet>
  );
}