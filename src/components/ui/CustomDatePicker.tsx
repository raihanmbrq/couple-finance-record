import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function CustomDatePicker({ value, onChange, open, onClose, title }: CustomDatePickerProps) {
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

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

  const handleSelectDay = (day: number) => {
    const formattedY = String(year);
    const formattedM = String(month + 1).padStart(2, '0');
    const formattedD = String(day).padStart(2, '0');
    onChange(`${formattedY}-${formattedM}-${formattedD}`);
    onClose();
  };

  const daysGrid: JSX.Element[] = [];

  // Empty cells or prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    daysGrid.push(
      <div key={`prev-${d}`} className="h-11 flex items-center justify-center text-text-secondary/40 text-sm font-medium">
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

    daysGrid.push(
      <button
        key={`day-${d}`}
        onClick={() => handleSelectDay(d)}
        className={`h-11 w-full flex items-center justify-center rounded-xl text-sm font-semibold transition-all border-2 touch-manipulation ${
          isSelected
            ? 'bg-primary text-white border-primary shadow-soft'
            : isToday
            ? 'bg-secondary/60 text-primary border-primary/20'
            : 'bg-transparent text-text-primary border-transparent hover:bg-secondary/40'
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title={title || (language === 'en' ? 'Select Date' : 'Pilih Tanggal')}>
      <div className="space-y-4 pb-2">
        <div className="flex items-center justify-between px-2 py-1 bg-secondary/40 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-base text-text-primary">
            {months[month]} {year}
          </div>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-text-secondary uppercase tracking-wider mb-1">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {daysGrid}
        </div>
      </div>
    </Sheet>
  );
}