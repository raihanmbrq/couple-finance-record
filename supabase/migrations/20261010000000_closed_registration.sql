/*
# Closed Registration (Invited Tester Only)

## Overview
Restricts PairFlow signups to invited testers only. Adds admin/first-login flags
to `profiles`, an `invitation_tokens` table, and a server-side gate on
`auth.users` so the public signup API cannot be bypassed (e.g. via Postman).

## Changes

1. **profiles**
   - `is_admin` (boolean, default false) — flags admin users (generate invites).
   - `is_first_login` (boolean, default false) — drives the one-time
     "Adjust Nama Lengkap" popup. Existing users stay `false` so nothing changes
     for them.
   - `mubaroqraihan@gmail.com` is backfilled to `is_admin = true`.

2. **invitation_tokens** (new)
   - `id` (uuid, PK, default gen_random_uuid())
   - `email` (text, not null) — the only email allowed to redeem the token
   - `token` (text, unique, not null)
   - `is_used` (boolean, default false)
   - `created_by` (uuid, references profiles(id))
   - `expires_at` (timestamptz, default now() + 7 days)
   - `created_at` (timestamptz, default now())

3. **Helpers (SECURITY DEFINER)**
   - `is_admin(user_id)` — true when the caller's profile has `is_admin`.
   - `verify_invitation_token(token)` — returns the bound email for a token that
     is unused and unexpired, otherwise NULL. Kept as an RPC so anonymous users
     can validate *their own* token without being able to enumerate the table.

4. **Signup gate**
   - `validate_invitation_on_signup()` BEFORE INSERT trigger on `auth.users`
     requires a valid, unused, unexpired token matching the new user's email
     (passed via signUp metadata `invitation_token`) and consumes it atomically.

## Security (RLS)
- `invitation_tokens` RLS enabled. SELECT/INSERT/UPDATE restricted to admins.
- Token consumption inside the signup trigger runs as SECURITY DEFINER and
  therefore bypasses RLS for the atomic UPDATE.

## Important Notes
1. Existing registered users are unaffected (the `auth.users` trigger only fires
   on INSERT).
2. `verify_invitation_token` is granted to `anon` + `authenticated` because the
   token entry page is public; it only reveals the email bound to a token the
   caller already possesses.
*/

-- ==================== 1) profiles flags ====================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;

-- Backfill the admin account (case-insensitive match).
UPDATE public.profiles
SET is_admin = true
WHERE lower(email) = 'mubaroqraihan@gmail.com';

-- Enforce the admin flag server-side for that email, so it also applies when the
-- admin profile is created later (they cannot be locked out or self-demoted).
CREATE OR REPLACE FUNCTION public.enforce_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'mubaroqraihan@gmail.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_email ON public.profiles;
CREATE TRIGGER enforce_admin_email
BEFORE INSERT OR UPDATE OF email, is_admin ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_admin_email();

-- ==================== 2) invitation_tokens table ====================
CREATE TABLE IF NOT EXISTS public.invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitation_tokens_email_idx
  ON public.invitation_tokens (lower(email));

CREATE INDEX IF NOT EXISTS invitation_tokens_token_idx
  ON public.invitation_tokens (token);

-- ==================== 3) Helper functions ====================
-- Admin check for RLS + frontend gating.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Public token verification. Returns the bound email only when the token is
-- valid, unused and unexpired; otherwise NULL. Avoids exposing the table.
CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.invitation_tokens
  WHERE token = trim(p_token)
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_invitation_token(text) TO authenticated, anon;

-- ==================== 4) Signup gate (server-side, bypass-proof) ====================
CREATE OR REPLACE FUNCTION public.validate_invitation_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_match uuid;
BEGIN
  v_token := NEW.raw_user_meta_data ->> 'invitation_token';

  IF v_token IS NULL OR length(trim(v_token)) = 0 THEN
    RAISE EXCEPTION 'Registrasi tertutup. Diperlukan token undangan untuk membuat akun.';
  END IF;

  SELECT id INTO v_match
  FROM public.invitation_tokens
  WHERE token = trim(v_token)
    AND lower(email) = lower(NEW.email)
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Token undangan tidak valid, sudah digunakan, atau sudah kadaluarsa.';
  END IF;

  -- Consume the token atomically with the account creation.
  UPDATE public.invitation_tokens
  SET is_used = true
  WHERE id = v_match;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_invitation_on_signup ON auth.users;
CREATE TRIGGER validate_invitation_on_signup
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.validate_invitation_on_signup();

-- ==================== 5) RLS & policies ====================
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.invitation_tokens TO authenticated;

-- Only admins may read invitation tokens (history table on the admin page).
DROP POLICY IF EXISTS "select_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "select_invitation_tokens_admin" ON public.invitation_tokens
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only admins may insert invitation tokens (they author them as themselves).
DROP POLICY IF EXISTS "insert_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "insert_invitation_tokens_admin" ON public.invitation_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

-- Only admins may update invitation tokens (e.g. revoke / manual consume).
DROP POLICY IF EXISTS "update_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "update_invitation_tokens_admin" ON public.invitation_tokens
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
