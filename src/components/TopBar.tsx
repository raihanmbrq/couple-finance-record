import { useApp } from '@/context/AppContext';
import { Wallet, Users, User } from 'lucide-react';

export function TopBar() {
  const { profile, household, isDemo } = useApp();

  const isCouple = household?.mode === 'couple';
  const statusText = isCouple
    ? `Connected with ${household?.partner_name ?? 'Partner'}`
    : 'Single Mode';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-stone-200/60 safe-top">
      <div className="px-5 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-stone-800 leading-tight">Duit Bersama</h2>
            {isDemo && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">DEMO</span>
            )}
          </div>
        </div>

        {/* Household Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-100 border border-stone-200/60">
          {isCouple ? (
            <Users className="w-4 h-4 text-teal-600" />
          ) : (
            <User className="w-4 h-4 text-stone-500" />
          )}
          <span className="text-xs font-medium text-stone-600 max-w-[140px] truncate">
            {statusText}
          </span>
        </div>
      </div>
    </header>
  );
}
