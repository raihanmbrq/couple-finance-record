import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface MonthNavigationPickerProps {
  /** "YYYY-MM" */
  value: string;
  onChange: (value: string) => void;
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Desktop month navigator for the Daily Calendar Activity grid:
 * ‹ prev · [August 2026 ▾] · next › with a popover for arbitrary month/year jumps.
 */
export const MonthNavigationPicker: React.FC<MonthNavigationPickerProps> = ({ value, onChange }) => {
  const { language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const months = language === 'id' ? MONTHS_ID : MONTHS_EN;

  const now = new Date();
  const parts = (value || '').split('-');
  const year = parts[0] ? parseInt(parts[0], 10) : now.getFullYear();
  const monthIndex = parts[1] ? parseInt(parts[1], 10) - 1 : now.getMonth();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [browseYear, setBrowseYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

  const shiftMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    onChange(monthKey(next.getFullYear(), next.getMonth()));
  };

  const longLabel = new Date(year, monthIndex, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1 bg-surface-hover border border-border rounded-xl p-1">
      {/* Previous month */}
      <button
        type="button"
        data-testid="month-selector-prev"
        onClick={() => shiftMonth(-1)}
        aria-label={language === 'id' ? 'Bulan sebelumnya' : 'Previous month'}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Month & Year label button → popover */}
      <button
        type="button"
        onClick={() => {
          setBrowseYear(year);
          setPopoverOpen((v) => !v);
        }}
        data-testid="month-selector-label"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-text-primary hover:bg-surface transition-colors min-w-[118px] justify-center capitalize"
      >
        <Calendar className="w-3.5 h-3.5 text-accent" />
        {longLabel}
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Next month */}
      <button
        type="button"
        data-testid="month-selector-next"
        onClick={() => shiftMonth(1)}
        aria-label={language === 'id' ? 'Bulan berikutnya' : 'Next month'}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Popover: month grid + year arrows */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl p-3 z-50 text-xs animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setBrowseYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-text-primary">{browseYear}</span>
            <button
              type="button"
              onClick={() => setBrowseYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover"
              aria-label="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {months.map((label, idx) => {
              const selected = browseYear === year && idx === monthIndex;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(monthKey(browseYear, idx));
                    setPopoverOpen(false);
                  }}
                  className={`py-2 rounded-lg font-semibold transition-colors capitalize ${
                    selected ? 'bg-accent text-accent-text' : 'text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
