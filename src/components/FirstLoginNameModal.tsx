import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles } from 'lucide-react';

/**
 * One-time "Adjust Nama Lengkap" popup shown right after the very first login
 * of an invited user (`profiles.is_first_login = true`). It is pre-filled with
 * the name derived from the email prefix. Saving OR closing clears the flag so
 * it never shows again.
 */
export function FirstLoginNameModal() {
  const { profile, completeFirstLogin } = useApp();
  const { t } = useLanguage();

  const open = Boolean(profile?.is_first_login);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFullName(profile?.full_name ?? '');
  }, [open, profile?.full_name]);

  if (!profile) return null;

  const persists = async () => {
    setSaving(true);
    try {
      await completeFirstLogin(fullName);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await persists();
  };

  return (
    <Sheet open={open} onClose={persists} title={t('firstLogin.title')}>
      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{t('firstLogin.subtitle')}</p>
        </div>

        <Input
          label={t('firstLogin.nameLabel')}
          placeholder={t('firstLogin.namePlaceholder')}
          value={fullName}
          autoFocus
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" fullWidth disabled={saving || !fullName.trim()}>
            {saving ? t('login.pleaseWait') : t('firstLogin.save')}
          </Button>
          <button
            type="button"
            onClick={persists}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-secondary transition-colors disabled:opacity-60"
          >
            {t('firstLogin.skip')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

export default FirstLoginNameModal;
