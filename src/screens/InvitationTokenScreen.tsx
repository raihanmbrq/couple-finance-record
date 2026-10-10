import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, ArrowRight, KeyRound, Lock, ShieldCheck, Ticket } from 'lucide-react';

/**
 * Public entry point for closed registration. The tester pastes their
 * Invitation Token; it is verified server-side and, when valid, we move on to
 * the email + password form with the bound email pre-resolved.
 */
export function InvitationTokenScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { verifyInvitationToken } = useApp();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fromLink = searchParams.get('token');
    if (fromLink) setToken(fromLink.trim().toUpperCase());
  }, [searchParams]);

  const handleBack = () => navigate('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    const trimmed = token.trim();
    if (!trimmed) {
      setLocalError(t('invite.tokenRequired'));
      return;
    }
    setVerifying(true);
    try {
      const boundEmail = await verifyInvitationToken(trimmed);
      if (!boundEmail) {
        setLocalError(t('invite.invalid'));
        return;
      }
      navigate('/invite/signup', { state: { token: trimmed, email: boundEmail } });
    } catch {
      setLocalError(t('invite.verifyFailed'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col justify-center px-6 py-10 relative">
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('invite.backToLanding')}</span>
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-card mb-4">
          <Ticket className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-text-primary mb-1">{t('invite.title')}</h1>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">{t('invite.subtitle')}</p>
      </div>

      <div className="card-elevated p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('invite.tokenLabel')}
            placeholder={t('invite.tokenPlaceholder')}
            value={token}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            className="text-center text-lg font-bold tracking-[0.3em]"
          />

          {localError && (
            <div className="text-sm text-expense bg-expense/10 border border-expense/20 rounded-lg px-3 py-2">
              {localError}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={verifying}
            className="inline-flex items-center justify-center gap-1.5"
          >
            {verifying ? t('invite.verifying') : t('invite.verify')}
            {!verifying && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-text-secondary/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('invite.closedNote')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="mt-6 mx-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl text-primary font-semibold hover:bg-primary/10 transition-colors"
      >
        <Lock className="w-4 h-4" />
        {t('invite.haveAccount')}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-text-secondary/70">
        <KeyRound className="w-3.5 h-3.5" />
        <span className="text-xs">{t('invite.footer')}</span>
      </div>
    </div>
  );
}

export default InvitationTokenScreen;
