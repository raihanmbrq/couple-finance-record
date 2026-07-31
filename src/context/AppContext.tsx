import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, Household, Wallet, Transaction, Budget } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  mockProfile, mockHousehold, mockWallets, mockTransactions, mockBudgets,
  generateInviteCode,
} from '@/lib/mockData';

type AppMode = 'demo' | 'live';

interface AppState {
  mode: AppMode;
  profile: Profile | null;
  household: Household | null;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  // Onboarding
  setMode: (mode: 'single' | 'couple', partnerName?: string) => Promise<void>;
  createHousehold: (mode: 'single' | 'couple', partnerName?: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  // Wallets
  addWallet: (name: string, type: Wallet['type'], balance: number) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Budgets
  setBudget: (category: string, limitAmount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Demo
  enterDemo: () => void;
  isDemo: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setAppMode] = useState<AppMode>('demo');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Restore demo session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('duitbersama_session');
    if (saved === 'demo') {
      enterDemo();
      return;
    }
    // Check for live Supabase session
    checkLiveSession();
  }, []);

  const checkLiveSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAppMode('live');
        await loadLiveData(session.user.id, session.user.email ?? '');
      }
    } catch {
      // No live session — stay in default state
    }
  }, []);

  const loadLiveData = useCallback(async (userId: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const metaFullName = sessionData.session?.user?.user_metadata?.full_name as string | undefined;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let currentProfile: Profile;
      if (!prof) {
        const newProfile: Profile = {
          id: userId,
          email,
          full_name: metaFullName?.trim() || email.split('@')[0] || 'User',
          role: 'single',
          avatar_url: null,
          household_id: null,
          created_at: new Date().toISOString(),
        };
        const { error: insertErr } = await supabase.from('profiles').insert(newProfile);
        if (insertErr) {
          throw insertErr;
        }
        currentProfile = newProfile;
      } else {
        currentProfile = prof as Profile;
      }
      setProfile(currentProfile);

      let householdId = currentProfile.household_id;
      let householdData: Household | null = null;

      if (householdId) {
        const { data: hh } = await supabase
          .from('households')
          .select('*')
          .eq('id', householdId)
          .maybeSingle();
        householdData = hh as Household | null;
      }

      if (!householdData) {
        setHousehold(null);
        setWallets([]);
        setTransactions([]);
        setBudgets([]);
        return;
      }

      setHousehold(householdData);
      householdId = householdData.id;

      const { data: w } = await supabase
        .from('wallets')
        .select('*')
        .eq('household_id', householdId);
      const walletRows = (w as Wallet[]) ?? [];
      setWallets(walletRows);

      const walletIds = walletRows.map((wallet) => wallet.id);
      let txRows: Transaction[] = [];
      if (walletIds.length > 0) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .in('wallet_id', walletIds)
          .order('transaction_date', { ascending: false });
        txRows = (tx as Transaction[]) ?? [];
      }
      setTransactions(txRows);

      const { data: bg } = await supabase
        .from('budgets')
        .select('*')
        .eq('household_id', householdId);
      setBudgets((bg as Budget[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const enterDemo = useCallback(() => {
    setAppMode('demo');
    setIsDemo(true);
    setProfile(mockProfile);
    setHousehold(mockHousehold);
    setWallets(mockWallets);
    setTransactions(mockTransactions);
    setBudgets(mockBudgets);
    localStorage.setItem('duitbersama_session', 'demo');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setAppMode('live');
      setIsDemo(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadLiveData(session.user.id, session.user.email ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadLiveData]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) {
        throw new Error('Sign up did not return a user record.');
      }

      let finalSession = data.session;
      if (!finalSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        finalSession = signInData.session;
      }

      if (!finalSession) {
        throw new Error('Registration completed, but the app could not start an authenticated session.');
      }

      const profilePayload: Profile = {
        id: user.id,
        email,
        full_name: fullName.trim() || email.split('@')[0] || 'User',
        role: 'single',
        avatar_url: null,
        household_id: null,
        created_at: new Date().toISOString(),
      };

      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileUpsertError) throw profileUpsertError;

      setAppMode('live');
      setIsDemo(false);
      await loadLiveData(user.id, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadLiveData]);

  const signInWithGoogle = useCallback(async () => {
    setError('Google sign-in is not available in this build. Use email/password or try the demo mode.');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return;
    if (mode === 'live') {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
    }
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  }, [mode, profile]);

  const signOut = useCallback(async () => {
    if (mode === 'live') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If signOut failed, still try to clear client-side storage below.
        console.warn('supabase signOut error:', error.message ?? error);
      }
    }
    localStorage.removeItem('duitbersama_session');
    // Remove Supabase/Gotrue-related tokens from localStorage to fully clear session
    try {
      for (const key of Object.keys(localStorage)) {
        const k = String(key);
        if (k.includes('supabase') || k.includes('gotrue') || k.startsWith('sb:') || k.includes('@supabase')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    // Clear auth-related cookies (best-effort).
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      for (const c of cookies) {
        const [name] = c.split('=');
        if (/supabase|sb-|sb:|gotrue|access_token/i.test(name)) {
          document.cookie = `${name}=; Max-Age=0; path=/;`; 
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname};`;
        }
      }
    } catch {}
    setAppMode('demo');
    setIsDemo(false);
    setProfile(null);
    setHousehold(null);
    setWallets([]);
    setTransactions([]);
    setBudgets([]);
  }, [mode]);

  const setMode = useCallback(async (_mode: 'single' | 'couple', _partnerName?: string) => {
    // This is handled by createHousehold/joinHousehold
  }, []);

  const createHousehold = useCallback(async (hhMode: 'single' | 'couple', partnerName?: string): Promise<string> => {
    const code = generateInviteCode();
    const newHousehold: Household = {
      id: crypto.randomUUID(),
      name: hhMode === 'couple'
        ? `${profile?.full_name ?? 'Me'}${partnerName ? ` & ${partnerName}` : ''}`
        : 'My Personal Finance',
      invite_code: code,
      mode: hhMode,
      partner_name: partnerName || null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live' && profile) {
      const householdInsert = await supabase.from('households').insert({
        id: newHousehold.id,
        name: newHousehold.name,
        invite_code: code,
        mode: hhMode,
        partner_name: partnerName ?? null,
      });
      if (householdInsert.error) throw householdInsert.error;

      await supabase.from('profiles').update({ household_id: newHousehold.id, role: hhMode === 'couple' ? 'suami' : 'single' }).eq('id', profile.id);

      setHousehold(newHousehold);
      setProfile({ ...profile, household_id: newHousehold.id, role: hhMode === 'couple' ? 'suami' : 'single' });
      setWallets([]);
      return newHousehold.invite_code;
    }

    // Demo mode
    setHousehold(newHousehold);
    setProfile(prev => prev ? { ...prev, household_id: newHousehold.id, role: hhMode === 'couple' ? 'suami' : 'single' } : prev);
    setWallets([]);
    return code;
  }, [mode, profile]);

  const joinHousehold = useCallback(async (inviteCode: string) => {
    if (mode === 'live' && profile) {
      const { data: hh, error } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .maybeSingle();
      if (error || !hh) throw new Error('Invalid invite code. Please check and try again.');
      await supabase.from('profiles').update({ household_id: hh.id, role: 'istri' }).eq('id', profile.id);
      setHousehold(hh as Household);
      setProfile({ ...profile, household_id: hh.id, role: 'istri' });
      return;
    }
    // Demo: simulate joining
    setHousehold({ ...mockHousehold, invite_code: inviteCode.toUpperCase() });
    setProfile(prev => prev ? { ...prev, household_id: mockHousehold.id, role: 'istri' } : prev);
  }, [mode, profile]);

  const addWallet = useCallback(async (name: string, type: Wallet['type'], balance: number) => {
    let hh = household;

    // If user has no household (single-user case), create a personal household
    // so DB constraints (wallets.household_id NOT NULL) are satisfied.
    if (!hh) {
      const newHousehold: Household = {
        id: crypto.randomUUID(),
        name: 'My Personal Finance',
        invite_code: generateInviteCode(),
        mode: 'single',
        partner_name: null,
        created_at: new Date().toISOString(),
      };

      if (mode === 'live' && profile) {
        const { error: hhErr } = await supabase.from('households').insert({
          id: newHousehold.id,
          name: newHousehold.name,
          invite_code: newHousehold.invite_code,
          mode: newHousehold.mode,
          partner_name: newHousehold.partner_name,
        });
        if (hhErr) throw hhErr;

        const { error: profileError } = await supabase.from('profiles').update({ household_id: newHousehold.id, role: 'single' }).eq('id', profile.id);
        if (profileError) throw profileError;

        hh = newHousehold;
        setHousehold(newHousehold);
        setProfile({ ...profile, household_id: newHousehold.id, role: 'single' });
      } else {
        // Demo: create locally
        setHousehold(newHousehold);
        setProfile(prev => prev ? { ...prev, household_id: newHousehold.id, role: 'single' } : prev);
        hh = newHousehold;
      }
    }

    const newWallet: Wallet = {
      id: crypto.randomUUID(),
      household_id: hh.id,
      user_id: profile?.id,
      name,
      type,
      balance,
      owner_role: null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live' && profile) {
      const { data, error } = await supabase.from('wallets').insert({
        user_id: profile.id,
        household_id: hh.id,
        name,
        type,
        balance,
      }).select().single();
      if (error) throw error;
      const inserted = (data as Wallet) ?? newWallet;
      setWallets(prev => [...prev, inserted]);
      return inserted;
    } else {
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    }
  }, [household, mode, profile]);

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    if (mode === 'live') {
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
    }
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, [mode]);

  const deleteWallet = useCallback(async (id: string) => {
    const walletTransactions = transactions.filter((tx) => tx.wallet_id === id);
    if (walletTransactions.length > 0) {
      throw new Error('This wallet has linked transactions. Delete those transactions first.');
    }

    if (mode === 'live') {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
    }
    setWallets(prev => prev.filter(w => w.id !== id));
  }, [mode, transactions]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      transaction_date: tx.transaction_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const targetWallet = wallets.find(w => w.id === tx.wallet_id);
    const nextWalletBalance = targetWallet
      ? targetWallet.balance + (tx.type === 'income' ? tx.amount : -tx.amount)
      : tx.amount;

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').insert({        user_id: profile?.id,        wallet_id: tx.wallet_id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        notes: tx.notes,
        spent_by: tx.spent_by,
        transaction_date: tx.transaction_date,
      });
      if (error) throw error;

      if (targetWallet) {
        const { error: walletError } = await supabase.from('wallets').update({ balance: nextWalletBalance }).eq('id', tx.wallet_id);
        if (walletError) throw walletError;
      }
    }

    setTransactions(prev => [newTx, ...prev]);
    setWallets(prev => prev.map(w => {
      if (w.id === tx.wallet_id) {
        return { ...w, balance: nextWalletBalance };
      }
      return w;
    }));
  }, [mode, wallets]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      const targetWallet = wallets.find(w => w.id === tx.wallet_id);
      if (targetWallet) {
        const nextBalance = targetWallet.balance + (tx.type === 'income' ? -tx.amount : tx.amount);
        const { error: walletError } = await supabase.from('wallets').update({ balance: nextBalance }).eq('id', tx.wallet_id);
        if (walletError) throw walletError;

        setWallets(prev => prev.map(w => w.id === tx.wallet_id ? { ...w, balance: nextBalance } : w));
      }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [mode, transactions, wallets]);

  const setBudget = useCallback(async (category: string, limitAmount: number) => {
    if (!household) return;
    const existing = budgets.find(b => b.category === category);

    if (mode === 'live') {
      if (existing) {
        const { error } = await supabase.from('budgets').update({ limit_amount: limitAmount }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('budgets').insert({
          user_id: profile?.id,
          household_id: household.id,
          category,
          limit_amount: limitAmount,
        }).select().single();
        if (error) throw error;
        setBudgets(prev => [...prev, data as Budget]);
        return;
      }
    }

    if (existing) {
      setBudgets(prev => prev.map(b => b.category === category ? { ...b, limit_amount: limitAmount } : b));
    } else {
      setBudgets(prev => [...prev, {
        id: crypto.randomUUID(),
        household_id: household.id,
        category,
        limit_amount: limitAmount,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [household, budgets, mode]);

  const deleteBudget = useCallback(async (id: string) => {
    if (mode === 'live') {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, [mode]);

  const value: AppState = {
    mode,
    profile,
    household,
    wallets,
    transactions,
    budgets,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    setMode,
    createHousehold,
    joinHousehold,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    enterDemo,
    isDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
