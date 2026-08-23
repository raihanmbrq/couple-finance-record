import { Sheet } from '@/components/ui/Sheet';
import { Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  section?: string;
}

interface CustomSelectSheetProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
  title: string;
}

export function CustomSelectSheet({ options, value, onChange, open, onClose, title }: CustomSelectSheetProps) {
  const handleSelect = (val: string) => {
    onChange(val);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-1 pb-3 max-h-[60vh] overflow-y-auto no-scrollbar">
        {options.map((opt, i) => {
          const isSelected = opt.value === value;
          const showSection = Boolean(opt.section) && (i === 0 || options[i - 1]?.section !== opt.section);
          return (
            <div key={opt.value}>
              {showSection && (
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {opt.section}
                </p>
              )}
              <button
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all text-left touch-manipulation min-h-[48px] ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-secondary/40 text-text-primary font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {opt.icon && <span className="flex items-center justify-center shrink-0">{opt.icon}</span>}
                  <span className="text-sm truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {opt.badge}
                  {isSelected && <Check className="w-5 h-5 text-primary stroke-[3px]" />}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}