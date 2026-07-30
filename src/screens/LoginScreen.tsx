import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Wallet, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export function LoginScreen() {
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
      setLocalError('Please fill in all fields');
      return;
    }
    if (isSignUp && !fullName) {
      setLocalError('Please enter your name');
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cream-50 to-cream-100 flex flex-col justify-center px-6 py-10">
      {/* Logo & Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-teal-700 shadow-card mb-4">
          <Wallet className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-stone-800 mb-1">Duit Bersama</h1>
        <p className="text-sm text-stone-500">Track finances together, effortlessly</p>
      </div>

      {/* Form Card */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex gap-1 p-1 bg-cream-100 rounded-xl">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isSignUp ? 'bg-white text-teal-700 shadow-soft' : 'text-stone-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isSignUp ? 'bg-white text-teal-700 shadow-soft' : 'text-stone-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input
              label="Full Name"
              placeholder="Andi Pratama"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {displayError && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {displayError}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

      </div>

      {/* Demo Button */}
      <button
        onClick={enterDemo}
        className="mt-6 mx-auto flex items-center gap-2 px-5 py-3 rounded-xl text-teal-700 font-semibold border-2 border-teal-200 border-dashed hover:bg-teal-50 active:bg-teal-100 transition-colors"
      >
        <Sparkles className="w-5 h-5" />
        Try Demo Mode
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-xs text-stone-400 mt-6">
        By continuing you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}
