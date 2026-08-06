export type UserRole = 'suami' | 'istri' | 'single' | 'partner' | 'owner' | 'member';

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

export interface HouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  role: 'owner' | 'member';
  created_at: string;
  profile?: Profile;
}

export type WalletType = 'joint' | 'cash' | 'bank' | 'ewallet';

export interface WalletTypeRow {
  id: string;
  name: string;
  icon: string;
  user_id?: string | null;
  household_id?: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  household_id: string;
  user_id?: string;
  name: string;
  type: string;
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

export type AssetCategory = 'Tabungan Biasa' | 'Reksadana' | 'Saham' | 'Deposito' | 'Emas' | 'Lainnya';

export type GoalInput = {
  id?: string;
  title: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  asset_category: AssetCategory;
  expected_return_rate: number;
  monthly_contribution: number;
};

export const ASSET_CATEGORIES: { key: AssetCategory; label: string; isInvestment: boolean }[] = [
  { key: 'Tabungan Biasa', label: 'Tabungan Biasa', isInvestment: false },
  { key: 'Reksadana', label: 'Reksadana', isInvestment: true },
  { key: 'Saham', label: 'Saham', isInvestment: true },
  { key: 'Deposito', label: 'Deposito', isInvestment: true },
  { key: 'Emas', label: 'Emas', isInvestment: true },
  { key: 'Lainnya', label: 'Lainnya', isInvestment: false },
];

export interface Goal {
  id: string;
  household_id: string;
  user_id?: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  asset_category: AssetCategory;
  expected_return_rate: number | null;
  monthly_contribution: number;
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
  { key: 'goals', label: 'Goals', icon: 'PiggyBank', color: 'primary' },
];

export function getCategory(key: string): Category | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
