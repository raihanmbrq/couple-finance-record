import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { CURRENCIES } from '@/lib/currencies';
import { X, User, Palette, Globe, DollarSign, Users, Copy, Check, Sun, Moon, Laptop } from 'lucide-react';
import type { AppearanceMode, ColorPreset } from '@/lib/types';

interface SettingsSubPanelProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsSubPanel: React.FC<SettingsSubPanelProps> = ({ open, onClose }) => {
  const { profile, household, updateProfile, updateCurrency } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { appearanceMode, setAppearanceMode, colorPreset, setColorPreset } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [role, setRole] = useState(profile?.role || 'member');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ full_name: fullName, role: role as any });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInvite = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const colorPresets: { key: ColorPreset; label: string; bgClass: string }[] = [
    { key: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-500' },
    { key: 'gold', label: 'Gold', bgClass: 'bg-amber-500' },
    { key: 'rose', label: 'Rose', bgClass: 'bg-rose-500' },
    { key: 'slate', label: 'Slate', bgClass: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Side Drawer Panel */}
      <div 
        data-testid="settings-sub-panel"
        className="relative w-full max-w-md bg-surface border-l border-border h-full shadow-2xl z-10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-text-primary">{t('profile_settings') || 'Settings & Preferences'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4 bg-surface-hover/50 p-4 rounded-2xl border border-border/60">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Details</h3>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-settings-fullname"
                className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Household Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                data-testid="select-settings-role"
                className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="suami">Suami</option>
                <option value="istri">Istri</option>
                <option value="partner">Partner</option>
                <option value="single">Single</option>
                <option value="owner">Owner</option>
                <option value="member">Member</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              data-testid="save-profile-btn"
              className="w-full py-2 rounded-xl bg-accent text-accent-text font-medium text-xs hover:opacity-90 transition-opacity"
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Currency Preference */}
          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Currency Bound</h3>
            </div>
            <select
              value={profile?.currency || 'IDR'}
              onChange={(e) => updateCurrency(e.target.value)}
              data-testid="select-currency"
              className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Appearance & Color Themes */}
          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Appearance & Theme</h3>
            </div>

            {/* Mode: Light, Dark, System */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-2">Display Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'light' as AppearanceMode, label: 'Light', icon: Sun },
                  { mode: 'dark' as AppearanceMode, label: 'Dark', icon: Moon },
                  { mode: 'system' as AppearanceMode, label: 'System', icon: Laptop },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setAppearanceMode(mode)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      appearanceMode === mode
                        ? 'bg-accent text-accent-text border-accent'
                        : 'bg-surface border-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Presets */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-2">Color Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setColorPreset(p.key)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                      colorPreset === p.key
                        ? 'bg-surface-hover border-accent text-text-primary font-bold'
                        : 'bg-surface border-border text-text-muted'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${p.bgClass}`} />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Household Info & Invite Code */}
          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Household Invitation</h3>
            </div>
            <div className="flex items-center justify-between bg-surface px-3.5 py-2.5 rounded-xl border border-border">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-medium">Invite Code</span>
                <span className="text-base font-mono font-bold tracking-widest text-text-primary">
                  {household?.invite_code || 'N/A'}
                </span>
              </div>
              <button
                onClick={handleCopyInvite}
                data-testid="copy-invite-code-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 text-xs font-medium transition-colors"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

