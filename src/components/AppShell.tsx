import { type ReactNode } from 'react';
import { Home, ArrowLeftRight, PiggyBank, User, Plus } from 'lucide-react';

export type TabKey = 'home' | 'transactions' | 'budget' | 'profile';

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  onAddClick: () => void;
}

const leftTabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
];

const rightTabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'budget', label: 'Budget', icon: PiggyBank },
  { key: 'profile', label: 'Profile', icon: User },
];

function NavButton({ 
  item, 
  active, 
  onChange 
}: { 
  item: { key: TabKey; label: string; icon: typeof Home }; 
  active: TabKey; 
  onChange: (t: TabKey) => void 
}) {
  const isActive = active === item.key;
  const Icon = item.icon;
  return (
    <button
      onClick={() => onChange(item.key)}
      className="flex-1 flex flex-col items-center gap-1 py-1.5 transition-all duration-150"
    >
       <Icon
         className={`w-6 h-6 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-secondary'}`}
         strokeWidth={isActive ? 2.5 : 2}
       />
       <span className={`text-[10px] font-semibold transition-colors duration-150 ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
         {item.label}
       </span>
    </button>
  );
}

 export function BottomNav({ active, onChange, onAddClick }: BottomNavProps) {
   return (
     <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-secondary safe-bottom">
       <div className="max-w-md mx-auto relative flex items-center justify-between px-2 py-2 h-16">
         
         {/* Left Tabs */}
        <div className="flex-1 flex justify-around items-center">
          {leftTabs.map((item) => (
            <NavButton key={item.key} item={item} active={active} onChange={onChange} />
          ))}
        </div>

        {/* Center FAB */}
         <div className="flex-shrink-0 w-16 flex justify-center -mt-8 relative z-50">
           <button
             onClick={onAddClick}
             className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 border-4 border-surface hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all"
           >
             <Plus className="w-7 h-7" strokeWidth={2.5} />
           </button>
        </div>

        {/* Right Tabs */}
        <div className="flex-1 flex justify-around items-center">
          {rightTabs.map((item) => (
            <NavButton key={item.key} item={item} active={active} onChange={onChange} />
          ))}
        </div>

      </div>
    </nav>
  );
}

interface AppShellProps {
  children: ReactNode;
  showNav: boolean;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onAddClick?: () => void;
}

 export function AppShell({ children, showNav, activeTab, onTabChange, onAddClick }: AppShellProps) {
   return (
     <div className="min-h-screen bg-background flex justify-center">
       <div className="w-full max-w-md min-h-screen bg-surface relative flex flex-col">
         {/* pb-24 to accommodate floating center button */}
         <main className={`flex-1 ${showNav ? 'pb-24' : ''}`}>{children}</main>
        {showNav && <BottomNav active={activeTab} onChange={onTabChange} onAddClick={onAddClick || (() => {})} />}
      </div>
    </div>
  );
}
