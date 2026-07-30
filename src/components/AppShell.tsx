import { type ReactNode } from 'react';
import { Home, ArrowLeftRight, PiggyBank, User } from 'lucide-react';

export type TabKey = 'home' | 'transactions' | 'budget' | 'profile';

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'budget', label: 'Budget', icon: PiggyBank },
  { key: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-stone-200/60 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150"
            >
              <Icon
                className={`w-6 h-6 transition-colors duration-150 ${isActive ? 'text-teal-700' : 'text-stone-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-semibold transition-colors duration-150 ${isActive ? 'text-teal-700' : 'text-stone-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface AppShellProps {
  children: ReactNode;
  showNav: boolean;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function AppShell({ children, showNav, activeTab, onTabChange }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cream-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-cream-50 relative flex flex-col">
        <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>{children}</main>
        {showNav && <BottomNav active={activeTab} onChange={onTabChange} />}
      </div>
    </div>
  );
}
