import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppearanceMode, ColorPreset } from '@/lib/types';

const APPEARANCE_KEY = 'pf-appearance';
const PRESET_KEY = 'pf-color-preset';

const VALID_APPEARANCE: AppearanceMode[] = ['light', 'dark', 'system'];
const VALID_PRESETS: ColorPreset[] = ['emerald', 'gold', 'rose', 'slate'];

// HEX --bg-app per preset, per resolved mode (untuk <meta theme-color>).
const THEME_BG: Record<ColorPreset, { light: string; dark: string }> = {
  emerald: { light: '#F8FAFC', dark: '#022C22' },
  gold: { light: '#F8FAFC', dark: '#0F172A' },
  rose: { light: '#F8FAFC', dark: '#4C0519' },
  slate: { light: '#F8FAFC', dark: '#090D16' },
};

interface ThemeContextValue {
  appearanceMode: AppearanceMode;
  colorPreset: ColorPreset;
  resolvedTheme: 'light' | 'dark';
  setAppearanceMode: (mode: AppearanceMode) => void;
  setColorPreset: (preset: ColorPreset) => void;
  themeColor: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initialAppearance(userAppearance?: AppearanceMode | null): AppearanceMode {
  const stored = localStorage.getItem(APPEARANCE_KEY) as AppearanceMode | null;
  if (stored && VALID_APPEARANCE.includes(stored)) return stored;
  if (userAppearance && VALID_APPEARANCE.includes(userAppearance)) return userAppearance;
  return 'system';
}

function initialPreset(userPreset?: ColorPreset | null): ColorPreset {
  const stored = localStorage.getItem(PRESET_KEY) as ColorPreset | null;
  if (stored && VALID_PRESETS.includes(stored)) return stored;
  if (userPreset && VALID_PRESETS.includes(userPreset)) return userPreset;
  return 'emerald';
}

interface ThemeProviderProps {
  children: ReactNode;
  userAppearance?: AppearanceMode | null;
  userPreset?: ColorPreset | null;
}

export function ThemeProvider({ children, userAppearance, userPreset }: ThemeProviderProps) {
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(() => initialAppearance(userAppearance));
  const [colorPreset, setColorPresetState] = useState<ColorPreset>(() => initialPreset(userPreset));
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  // Track preferensi dari Supabase; tanpa override bila user sudah pilih manual di localStorage
  useEffect(() => {
    if (userAppearance && !localStorage.getItem(APPEARANCE_KEY) && userAppearance !== appearanceMode) {
      setAppearanceModeState(userAppearance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAppearance]);

  useEffect(() => {
    if (userPreset && !localStorage.getItem(PRESET_KEY) && userPreset !== colorPreset) {
      setColorPresetState(userPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPreset]);

  // Watch OS color scheme real-time (efektif saat appearanceMode === 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply data-mode + data-preset di <html>
  useEffect(() => {
    document.documentElement.dataset.mode = appearanceMode;
    document.documentElement.dataset.preset = colorPreset;
  }, [appearanceMode, colorPreset]);

  const resolvedTheme: 'light' | 'dark' =
    appearanceMode === 'system' ? (systemDark ? 'dark' : 'light') : appearanceMode;

  // Update <meta name="theme-color"> mengikuti --bg-app aktif
  useEffect(() => {
    setSystemDark(getSystemDark());
    const color = THEME_BG[colorPreset][resolvedTheme];
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [colorPreset, resolvedTheme]);

  const persist = useCallback(async (mode: AppearanceMode, preset: ColorPreset) => {
    localStorage.setItem(APPEARANCE_KEY, mode);
    localStorage.setItem(PRESET_KEY, preset);
    const { data } = await supabase.auth.getUser();
    const profileId = data?.user?.id;
    if (!profileId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ appearance_mode: mode, color_preset: preset })
      .eq('id', profileId);
    if (error) console.error('Gagal simpan preferensi tema ke Supabase:', error.message);
  }, []);

  const setAppearanceMode = useCallback((mode: AppearanceMode) => {
    setAppearanceModeState(mode);
    persist(mode, colorPreset);
  }, [persist, colorPreset]);

  const setColorPreset = useCallback((preset: ColorPreset) => {
    setColorPresetState(preset);
    persist(appearanceMode, preset);
  }, [persist, appearanceMode]);

  const value: ThemeContextValue = {
    appearanceMode,
    colorPreset,
    resolvedTheme,
    setAppearanceMode,
    setColorPreset,
    themeColor: THEME_BG[colorPreset][resolvedTheme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return ctx;
}