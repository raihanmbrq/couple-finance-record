import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Language } from '@/lib/types';
import { t as rawT } from '@/locales/translations';

const LANGUAGE_KEY = 'pf-language';

const VALID_LANGUAGES: Language[] = ['id', 'en'];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function initialLanguage(userLanguage?: Language | null): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  if (stored && VALID_LANGUAGES.includes(stored)) return stored;
  if (userLanguage && VALID_LANGUAGES.includes(userLanguage)) return userLanguage;
  return 'id';
}

interface LanguageProviderProps {
  children: ReactNode;
  userLanguage?: Language | null;
}

export function LanguageProvider({ children, userLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => initialLanguage(userLanguage));

  useEffect(() => {
    if (userLanguage && !localStorage.getItem(LANGUAGE_KEY) && userLanguage !== language) {
      setLanguageState(userLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLanguage]);

  const persist = useCallback(async (lang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    const { data } = await supabase.auth.getUser();
    const profileId = data?.user?.id;
    if (!profileId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', profileId);
    if (error) console.error('Gagal simpan preferensi bahasa ke Supabase:', error.message);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persist(lang);
  }, [persist]);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: useCallback((key: string, params?: Record<string, string | number>) => rawT(language, key, params), [language]),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage harus dipakai di dalam LanguageProvider');
  return ctx;
}