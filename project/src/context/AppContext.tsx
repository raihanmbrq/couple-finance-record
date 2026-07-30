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
  // Onboarding
  setMode: (mode: 'single' | 'couple', partnerName?: string) => Promise<void>;
  createHousehold: (mode: 'single' | 'couple', partnerName?: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  // Wallets
  addWallet: (name: string, type: Wallet['type'], balance: number) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
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
      // Load profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const currentProfile: Profile = prof ?? {
        id: userId,
        email,
        full_name: email.split('@')[0] ?? 'User',
        role: 'single',
        avatar_url: null,
        household_id: null,
        created_at: new Date().toISOString(),
      };
      setProfile(currentProfile);

      if (currentProfile.household_id) {
        // Load household
        const { data: hh } = await supabase
          .from('households')
          .select('*')
          .eq('id', currentProfile.household_id)
          .maybeSingle();
        setHousehold(hh as Household | null);

        // Load wallets
        const { data: w } = await supabase
          .from('wallets')
          .select('*')
          .eq('household_id', currentProfile.household_id);
        setWallets((w as Wallet[]) ?? []);

        // Load transactions
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });
        setTransactions((tx as Transaction[]) ?? []);

        // Load budgets
        const { data: bg } = await supabase
          .from('budgets')
          .select('*')
          .eq('household_id', currentProfile.household_id);
        setBudgets((bg as Budget[]) ?? []);
      }
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
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'single',
        });
        setAppMode('live');
        setIsDemo(false);
        await loadLiveData(data.user.id, email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadLiveData]);

  const signInWithGoogle = useCallback(async () => {
    setError('Google sign-in is not configured yet. Use email/password or try the demo mode.');
  }, []);

  const signOut = useCallback(async () => {
    if (mode === 'live') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('duitbersama_session');
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
      name: hhMode === 'couple' ? `${profile?.full_name ?? 'Me'} & ${partnerName ?? 'Partner'}` : 'My Personal Finance',
      invite_code: code,
      mode: hhMode,
      partner_name: hhMode === 'couple' ? partnerName : null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live' && profile) {
      const { data, error: hhError } = await supabase
        .from('households')
        .insert({
          name: newHousehold.name,
          invite_code: code,
          mode: hhMode,
          partner_name: partnerName ?? null,
        })
        .select()
        .single();
      if (hhError) throw hhError;
      const created = data as Household;
      await supabase.from('profiles').update({ household_id: created.id, role: hhMode === 'couple' ? 'suami' : 'single' }).eq('id', profile.id);
      setHousehold(created);
      setProfile({ ...profile, household_id: created.id, role: hhMode === 'couple' ? 'suami' : 'single' });
      return created.invite_code;
    }

    // Demo mode
    setHousehold(newHousehold);
    setProfile(prev => prev ? { ...prev, household_id: newHousehold.id, role: hhMode === 'couple' ? 'suami' : 'single' } : prev);
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
    if (!household) return;
    const newWallet: Wallet = {
      id: crypto.randomUUID(),
      household_id: household.id,
      name,
      type,
      balance,
      owner_role: null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live') {
      const { data, error } = await supabase.from('wallets').insert({
        household_id: household.id,
        name,
        type,
        balance,
      }).select().single();
      if (error) throw error;
      setWallets(prev => [...prev, data as Wallet]);
    } else {
      setWallets(prev => [...prev, newWallet]);
    }
  }, [household, mode]);

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    if (mode === 'live') {
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
    }
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, [mode]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').insert({
        wallet_id: tx.wallet_id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        notes: tx.notes,
        spent_by: tx.spent_by,
      });
      if (error) throw error;
    }

    setTransactions(prev => [newTx, ...prev]);

    // Update wallet balance
    setWallets(prev => prev.map(w => {
      if (w.id === tx.wallet_id) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    }));
  }, [mode]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    }

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Reverse wallet balance
    setWallets(prev => prev.map(w => {
      if (w.id === tx.wallet_id) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    }));
  }, [mode, transactions]);

  const setBudget = useCallback(async (category: string, limitAmount: number) => {
    if (!household) return;
    const existing = budgets.find(b => b.category === category);

    if (mode === 'live') {
      if (existing) {
        const { error } = await supabase.from('budgets').update({ limit_amount: limitAmount }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('budgets').insert({
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
    setMode,
    createHousehold,
    joinHousehold,
    addWallet,
    updateWallet,
    addTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    enterDemo,
    isDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
