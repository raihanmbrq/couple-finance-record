import { supabase } from '@/lib/supabase';

/**
 * Ambiguous characters (0/O/1/I) are excluded so tokens stay easy to read/copy.
 */
const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH = 10;

/** Generates a short, human-friendly invitation token (default 10 characters). */
export function generateInvitationToken(length: number = TOKEN_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return token;
}

/**
 * Derives a display name from an email prefix.
 * e.g. `mubaroqraihan@gmail.com` -> `Mubaroqraihan`
 *      `john.doe@x.com`         -> `John Doe`
 */
export function deriveFullNameFromEmail(email: string): string {
  const prefix = (email.split('@')[0] ?? '').trim();
  if (!prefix) return 'User';
  return prefix
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') || 'User';
}

/** Builds the public share link a tester opens to redeem their token. */
export function buildInvitationShareLink(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite?token=${encodeURIComponent(token)}`;
}

export interface InvitationEmailResult {
  delivered: boolean;
  reason?: string;
}

/**
 * Placeholder email dispatcher for the closed-registration flow.
 *
 * Email delivery is intentionally not wired to a provider yet (see the
 * closed-registration plan, "Option C"). The admin page surfaces the generated
 * token + share link with copy buttons so invites can be shared manually.
 * When an Edge Function (e.g. Resend/SendGrid) is added later, replace the body
 * below with `supabase.functions.invoke('send-invitation-email', { body })`.
 */
export async function sendInvitationEmail(params: {
  email: string;
  token: string;
}): Promise<InvitationEmailResult> {
  void params;
  void supabase;
  return {
    delivered: false,
    reason: 'Email belum dikonfigurasi. Salin token / link undangan untuk dibagikan manual.',
  };
}
