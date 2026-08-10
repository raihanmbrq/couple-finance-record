import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { getCurrencyInfo } from '@/lib/currencies';
import {
  ChevronRight,
  ChevronLeft,
  Wallet2,
  Receipt,
  Coins,
  Palette,
  Languages,
} from 'lucide-react';
import { WalletTypeSettingsSheet } from '@/components/WalletTypeSettingsSheet';
import { CategorySettingsSheet } from '@/components/CategorySettingsSheet';
import { CurrencySettingsSheet } from '@/components/CurrencySettingsSheet';
import { ThemeSettingsSheet, getAppearanceLabel, getPresetLabel } from '@/components/ThemeSettingsSheet';
import { LanguageSettingsSheet } from '@/components/LanguageSettingsSheet';
import { ExportReportSheet } from '@/components/ExportReportSheet';

interface SettingsScreenProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsScreen({ open, onClose }: SettingsScreenProps) {
  const { language, t } = useLanguage();
  const { appearanceMode, colorPreset } = useTheme();
  const { profile } = useApp();
  
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 250);
  }, [onClose]);

  useBackHandler(open, handleClose);
  const [showWalletTypes, setShowWalletTypes] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showExportReport, setShowExportReport] = useState(false);

  if (!open && !isExiting) return null;

  const activeCurrency = profile?.currency ?? 'IDR';
  const activeCurrencyInfo = getCurrencyInfo(activeCurrency);

  return createPortal(
    <div className="fixed inset-0 z-[55] bg-black/15 backdrop-blur-sm pointer-events-auto">
      <div className="absolute inset-0" onClick={handleClose} />
      
      <div
        className={`fixed inset-y-0 left-0 right-0 mx-auto w-full max-w-md bg-background flex flex-col shadow-float ${
          isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
      >
        <header className="px-4 h-16 border-b border-border/10 flex items-center justify-between bg-surface shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -ml-2 rounded-xl text-text-secondary hover:bg-text-secondary/5 transition-colors"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-lg text-text-primary">{t('profile.settings')}</h1>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {/* 1. Kelola Tipe Wallet */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowWalletTypes(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('profile.manageWalletTypes')}</p>
                <p className="text-xs text-text-secondary">{t('profile.manageWalletTypesDesc')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
            </button>
          </Card>

          {/* 2. Laporan Keuangan */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowExportReport(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('profile.exportReport')}</p>
                <p className="text-xs text-text-secondary">{t('profile.exportReportDesc')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
            </button>
          </Card>

          {/* 3. Kelola Kategori */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowCategories(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('profile.manageCategories')}</p>
                <p className="text-xs text-text-secondary">{t('profile.manageCategoriesDesc')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
            </button>
          </Card>

          {/* 4. Mata Uang / Currency */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowCurrency(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('currency.manage')}</p>
                <p className="text-xs text-text-secondary">{t('currency.desc')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-semibold text-text-primary">
                  {activeCurrency} ({activeCurrencyInfo.symbol})
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </button>
          </Card>

          {/* 5. Tema Aplikasi */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowTheme(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('theme.manage')}</p>
                <p className="text-xs text-text-secondary">{t('theme.desc')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-semibold text-text-primary text-right max-w-[120px] truncate">
                  {t(getAppearanceLabel(appearanceMode))} · {t(getPresetLabel(colorPreset))}
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </button>
          </Card>

          {/* 6. Bahasa */}
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setShowLanguage(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Languages className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-text-primary">{t('language.manage')}</p>
                <p className="text-xs text-text-secondary">{t('language.desc')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-semibold text-text-primary">
                  {t(language === 'id' ? 'language.id' : 'language.en')}
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </button>
          </Card>
        </div>

        <WalletTypeSettingsSheet open={showWalletTypes} onClose={() => setShowWalletTypes(false)} />
        <CategorySettingsSheet open={showCategories} onClose={() => setShowCategories(false)} />
        <CurrencySettingsSheet open={showCurrency} onClose={() => setShowCurrency(false)} />
        <ThemeSettingsSheet open={showTheme} onClose={() => setShowTheme(false)} />
        <LanguageSettingsSheet open={showLanguage} onClose={() => setShowLanguage(false)} />
        <ExportReportSheet open={showExportReport} onClose={() => setShowExportReport(false)} />
      </div>
    </div>,
    document.body
  );
}
