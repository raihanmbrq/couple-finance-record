-- Transaction Category support: system rows + user/household custom rows.
-- Mirrors the wallet_types pattern for dynamic, parameterized categories.

CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  type text NOT NULL DEFAULT 'both' CHECK (type IN ('expense', 'income', 'both')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (household_id, name)
);

-- Seed system categories. IDs match legacy CATEGORIES keys so existing
-- transaction history stays compatible (e.g. 'food', 'bills', 'salary').
INSERT INTO public.categories (id, name, icon, type, is_system) VALUES
  ('food', 'Food & Groceries', 'Utensils', 'expense', true),
  ('bills', 'Bills & Utilities', 'Receipt', 'expense', true),
  ('shopping', 'Shopping', 'ShoppingBag', 'expense', true),
  ('entertainment', 'Entertainment', 'Clapperboard', 'expense', true),
  ('transport', 'Transport', 'Car', 'expense', true),
  ('health', 'Health & Medical', 'HeartPulse', 'expense', true),
  ('education', 'Education', 'GraduationCap', 'expense', true),
  ('coffee', 'Coffee', 'Coffee', 'expense', true),
  ('salary', 'Salary', 'Banknote', 'income', true),
  ('other', 'Other', 'Sparkles', 'both', true),
  ('transfer', 'Transfer', 'ArrowLeftRight', 'both', true),
  ('goals', 'Goals', 'Landmark', 'both', true),
  ('gift', 'Gift', 'Gift', 'both', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- System rows visible to everyone; custom rows only within the user's household.
DROP POLICY IF EXISTS "select_categories" ON public.categories;
CREATE POLICY "select_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (is_system = true OR household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_categories" ON public.categories;
CREATE POLICY "insert_categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.user_household_id() AND user_id = auth.uid() AND is_system = false);

-- System rows are immutable by the app.
DROP POLICY IF EXISTS "update_categories" ON public.categories;
CREATE POLICY "update_categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (is_system = false AND household_id = public.user_household_id())
  WITH CHECK (is_system = false AND household_id = public.user_household_id());

DROP POLICY IF EXISTS "delete_categories" ON public.categories;
CREATE POLICY "delete_categories" ON public.categories
  FOR DELETE TO authenticated
  USING (is_system = false AND household_id = public.user_household_id());