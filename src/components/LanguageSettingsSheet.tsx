import { Sheet } from '@/components/ui/Sheet';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/lib/types';

interface LanguageSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

const OPTIONS: { id: Language; code: string; labelKey: string }[] = [
  { id: 'id', code: 'id', labelKey: 'language.id' },
  { id: 'en', code: 'gb', labelKey: 'language.en' },
];

export function LanguageSettingsSheet({ open, onClose }: LanguageSettingsSheetProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Sheet open={open} onClose={onClose} title={t('language.title')}>
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-5 px-5 py-3 space-y-2">
          {OPTIONS.map((opt) => {
            const isActive = opt.id === language;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setLanguage(opt.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition-all border-2 ${
                  isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary'
                }`}
              >
                <FlagIcon code={opt.code} className="w-7 h-7 shrink-0" />
                <span className={`flex-1 font-semibold text-sm ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                  {t(opt.labelKey)}
                </span>
                {isActive && (
                  <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}