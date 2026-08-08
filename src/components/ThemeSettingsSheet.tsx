import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Check, Sun, Moon, Smartphone } from 'lucide-react';
import type { AppearanceMode, ColorPreset } from '@/lib/types';

interface AppearanceOption {
  id: AppearanceMode;
  labelKey: string;
  icon: typeof Sun;
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { id: 'light', labelKey: 'theme.light', icon: Sun },
  { id: 'dark', labelKey: 'theme.dark', icon: Moon },
  { id: 'system', labelKey: 'theme.system', icon: Smartphone },
];

interface PresetOption {
  id: ColorPreset;
  labelKey: string;
  descKey: string;
  swatch: { bg: string; primary: string };
}

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'emerald',
    labelKey: 'theme.preset.emerald',
    descKey: 'theme.preset.emeraldDesc',
    swatch: { bg: '#F8FAFC', primary: '#10B981' },
  },
  {
    id: 'gold',
    labelKey: 'theme.preset.gold',
    descKey: 'theme.preset.goldDesc',
    swatch: { bg: '#F8FAFC', primary: '#F59E0B' },
  },
  {
    id: 'rose',
    labelKey: 'theme.preset.rose',
    descKey: 'theme.preset.roseDesc',
    swatch: { bg: '#F8FAFC', primary: '#FB7185' },
  },
  {
    id: 'slate',
    labelKey: 'theme.preset.slate',
    descKey: 'theme.preset.slateDesc',
    swatch: { bg: '#F8FAFC', primary: '#3B82F6' },
  },
];

export function getAppearanceLabel(mode: AppearanceMode): string {
  const labels: Record<AppearanceMode, string> = {
    light: 'theme.light',
    dark: 'theme.dark',
    system: 'theme.system',
  };
  return labels[mode];
}

export function getPresetLabel(preset: ColorPreset): string {
  const labels: Record<ColorPreset, string> = {
    emerald: 'theme.preset.emerald',
    gold: 'theme.preset.gold',
    rose: 'theme.preset.rose',
    slate: 'theme.preset.slate',
  };
  return labels[preset];
}

interface ThemeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettingsSheet({ open, onClose }: ThemeSettingsSheetProps) {
  const { appearanceMode, colorPreset, setAppearanceMode, setColorPreset } = useTheme();
  const { t } = useLanguage();

  return (
    <Sheet open={open} onClose={onClose} title={t('theme.title')}>
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-5 px-5 py-3 space-y-6">
          {/* SECTION 1: Mode Tampilan */}
          <section>
            <h3 className="text-sm font-bold text-text-primary mb-2">{t('theme.displayMode')}</h3>
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
                      {t(opt.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: Warna Tema */}
          <section>
            <h3 className="text-sm font-bold text-text-primary mb-2">{t('theme.colorTheme')}</h3>
            <div className="space-y-1">
              {PRESET_OPTIONS.map((preset) => {
                const isActive = preset.id === colorPreset;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setColorPreset(preset.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border-2 ${
                      isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary'
                    }`}
                  >
                    <span className="flex items-center shrink-0">
                      <span
                        className="w-6 h-6 rounded-full border border-secondary flex items-center justify-center"
                        style={{ backgroundColor: preset.swatch.bg }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.swatch.primary }} />
                      </span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block font-semibold text-sm ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                        {t(preset.labelKey)}
                      </span>
                      <span className="block text-xs text-text-secondary truncate">{t(preset.descKey)}</span>
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