import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, BadgeCheck, Lock, Mail, UserCheck } from 'lucide-react';

interface InviteLocationState {
  token?: string;
  email?: string;
}

/**
 * Invited auto signup: only Email + Password. The email MUST match the one the
 * token is bound to (validated here for UX and re-validated + consumed by the
 * server-side `auth.users` trigger).
 */
export function InvitedSignupScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { verifyInvitationToken, registerWithInvitation, loading } = useApp();

  const state = (location.state ?? {}) as InviteLocationState;
  const tokenFromState = state.token ?? searchParams.get('token') ?? '';
  const emailFromState = state.email ?? '';

  const [token] = useState(tokenFromState);
  const [lockedEmail, setLockedEmail] = useState(emailFromState);
  const [email, setEmail] = useState(emailFromState);
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [checking, setChecking] = useState(!emailFromState);

  // Direct visits (no state, e.g. shared link) re-verify the token server-side.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      navigate('/invite', { replace: true });
      return;
    }
    if (emailFromState) return;

    (async () => {
      try {
        const boundEmail = await verifyInvitationToken(token);
        if (cancelled) return;
        if (!boundEmail) {
          navigate('/invite', { replace: true });
          return;
        }
        setLockedEmail(boundEmail);
        setEmail(boundEmail);
      } catch {
        if (!cancelled) navigate('/invite', { replace: true });
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, emailFromState, verifyInvitationToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError(t('login.fillAll'));
      return;
    }
    if (lockedEmail && email.trim().toLowerCase() !== lockedEmail.trim().toLowerCase()) {
      setLocalError(t('invite.emailMismatch'));
      return;
    }
    if (password.length < 6) {
      setLocalError(t('invite.passwordTooShort'));
      return;
    }
    try {
      await registerWithInvitation(token, email, password);
      navigate('/app', { replace: true });
    } catch {
      // Error is surfaced through the context `error` state.
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center px-6">
        <div className="text-sm text-text-secondary">{t('invite.verifying')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col justify-center px-6 py-10 relative">
      <button
        type="button"
        onClick={() => navigate('/invite', { replace: true })}
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-card mb-4">
          <UserCheck className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-text-primary mb-1">{t('invite.signupTitle')}</h1>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">{t('invite.signupSubtitle')}</p>
      </div>

      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-primary font-semibold">
          <BadgeCheck className="w-4 h-4" />
          <span>{t('invite.tokenVerified')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('login.email')}
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            readOnly={Boolean(lockedEmail)}
            onChange={(e) => setEmail(e.target.value)}
            className={lockedEmail ? 'opacity-80 cursor-not-allowed' : ''}
          />

          <Input
            label={t('login.password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="text-[11px] text-text-secondary/80 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            {t('invite.emailLockedNote')}
          </p>

          {localError && (
            <div className="text-sm text-expense bg-expense/10 border border-expense/20 rounded-lg px-3 py-2">
              {localError}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('login.pleaseWait') : t('invite.createAccount')}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-text-secondary/80">
          <Mail className="w-3.5 h-3.5" />
          <span>{t('invite.autoNameNote')}</span>
        </div>
      </div>
    </div>
  );
}

export default InvitedSignupScreen;
