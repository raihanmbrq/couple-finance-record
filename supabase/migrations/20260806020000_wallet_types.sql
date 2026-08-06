-- Wallet Type support: system rows + user/household custom rows.

CREATE TABLE IF NOT EXISTS public.wallet_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Wallet',
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (household_id, name)
);

-- Seed system wallet types. IDs match legacy wallet type keys.
INSERT INTO public.wallet_types (id, name, icon, is_system) VALUES
  ('joint', 'Joint', 'PiggyBank', true),
  ('cash', 'Cash', 'Banknote', true),
  ('bank', 'Bank', 'Landmark', true),
  ('ewallet', 'E-Wallet', 'Smartphone', true)
ON CONFLICT (id) DO NOTHING;

-- Allow custom types in wallets.type (was CHECK (type IN ('joint','cash','bank','ewallet'))).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_type_check'
  ) THEN
    ALTER TABLE public.wallets DROP CONSTRAINT wallets_type_check;
  END IF;
END $$;

ALTER TABLE public.wallet_types ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_types TO authenticated;

-- System rows visible to everyone; custom rows only within the user's household.
DROP POLICY IF EXISTS "select_wallet_types" ON public.wallet_types;
CREATE POLICY "select_wallet_types" ON public.wallet_types
  FOR SELECT TO authenticated
  USING (is_system = true OR household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_wallet_types" ON public.wallet_types;
CREATE POLICY "insert_wallet_types" ON public.wallet_types
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.user_household_id() AND user_id = auth.uid() AND is_system = false);

-- System rows are immutable by the app.
DROP POLICY IF EXISTS "update_wallet_types" ON public.wallet_types;
CREATE POLICY "update_wallet_types" ON public.wallet_types
  FOR UPDATE TO authenticated
  USING (is_system = false AND household_id = public.user_household_id())
  WITH CHECK (is_system = false AND household_id = public.user_household_id());

DROP POLICY IF EXISTS "delete_wallet_types" ON public.wallet_types;
CREATE POLICY "delete_wallet_types" ON public.wallet_types
  FOR DELETE TO authenticated
  USING (is_system = false AND household_id = public.user_household_id());