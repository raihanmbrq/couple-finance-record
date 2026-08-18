import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CustomMonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
}

export function CustomMonthPicker({ value, onChange, open, onClose }: CustomMonthPickerProps) {
  const { language } = useLanguage();
  const [currentYear, setCurrentYear] = useState(() => {
    const parts = value.split('-');
    return parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
  });

  const selectedMonth = value.split('-')[1] ? parseInt(value.split('-')[1], 10) - 1 : new Date().getMonth();

  const idMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const months = language === 'en' ? enMonths : idMonths;

  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  const handleSelectMonth = (monthIdx: number) => {
    const mm = String(monthIdx + 1).padStart(2, '0');
    onChange(`${currentYear}-${mm}`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={language === 'en' ? 'Select Month' : 'Pilih Bulan'}>
      <div className="space-y-4 pb-2">
        <div className="flex items-center justify-between px-2 py-1 bg-secondary/40 rounded-xl">
          <button
            onClick={handlePrevYear}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Previous Year"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-base text-text-primary">
            <Calendar className="w-4.5 h-4.5 text-primary" />
            <span>{currentYear}</span>
          </div>
          <button
            onClick={handleNextYear}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all text-text-primary"
            aria-label="Next Year"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {months.map((monthName, idx) => {
            const isSelected = currentYear === parseInt(value.split('-')[0], 10) && idx === selectedMonth;
            return (
              <button
                key={monthName}
                onClick={() => handleSelectMonth(idx)}
                className={`py-3.5 rounded-xl font-medium text-sm transition-all border-2 text-center touch-manipulation min-h-[48px] flex items-center justify-center ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-soft'
                    : 'bg-secondary/40 text-text-primary border-transparent hover:bg-secondary'
                }`}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}