import { useTheme } from '@/context/ThemeContext';
import { Sheet } from '@/components/ui/Sheet';
import { Check, Sun, Moon, Smartphone } from 'lucide-react';
import type { AppearanceMode, ColorPreset } from '@/lib/types';

interface AppearanceOption {
  id: AppearanceMode;
  label: string;
  icon: typeof Sun;
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System Default', icon: Smartphone },
];

const APPEARANCE_LABELS: Record<AppearanceMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System Default',
};

interface PresetOption {
  id: ColorPreset;
  label: string;
  desc: string;
  swatch: { bg: string; primary: string };
}

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'emerald',
    label: 'Emerald Green',
    desc: 'Nuansa dompet & keuangan',
    swatch: { bg: '#F8FAFC', primary: '#10B981' },
  },
  {
    id: 'gold',
    label: 'Amber Gold',
    desc: 'Hangat & klasik',
    swatch: { bg: '#F8FAFC', primary: '#F59E0B' },
  },
  {
    id: 'rose',
    label: 'Rose Pink',
    desc: 'Hangat & romantis',
    swatch: { bg: '#F8FAFC', primary: '#FB7185' },
  },
  {
    id: 'slate',
    label: 'Ocean Blue',
    desc: 'Tenang & modern',
    swatch: { bg: '#F8FAFC', primary: '#3B82F6' },
  },
];

const PRESET_LABELS: Record<ColorPreset, string> = {
  emerald: 'Emerald Green',
  gold: 'Amber Gold',
  rose: 'Rose Pink',
  slate: 'Ocean Blue',
};

export function getAppearanceLabel(mode: AppearanceMode): string {
  return APPEARANCE_LABELS[mode];
}

export function getPresetLabel(preset: ColorPreset): string {
  return PRESET_LABELS[preset];
}

interface ThemeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettingsSheet({ open, onClose }: ThemeSettingsSheetProps) {
  const { appearanceMode, colorPreset, setAppearanceMode, setColorPreset } = useTheme();

  return (
    <Sheet open={open} onClose={onClose} title="Pilih Tema">
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-5 px-5 py-3 space-y-6">
          {/* SECTION 1: Mode Tampilan */}
          <section>
            <h3 className="text-sm font-bold text-text-primary mb-2">Mode Tampilan</h3>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = opt.id === appearanceMode;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAppearanceMode(opt.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all border-2 ${
                      isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: Warna Tema */}
          <section>
            <h3 className="text-sm font-bold text-text-primary mb-2">Warna Tema</h3>
            <div className="space-y-1">
              {PRESET_OPTIONS.map((t) => {
                const isActive = t.id === colorPreset;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorPreset(t.id)}
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
          </section>
        </div>
      </div>
    </Sheet>
  );
}