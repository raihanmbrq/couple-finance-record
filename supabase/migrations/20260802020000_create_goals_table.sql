-- ==================== GOALS (SINKING FUND) TABLE ====================
-- Tracks savings goals per household. Money stored as bigint rupiah (no decimals).

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount bigint NOT NULL DEFAULT 0,
  current_amount bigint NOT NULL DEFAULT 0,
  target_date timestamptz NOT NULL DEFAULT now(),
  asset_category text NOT NULL DEFAULT 'Tabungan Biasa' CHECK (asset_category IN ('Tabungan Biasa', 'Reksadana', 'Saham', 'Deposito', 'Emas', 'Lainnya')),
  expected_return_rate numeric NOT NULL DEFAULT 0,
  monthly_contribution bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_household ON public.goals(household_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;

-- ==================== GOALS POLICIES ====================
DROP POLICY IF EXISTS "select_household_goals" ON public.goals;
CREATE POLICY "select_household_goals" ON public.goals
  FOR SELECT TO authenticated
  USING (household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_household_goals" ON public.goals;
CREATE POLICY "insert_household_goals" ON public.goals
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "update_household_goals" ON public.goals;
CREATE POLICY "update_household_goals" ON public.goals
  FOR UPDATE TO authenticated
  USING (household_id = public.user_household_id())
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "delete_household_goals" ON public.goals;
CREATE POLICY "delete_household_goals" ON public.goals
  FOR DELETE TO authenticated
  USING (household_id = public.user_household_id());