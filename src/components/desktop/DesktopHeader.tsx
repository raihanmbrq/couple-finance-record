import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  User, 
  LogOut, 
  Globe, 
  Palette, 
  ChevronDown,
  Users,
  ShieldCheck,
  Search
} from 'lucide-react';
import type { ColorPreset } from '@/lib/types';

interface DesktopHeaderProps {
  onOpenAddTransaction: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  onOpenAddTransaction,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const { profile, household, householdMembers, signOut, isDemo } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { colorPreset, setColorPreset } = useTheme();

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('pairflow_privacy_hide_balance') === 'true';
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pairflow_privacy_hide_balance', String(hideBalance));
    // Dispatch custom event for real-time balance privacy update across widgets
    window.dispatchEvent(new Event('pairflow_privacy_change'));
  }, [hideBalance]);

  const colorPresets: { key: ColorPreset; label: string; bgClass: string }[] = [
    { key: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-500' },
    { key: 'gold', label: 'Gold', bgClass: 'bg-amber-500' },
    { key: 'rose', label: 'Rose', bgClass: 'bg-rose-500' },
    { key: 'slate', label: 'Slate', bgClass: 'bg-slate-500' },
  ];

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Household Indicator & Member Avatar Stack */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-surface-hover/80 px-3.5 py-1.5 rounded-xl border border-border/60">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-medium">
              {isDemo ? 'Demo Household' : (household?.name || 'My Household')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-text-primary">
                {household?.mode === 'couple' ? 'Couple Mode' : 'Single Mode'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-medium uppercase">
                {profile?.role || 'Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Member Stack */}
        {householdMembers && householdMembers.length > 0 && (
          <div className="flex items-center -space-x-2 overflow-hidden pl-2" data-testid="household-member-stack">
            {householdMembers.map((m, idx) => (
              <div 
                key={m.id || idx}
                title={`${m.profile?.full_name || 'Member'} (${m.profile?.role || m.role})`}
                className="w-8 h-8 rounded-full border-2 border-surface bg-surface-hover flex items-center justify-center text-xs font-semibold text-text-primary shadow-xs overflow-hidden"
              >
                {m.profile?.avatar_url ? (
                  <img src={m.profile.avatar_url} alt="Member avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(m.profile?.full_name || 'M')[0]?.toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Privacy Balance Toggle */}
        <button
          onClick={() => setHideBalance(!hideBalance)}
          data-testid="privacy-toggle-btn"
          title={hideBalance ? "Show Balances" : "Hide Balances"}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            hideBalance 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-surface-hover border-border text-text-muted hover:text-text-primary'
          }`}
        >
          {hideBalance ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>{t('header.showBalance') || 'Show Balance'}</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>{t('header.hideBalance') || 'Hide Balance'}</span>
            </>
          )}
        </button>

        {/* Quick Actions Command Palette trigger (⌘K / Ctrl K) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            data-testid="open-command-palette-btn"
            title="Search & quick actions (Ctrl/⌘ + K)"
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="hidden lg:inline">{t('palette.hint') || 'Quick actions & navigation'}</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-bold">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          data-testid="add-transaction-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-text font-medium text-sm hover:opacity-95 shadow-sm active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('header.addTransaction') || 'Add Transaction'}</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            data-testid="profile-dropdown-btn"
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(profile?.full_name || 'U')[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm font-medium text-text-primary max-w-[120px] truncate hidden md:inline">
              {profile?.full_name || 'User'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {/* Profile Popover Menu */}
          {profileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setProfileDropdownOpen(false)} 
              />
              <div 
                data-testid="profile-dropdown-menu"
                className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl z-40 p-2 text-sm divide-y divide-border/60"
              >
                {/* Profile Header */}
                <div className="p-3">
                  <p className="font-semibold text-text-primary truncate">{profile?.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{profile?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-accent font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="capitalize">{profile?.role || 'Member'} Role</span>
                  </div>
                </div>

                {/* Settings Quick Controls */}
                <div className="py-2 px-1 space-y-2">
                  {/* Language Switch */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{t('language.manage') || 'Language'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-hover p-0.5 rounded-lg border border-border">
                      <button
                        onClick={() => setLanguage('id')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          language === 'id' ? 'bg-accent text-accent-text' : 'text-text-muted'
                        }`}
                      >
                        ID
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          language === 'en' ? 'bg-accent text-accent-text' : 'text-text-muted'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* Theme Presets */}
                  {/* <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Palette className="w-3.5 h-3.5" />
                      <span>{t('theme') || 'Theme Accent'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {colorPresets.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setColorPreset(p.key)}
                          title={p.label}
                          className={`w-4 h-4 rounded-full ${p.bgClass} ${
                            colorPreset === p.key ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div> */}
                </div>

                {/* Open Full Settings & Sign Out */}
                <div className="pt-2 px-1 space-y-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-text-muted" />
                    <span>{t('profileMenu.manage') || 'Manage Account & Preferences'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    data-testid="sign-out-btn"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('profile.signOut') || 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

