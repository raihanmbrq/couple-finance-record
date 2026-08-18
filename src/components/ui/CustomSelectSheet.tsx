import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
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
  const { language } = useLanguage();

  const handleSelect = (val: string) => {
    onChange(val);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-1 pb-3 max-h-[60vh] overflow-y-auto no-scrollbar">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-left touch-manipulation min-h-[48px] ${
                isSelected
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-secondary/40 text-text-primary font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon && <span className="flex items-center justify-center">{opt.icon}</span>}
                <span className="text-sm">{opt.label}</span>
              </div>
              {isSelected && <Check className="w-5 h-5 text-primary stroke-[3px]" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}