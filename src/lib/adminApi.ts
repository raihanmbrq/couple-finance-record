import { supabase } from '@/lib/supabase';
import { buildInvitationShareLink, generateInvitationToken, sendInvitationEmail, type InvitationEmailResult } from '@/lib/invitations';
import type {
  AdminHouseholdRow,
  AdminProfileRow,
  AdminTransactionFilters,
  AdminTransactionRow,
  AdminWalletRow,
  InvitationToken,
  Profile,
  Transaction,
  Wallet,
} from '@/lib/types';

/**
 * Data-access layer for the admin-only "Admin Console".
 *
 * Every call here relies on the admin RLS policies + `SECURITY DEFINER` RPCs
 * added in `20261011000000_admin_console.sql`. `assertAdmin()` is a fast
 * client-side fail for a clearer message, but the authoritative guard lives in
 * Postgres: a non-admin session simply receives zero rows / a policy error.
 */

/** Fast-fail guard for a clearer message; Postgres RLS is the real gate. */
export function assertAdmin(profile: Profile | null): asserts profile is Profile {
  if (!profile?.is_admin) {
    throw new Error('Akses ditolak: hanya admin yang dapat mengakses fitur ini.');
  }
}

// ==================== Raw table browser (all tables) ====================

/** Every table in the PairFlow schema, exposed by the raw data browser. */
export const ADMIN_RAW_TABLES = [
  'profiles',
  'households',
  'household_members',
  'wallets',
  'transactions',
  'budgets',
  'goals',
  'wallet_types',
  'categories',
  'invitation_tokens',
] as const;

export type AdminRawTable = (typeof ADMIN_RAW_TABLES)[number];

/**
 * Returns every row of a table as-is. Visibility is governed by the admin RLS
 * policies — if a table returns fewer rows than expected, the admin migration
 * (`20261011000000_admin_console.sql`) has not been applied to this project.
 */
export async function listAdminRawTable(table: AdminRawTable): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).select('*').limit(2000);
  if (error) throw error;
  return (data as Record<string, unknown>[]) ?? [];
}

interface HouseholdNameRow {
  id: string;
  name: string;
}

// ==================== Users & Profiles ====================

/** Every profile in the system (admin RLS broadens the default own-row scope). */
export async function listAdminProfiles(): Promise<AdminProfileRow[]> {
  const [{ data: profiles, error: pErr }, { data: households, error: hErr }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('households').select('id, name'),
  ]);
  if (pErr) throw pErr;
  if (hErr) throw hErr;

  const hhMap = new Map((households ?? []).map((h) => [(h as HouseholdNameRow).id, (h as HouseholdNameRow).name]));
  return ((profiles ?? []) as Profile[]).map((p) => ({
    ...p,
    household_name: p.household_id ? hhMap.get(p.household_id) ?? null : null,
  }));
}

/** Admin edit of any profile row (name, role, currency, etc.). */
export async function adminUpdateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
}

/** Toggle the admin flag of another user (self-demotion blocked server-side). */
export async function adminSetAdmin(id: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_admin', { p_user_id: id, p_is_admin: isAdmin });
  if (error) throw error;
}

/** Deactivate / reactivate an account (soft delete). */
export async function adminSetDeactivated(id: string, deactivate: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_deactivate_user', { p_user_id: id, p_deactivate: deactivate });
  if (error) throw error;
}

// ==================== Invitation Tokens ====================

export async function listAdminInvitations(): Promise<InvitationToken[]> {
  const { data, error } = await supabase
    .from('invitation_tokens')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as InvitationToken[]) ?? [];
}

export interface AdminInvitationResult {
  invitation: InvitationToken;
  emailResult: InvitationEmailResult;
  shareLink: string;
}

/** Generate + persist a new invitation token bound to the target email. */
export async function adminCreateInvitation(createdBy: string, email: string): Promise<AdminInvitationResult> {
  const targetEmail = email.trim().toLowerCase();
  const token = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('invitation_tokens')
    .insert({ email: targetEmail, token, created_by: createdBy, expires_at: expiresAt })
    .select()
    .single();
  if (error) throw error;

  const invitation = data as InvitationToken;
  const emailResult = await sendInvitationEmail({ email: targetEmail, token });
  return { invitation, emailResult, shareLink: buildInvitationShareLink(token) };
}

/**
 * "Resend" for the closed-registration flow: rotates the token (invalidating
 * the old link) and extends the expiry by 7 days, then returns the fresh share
 * link. Email delivery is not configured, so the admin copies the link.
 */
export async function adminResendInvitation(invitation: InvitationToken): Promise<AdminInvitationResult> {
  const token = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('invitation_tokens')
    .update({ token, expires_at: expiresAt, is_used: false })
    .eq('id', invitation.id)
    .select()
    .single();
  if (error) throw error;

  const updated = data as InvitationToken;
  const emailResult = await sendInvitationEmail({ email: updated.email, token: updated.token });
  return { invitation: updated, emailResult, shareLink: buildInvitationShareLink(updated.token) };
}

/** Revoke a pending token by expiring it immediately. */
export async function adminRevokeInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitation_tokens')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Permanently delete a token row. */
export async function adminDeleteInvitation(id: string): Promise<void> {
  const { error } = await supabase.from('invitation_tokens').delete().eq('id', id);
  if (error) throw error;
}

