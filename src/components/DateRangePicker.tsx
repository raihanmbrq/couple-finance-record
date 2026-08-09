import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  onChange: (range: { start: string; end: string }) => void;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  const now = new Date();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());

  const cells: (Date | null)[] = [];
  const total = new Date(vy, vm + 1, 0).getDate();
  for (let i = 0; i < new Date(vy, vm, 1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(vy, vm, d));

  const prev = () => { if (vm === 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); };
  const next = () => { if (vm === 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); };

  const pick = (date: Date) => {
    const key = toKey(date);
    if (!start || (start && end)) {
      onChange({ start: key, end: '' });
      return;
    }
    onChange(key < start ? { start: key, end: start } : { start, end: key });
  };

  const inRange = (key: string) => Boolean(start && end && key >= start && key <= end);

  return (
    <div className="rounded-2xl border border-secondary bg-surface p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="p-1.5 rounded-lg hover:bg-secondary text-text-secondary" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-text-primary">{MONTHS[vm]} {vy}</p>
        <button type="button" onClick={next} className="p-1.5 rounded-lg hover:bg-secondary text-text-secondary" aria-label="Next month">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-text-secondary py-1">{d}</span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const key = toKey(date);
          const sel = key === start || (key === end && key !== start);
          const today = key === toKey(now);
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(date)}
              className={`relative h-8 rounded-lg text-xs font-medium transition-colors ${
                sel
                  ? 'bg-primary text-white font-bold'
                  : inRange(key)
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-primary hover:bg-secondary'
              }`}
            >
              {date.getDate()}
              {today && !sel && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}