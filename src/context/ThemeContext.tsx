import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { ThemeId } from '@/lib/types';

const STORAGE_KEY = 'pf-theme';

const VALID_THEMES: ThemeId[] = ['system', 'default', 'emerald', 'rose', 'dark'];

const RESOLVED_THEME_ATTR: Record<ThemeId, 'light' | 'dark'> = {
  system: 'light',
  default: 'light',
  emerald: 'light',
  rose: 'light',
  dark: 'dark',
};

const THEME_ATTRIBUTE: Record<ThemeId, string> = {
  system: 'system',
  default: 'default',
  emerald: 'emerald',
  rose: 'rose',
  dark: 'dark',
};

const THEME_COLORS: Record<ThemeId, { light: string; dark: string }> = {
  system: { light: '#F8F6F3', dark: '#0F172A' },
  default: { light: '#FFFDF5', dark: '#FFFDF5' },
  emerald: { light: '#F0FDF4', dark: '#F0FDF4' },
  rose: { light: '#FFF1F2', dark: '#FFF1F2' },
  dark: { light: '#0F172A', dark: '#0F172A' },
};

interface ThemeContextValue {
  theme: ThemeId;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeId) => void;
  themeColor: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initialTheme(userTheme?: ThemeId | null): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  if (stored && VALID_THEMES.includes(stored)) return stored;
  if (userTheme && VALID_THEMES.includes(userTheme)) return userTheme;
  return 'default';
}

export function ThemeProvider({ children, userTheme }: { children: ReactNode; userTheme?: ThemeId | null }) {
  const [theme, setThemeState] = useState<ThemeId>(() => initialTheme(userTheme));
  const userProfileThemeRef = useRef(userTheme ?? null);
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  // Track profil dari Supabase; tanpa override bila user sudah pilih manual di localStorage
  useEffect(() => {
    userProfileThemeRef.current = userTheme ?? null;
    if (userTheme && !localStorage.getItem(STORAGE_KEY) && userTheme !== theme) {
      setThemeState(userTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTheme]);

  // Watch OS color scheme (efektif saat theme === 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply data-theme + meta theme-color
  useEffect(() => {
    document.documentElement.dataset.theme = THEME_ATTRIBUTE[theme];
    setSystemDark(getSystemDark());

    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : RESOLVED_THEME_ATTR[theme];
    const color = THEME_COLORS[theme][resolved];
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [theme, systemDark]);

  const persist = useCallback(async (t: ThemeId) => {
    localStorage.setItem(STORAGE_KEY, t);
    const { data } = await supabase.auth.getUser();
    const profileId = data?.user?.id ?? userProfileThemeRef.current;
    if (!profileId) return;
    const { error } = await supabase.from('profiles').update({ theme: t }).eq('id', profileId);
    if (error) console.error('Gagal simpan tema ke Supabase:', error.message);
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    persist(t);
  }, [persist]);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : RESOLVED_THEME_ATTR[theme];

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    themeColor: THEME_COLORS[theme][resolvedTheme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return ctx;
}