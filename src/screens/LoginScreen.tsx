import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Wallet, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const { t } = useLanguage();
  const { signIn, signUp, enterDemo, loading, error } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError(t('login.fillAll'));
      return;
    }
    if (isSignUp && !fullName) {
      setLocalError(t('login.enterName'));
      return;
    }
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch {
      // Error is set in context
    }
  };

  const displayError = localError || error;

   return (
     <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col justify-center px-6 py-10">
       {/* Logo & Header */}
       <div className="text-center mb-10">
         <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-card mb-4">
           <Wallet className="w-10 h-10 text-white" strokeWidth={2.5} />
         </div>
         <h1 className="font-display font-extrabold text-3xl text-text-primary mb-1">PairFlow</h1>
          <p className="text-sm text-text-secondary">{t('login.tagline')}</p>
       </div>
 
       {/* Form Card */}
       <div className="card-elevated p-6 space-y-4">
         <div className="flex gap-1 p-1 bg-secondary rounded-xl">
           <button
             onClick={() => setIsSignUp(false)}
             className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isSignUp ? 'bg-surface text-primary shadow-soft' : 'text-text-secondary'}`}
           >
              {t('login.signIn')}
           </button>
           <button
             onClick={() => setIsSignUp(true)}
             className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isSignUp ? 'bg-surface text-primary shadow-soft' : 'text-text-secondary'}`}
           >
              {t('login.signUp')}
           </button>
         </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input
              label={t('login.fullName')}
              placeholder={t('login.namePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <Input
            label={t('login.email')}
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('login.password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

           {displayError && (
             <div className="text-sm text-expense bg-expense/10 border border-expense/20 rounded-lg px-3 py-2">
               {displayError}
             </div>
           )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('login.pleaseWait') : isSignUp ? t('login.createAccount') : t('login.signIn')}
          </Button>
        </form>

      </div>

       {/* Demo Button */}
       <button
         onClick={enterDemo}
         className="mt-6 mx-auto flex items-center gap-2 px-5 py-3 rounded-xl text-primary font-semibold border-2 border-primary/30 border-dashed hover:bg-primary/10 active:bg-primary/20 transition-colors"
       >
         <Sparkles className="w-5 h-5" />
          {t('login.tryDemo')}
         <ArrowRight className="w-4 h-4" />
       </button>
 
       <p className="text-center text-xs text-text-secondary/80 mt-6">
          {t('login.terms')}
       </p>
    </div>
  );
}
