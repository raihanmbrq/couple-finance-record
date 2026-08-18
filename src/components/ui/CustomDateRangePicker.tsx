import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CustomDateRangePickerProps {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onChange: (start: string, end: string) => void;
  open: boolean;
  onClose: () => void;
}

export function CustomDateRangePicker({ startDate, endDate, onChange, open, onClose }: CustomDateRangePickerProps) {
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => {
    return startDate ? new Date(startDate) : new Date();
  });
  const [showYearGrid, setShowYearGrid] = useState(false);

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

  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleSelectDay = (day: number) => {
    const clickedStr = formatDateStr(year, month, day);
    if (!startDate || (startDate && endDate)) {
      // Start a new range
      onChange(clickedStr, '');
    } else {
      // We have startDate but no endDate
      if (clickedStr < startDate) {
        // Clicked date is before current start, so make it the new start
        onChange(clickedStr, '');
      } else {
        // Complete the range
        onChange(startDate, clickedStr);
      }
    }
  };

  const applyPreset = (monthsCount: number) => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const startStr = formatDateStr(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    const end = new Date(baseDate);
    end.setMonth(baseDate.getMonth() + monthsCount);
    const endStr = formatDateStr(end.getFullYear(), end.getMonth(), end.getDate());

    onChange(startStr, endStr);
  };

  const handleCustomChip = () => {
    onChange('', '');
  };

  const chips = [
    { label: language === 'en' ? '1 Month' : '1 Bulan', value: 1 },
    { label: language === 'en' ? '3 Months' : '3 Bulan', value: 3 },
    { label: language === 'en' ? '6 Months' : '6 Bulan', value: 6 },
    { label: language === 'en' ? '1 Year' : '1 Tahun', value: 12 },
    { label: language === 'en' ? '5 Years' : '5 Tahun', value: 60 },
  ];

  const getActivePreset = () => {
    if (!startDate || !endDate) return 'custom';
    const start = new Date(startDate);
    
    for (const c of chips) {
      const expectedEnd = new Date(start);
      expectedEnd.setMonth(start.getMonth() + c.value);
      const expectedEndStr = formatDateStr(expectedEnd.getFullYear(), expectedEnd.getMonth(), expectedEnd.getDate());
      if (expectedEndStr === endDate) {
        return c.value;
      }
    }
    return 'custom';
  };

  const activePreset = getActivePreset();

  const daysGrid: JSX.Element[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    daysGrid.push(
      <div key={`prev-${d}`} className="h-11 flex items-center justify-center text-text-secondary/35 text-xs font-medium">
        {d}
      </div>
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentStr = formatDateStr(year, month, d);
    const isStart = currentStr === startDate;
    const isEnd = currentStr === endDate;
    const inRange = startDate && endDate && currentStr > startDate && currentStr < endDate;

    daysGrid.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => handleSelectDay(d)}
        className={`h-11 w-full flex items-center justify-center rounded-lg text-xs font-semibold transition-all touch-manipulation ${
          isStart || isEnd
            ? 'bg-primary text-white border-2 border-primary shadow-soft'
            : inRange
            ? 'bg-primary/15 text-primary border-2 border-transparent'
            : 'bg-transparent text-text-primary border-2 border-transparent hover:bg-secondary/40'
        }`}
      >
        {d}
      </button>
    );
  }

  // Years grid selector (e.g. 2020 to 2046)
  const startYear = 2020;
  const endYear = 2046;
  const yearsList: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    yearsList.push(y);
  }

  return (
    <Sheet open={open} onClose={onClose} title={language === 'en' ? 'Select Date Range' : 'Pilih Rentang Tanggal'}>
      <div className="space-y-4 pb-3">
        {/* Preset Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => applyPreset(c.value)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all active:scale-95 ${
                activePreset === c.value
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-secondary/50 text-text-primary hover:bg-secondary'
              }`}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCustomChip}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all active:scale-95 ${
              activePreset === 'custom'
                ? 'bg-primary text-white shadow-soft'
                : 'bg-secondary/50 text-text-primary hover:bg-secondary'
            }`}
          >
            {language === 'en' ? 'Custom' : 'Kustom'}
          </button>
        </div>

        {/* Calendar Picker Header */}
        <div className="flex items-center justify-between px-2 py-1 bg-secondary/40 rounded-xl">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-sm text-text-primary flex items-center gap-1">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="shrink-0">{months[month]}</span>
            <button
              type="button"
              onClick={() => setShowYearGrid(!showYearGrid)}
              className={`px-2 py-1 rounded-lg text-sm font-extrabold transition-colors min-h-[36px] flex items-center ${
                showYearGrid ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {year}
            </button>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {showYearGrid ? (
          <div className="grid grid-cols-4 gap-2 py-2 max-h-[260px] overflow-y-auto">
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(y, month, 1));
                  setShowYearGrid(false);
                }}
                className={`py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                  y === year
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-secondary/50 text-text-primary hover:bg-secondary'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-text-secondary uppercase tracking-wider mb-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid}
            </div>
          </>
        )}

        {/* Selected Range Display */}
        <div className="flex items-center justify-between p-3 bg-secondary/35 rounded-xl border border-secondary text-xs">
          <div>
            <span className="text-text-secondary block font-medium uppercase tracking-wider text-[10px]">
              {language === 'en' ? 'Start Date' : 'Tanggal Mulai'}
            </span>
            <span className="text-text-primary font-bold text-sm">
              {startDate || '-'}
            </span>
          </div>
          <div className="w-6 h-px bg-text-secondary/30 mx-2" />
          <div className="text-right">
            <span className="text-text-secondary block font-medium uppercase tracking-wider text-[10px]">
              {language === 'en' ? 'End Date' : 'Tanggal Selesai'}
            </span>
            <span className="text-text-primary font-bold text-sm">
              {endDate || '-'}
            </span>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          disabled={!startDate || !endDate}
          className="w-full btn-primary min-h-[48px] py-3.5 flex items-center justify-center font-bold text-sm shadow-soft rounded-xl transition-all"
        >
          {language === 'en' ? 'Apply Range' : 'Terapkan Rentang'}
        </button>
      </div>
    </Sheet>
  );
}