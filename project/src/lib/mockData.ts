import type { Profile, Household, Wallet, Transaction, Budget } from '@/lib/types';

// Deterministic IDs for mock data
const mockHouseholdId = 'hh-mock-001';
const mockUserId = 'user-mock-001';
const mockPartnerId = 'user-mock-002';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();

export const mockProfile: Profile = {
  id: mockUserId,
  email: 'demo@duitbersama.id',
  full_name: 'Andi Pratama',
  role: 'suami',
  avatar_url: null,
  household_id: mockHouseholdId,
  created_at: daysAgo(30),
};

export const mockHousehold: Household = {
  id: mockHouseholdId,
  name: 'Andi & Sari',
  invite_code: 'ANDSAR',
  mode: 'couple',
  partner_name: 'Sari Wulandari',
  created_at: daysAgo(30),
};

export const mockWallets: Wallet[] = [
  {
    id: 'wallet-1',
    household_id: mockHouseholdId,
    name: 'Joint Account',
    type: 'joint',
    balance: 8_500_000,
    owner_role: null,
    created_at: daysAgo(30),
  },
  {
    id: 'wallet-2',
    household_id: mockHouseholdId,
    name: 'Andi Cash',
    type: 'cash',
    balance: 1_250_000,
    owner_role: 'suami',
    created_at: daysAgo(30),
  },
  {
    id: 'wallet-3',
    household_id: mockHouseholdId,
    name: 'Sari Bank',
    type: 'bank',
    balance: 3_200_000,
    owner_role: 'istri',
    created_at: daysAgo(30),
  },
  {
    id: 'wallet-4',
    household_id: mockHouseholdId,
    name: 'GoPay E-Wallet',
    type: 'ewallet',
    balance: 450_000,
    owner_role: null,
    created_at: daysAgo(30),
  },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', wallet_id: 'wallet-1', amount: 5_000_000, type: 'income', category: 'salary', notes: 'Monthly salary', spent_by: 'Andi Pratama', created_at: daysAgo(2) },
  { id: 'tx-2', wallet_id: 'wallet-3', amount: 4_200_000, type: 'income', category: 'salary', notes: 'Sari monthly salary', spent_by: 'Sari Wulandari', created_at: daysAgo(2) },
  { id: 'tx-3', wallet_id: 'wallet-1', amount: 85_000, type: 'expense', category: 'food', notes: 'Groceries at Indomaret', spent_by: 'Sari Wulandari', created_at: hoursAgo(5) },
  { id: 'tx-4', wallet_id: 'wallet-2', amount: 25_000, type: 'expense', category: 'transport', notes: 'Gojek to office', spent_by: 'Andi Pratama', created_at: hoursAgo(3) },
  { id: 'tx-5', wallet_id: 'wallet-4', amount: 150_000, type: 'expense', category: 'entertainment', notes: 'Netflix + Spotify', spent_by: 'Andi Pratama', created_at: hoursAgo(8) },
  { id: 'tx-6', wallet_id: 'wallet-1', amount: 1_200_000, type: 'expense', category: 'bills', notes: 'Electricity & water bill', spent_by: 'Sari Wulandari', created_at: daysAgo(1) },
  { id: 'tx-7', wallet_id: 'wallet-2', amount: 320_000, type: 'expense', category: 'shopping', notes: 'New shoes', spent_by: 'Andi Pratama', created_at: daysAgo(3) },
  { id: 'tx-8', wallet_id: 'wallet-3', amount: 65_000, type: 'expense', category: 'food', notes: 'Lunch with friends', spent_by: 'Sari Wulandari', created_at: daysAgo(4) },
  { id: 'tx-9', wallet_id: 'wallet-1', amount: 200_000, type: 'expense', category: 'health', notes: 'Vitamins & supplements', spent_by: 'Andi Pratama', created_at: daysAgo(5) },
  { id: 'tx-10', wallet_id: 'wallet-4', amount: 50_000, type: 'expense', category: 'food', notes: 'Coffee at Starbucks', spent_by: 'Sari Wulandari', created_at: daysAgo(6) },
  { id: 'tx-11', wallet_id: 'wallet-1', amount: 500_000, type: 'expense', category: 'bills', notes: 'Internet bill', spent_by: 'Andi Pratama', created_at: daysAgo(7) },
  { id: 'tx-12', wallet_id: 'wallet-3', amount: 180_000, type: 'expense', category: 'shopping', notes: 'Skincare', spent_by: 'Sari Wulandari', created_at: daysAgo(8) },
];

export const mockBudgets: Budget[] = [
  { id: 'bg-1', household_id: mockHouseholdId, category: 'food', limit_amount: 3_000_000, created_at: daysAgo(30) },
  { id: 'bg-2', household_id: mockHouseholdId, category: 'bills', limit_amount: 2_500_000, created_at: daysAgo(30) },
  { id: 'bg-3', household_id: mockHouseholdId, category: 'shopping', limit_amount: 1_500_000, created_at: daysAgo(30) },
  { id: 'bg-4', household_id: mockHouseholdId, category: 'entertainment', limit_amount: 800_000, created_at: daysAgo(30) },
  { id: 'bg-5', household_id: mockHouseholdId, category: 'transport', limit_amount: 600_000, created_at: daysAgo(30) },
  { id: 'bg-6', household_id: mockHouseholdId, category: 'health', limit_amount: 500_000, created_at: daysAgo(30) },
];

export const mockPartner: Profile = {
  id: mockPartnerId,
  email: 'sari@duitbersama.id',
  full_name: 'Sari Wulandari',
  role: 'istri',
  avatar_url: null,
  household_id: mockHouseholdId,
  created_at: daysAgo(30),
};

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
