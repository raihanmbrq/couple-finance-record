import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Check } from 'lucide-react';
import type { ThemeId } from '@/lib/types';

interface ThemeOption {
  id: ThemeId;
  label: string;
  desc: string;
  swatch: { bg: string; primary: string };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'System Default',
    desc: 'Ikuti mode terang/gelap perangkat',
    swatch: { bg: '#FFFDF5', primary: '#F59E0B' },
  },
  {
    id: 'default',
    label: 'Default (Amber Gold)',
    desc: 'Tema bawaan PairFlow',
    swatch: { bg: '#FFFDF5', primary: '#F59E0B' },
  },
  {
    id: 'emerald',
    label: 'Emerald Green',
    desc: 'Nuansa dompet & keuangan',
    swatch: { bg: '#F0FDF4', primary: '#10B981' },
  },
  {
    id: 'rose',
    label: 'Rose Pink',
    desc: 'Hangat & romantis',
    swatch: { bg: '#FFF1F2', primary: '#FB7185' },
  },
  {
    id: 'dark',
    label: 'Midnight Dark',
    desc: 'Mode gelap elegan',
    swatch: { bg: '#0F172A', primary: '#38BDF8' },
  },
];

export function getThemeLabel(id: ThemeId): string {
  return THEME_OPTIONS.find((t) => t.id === id)?.label ?? 'System Default';
}

interface ThemeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettingsSheet({ open, onClose }: ThemeSettingsSheetProps) {
  const { theme, setTheme } = useTheme();
  const { updateThemeLocal } = useApp();

  const handleSelect = (id: ThemeId) => {
    if (id === theme) {
      onClose();
      return;
    }
    setTheme(id);
    updateThemeLocal(id);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Pilih Tema">
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-5 px-5 py-3 space-y-1">
          {THEME_OPTIONS.map((t) => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border-2 ${
                  isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary'
                }`}
              >
                <span className="flex items-center shrink-0">
                  <span
                    className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center"
                    style={{ backgroundColor: t.swatch.bg }}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.swatch.primary }} />
                  </span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block font-semibold text-sm ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                    {t.label}
                  </span>
                  <span className="block text-xs text-text-secondary truncate">{t.desc}</span>
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