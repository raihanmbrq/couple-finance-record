export type UserRole = 'suami' | 'istri' | 'single' | 'partner';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  household_id?: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  mode: 'single' | 'couple';
  partner_name?: string | null;
  created_at: string;
}

export type WalletType = 'joint' | 'cash' | 'bank' | 'ewallet';

export interface Wallet {
  id: string;
  household_id: string;
  user_id?: string;
  name: string;
  type: WalletType;
  balance: number;
  owner_role?: UserRole | null;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  amount: number;
  type: TransactionType;
  category: string;
  notes?: string | null;
  spent_by: string;
  transaction_date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  household_id: string;
  user_id?: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

export interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { key: 'food', label: 'Food & Groceries', icon: 'UtensilsCrossed', color: 'amber' },
  { key: 'bills', label: 'Bills & Utilities', icon: 'Receipt', color: 'blue' },
  { key: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: 'purple' },
  { key: 'entertainment', label: 'Entertainment', icon: 'Clapperboard', color: 'teal' },
  { key: 'transport', label: 'Transport', icon: 'Car', color: 'green' },
  { key: 'health', label: 'Health & Medical', icon: 'HeartPulse', color: 'red' },
  { key: 'education', label: 'Education', icon: 'GraduationCap', color: 'blue' },
  { key: 'salary', label: 'Salary', icon: 'Banknote', color: 'green' },
  { key: 'other', label: 'Other', icon: 'CircleDot', color: 'stone' },
  { key: 'transfer', label: 'Transfer', icon: 'ArrowRightLeft', color: 'stone' },
];

export function getCategory(key: string): Category | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