// ==================== Households & Couples ====================

interface MemberRow {
  household_id: string;
  user_id: string;
  role: string;
}

/** All households with member counts + member display names. */
export async function listAdminHouseholds(): Promise<AdminHouseholdRow[]> {
  const [{ data: households, error: hErr }, { data: members, error: mErr }, { data: profiles, error: pErr }] =
    await Promise.all([
      supabase.from('households').select('*').order('created_at', { ascending: false }),
      supabase.from('household_members').select('household_id, user_id, role'),
      supabase.from('profiles').select('id, full_name, email'),
    ]);
  if (hErr) throw hErr;
  if (mErr) throw mErr;
  if (pErr) throw pErr;

  const nameMap = new Map(
    ((profiles ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]).map((p) => [
      p.id,
      p.full_name || p.email,
    ]),
  );

  const byHousehold = new Map<string, MemberRow[]>();
  for (const m of (members ?? []) as MemberRow[]) {
    const list = byHousehold.get(m.household_id) ?? [];
    list.push(m);
    byHousehold.set(m.household_id, list);
  }

  return ((households ?? []) as AdminHouseholdRow[]).map((h) => {
    const rows = byHousehold.get(h.id) ?? [];
    return {
      ...h,
      member_count: rows.length,
      member_names: rows.map((r) => nameMap.get(r.user_id) ?? 'Unknown user'),
    };
  });
}

/** Detach every member from a household (server re-checks admin). */
export async function adminUnpairHousehold(householdId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unpair_household', { p_household_id: householdId });
  if (error) throw error;
}

// ==================== Wallets & Transactions ====================

/** All wallets (including archived) enriched with their household name. */
export async function listAdminWallets(): Promise<AdminWalletRow[]> {
  const [{ data: wallets, error: wErr }, { data: households, error: hErr }] = await Promise.all([
    supabase.from('wallets').select('*').order('created_at', { ascending: false }),
    supabase.from('households').select('id, name'),
  ]);
  if (wErr) throw wErr;
  if (hErr) throw hErr;

  const hhMap = new Map((households ?? []).map((h) => [(h as HouseholdNameRow).id, (h as HouseholdNameRow).name]));
  return ((wallets ?? []) as (Wallet & { archived_at?: string | null })[]).map((w) => ({
    ...w,
    household_name: hhMap.get(w.household_id) ?? null,
    is_archived: Boolean(w.archived_at),
  }));
}

export async function adminUpdateWallet(id: string, updates: Partial<Wallet>): Promise<void> {
  const { error } = await supabase.from('wallets').update(updates).eq('id', id);
  if (error) throw error;
}

/** Soft delete / restore a wallet via `archived_at`. */
export async function adminSetWalletArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('wallets')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

async function householdNameMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('households').select('id, name');
  if (error) throw error;
  return new Map((data ?? []).map((h) => [(h as HouseholdNameRow).id, (h as HouseholdNameRow).name]));
}

/** Centralized transaction query with server-side + client-side filters. */
export async function listAdminTransactions(filters: AdminTransactionFilters = {}): Promise<AdminTransactionRow[]> {
  const { data: walletRows, error: wErr } = await supabase.from('wallets').select('id, household_id');
  if (wErr) throw wErr;

  const byId = new Map<string, string>();
  for (const row of (walletRows ?? []) as { id: string; household_id: string }[]) {
    byId.set(row.id, row.household_id);
  }

  let walletIds = [...byId.keys()];
  // `'all'` is the UI's "no filter" sentinel; only narrow when a real id is set.
  if (filters.householdId && filters.householdId !== 'all') {
    walletIds = walletIds.filter((id) => byId.get(id) === filters.householdId);
  }
  if (walletIds.length === 0) return [];

  let query = supabase.from('transactions').select('*').in('wallet_id', walletIds);
  if (filters.userId && filters.userId !== 'all') query = query.eq('user_id', filters.userId);
  if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category);
  if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
  if (filters.from) query = query.gte('transaction_date', `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte('transaction_date', `${filters.to}T23:59:59.999Z`);
  if (!filters.includeArchived) query = query.is('archived_at', null);

  const { data, error } = await query.order('transaction_date', { ascending: false });
  if (error) throw error;

  const hhNames = await householdNameMap();
  return ((data ?? []) as (Transaction & { archived_at?: string | null })[]).map((tx) => {
    const householdId = byId.get(tx.wallet_id) ?? null;
    return {
      ...tx,
      household_id: householdId,
      household_name: householdId ? hhNames.get(householdId) ?? null : null,
      is_archived: Boolean(tx.archived_at),
    };
  });
}

/** Transactions restricted to a single household (households drill-in). */
export async function listAdminHouseholdTransactions(householdId: string): Promise<AdminTransactionRow[]> {
  return listAdminTransactions({ householdId, includeArchived: true });
}

export async function adminUpdateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const { error } = await supabase.from('transactions').update(updates).eq('id', id);
  if (error) throw error;
}

/** Soft delete / restore a transaction via `archived_at`. */
export async function adminSetTransactionArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

