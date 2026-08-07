-- Add theme preferences to profiles.
-- Split into two independent preferences:
--   color_preset: 'emerald' | 'gold' | 'rose' | 'slate' (default 'emerald')
--   appearance_mode: 'light' | 'dark' | 'system' (default 'system')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS color_preset text NOT NULL DEFAULT 'emerald';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS appearance_mode text NOT NULL DEFAULT 'system';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_color_preset_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_color_preset_check
  CHECK (color_preset IN ('emerald', 'gold', 'rose', 'slate'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_appearance_mode_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_appearance_mode_check
  CHECK (appearance_mode IN ('light', 'dark', 'system'));

-- Backfill dari kolom legacy `theme` (jika ada) sebelum dipensiunkan.
-- Mapping: default -> gold, dark -> slate, emerald -> emerald, rose -> rose
--          system -> emerald (system), lainnya -> emerald (light)
UPDATE public.profiles
SET
  color_preset = CASE
    WHEN theme = 'default' THEN 'gold'
    WHEN theme = 'dark' THEN 'slate'
    WHEN theme = 'emerald' THEN 'emerald'
    WHEN theme = 'rose' THEN 'rose'
    WHEN theme = 'system' THEN 'emerald'
    ELSE 'emerald'
  END,
  appearance_mode = CASE
    WHEN theme = 'system' THEN 'system'
    WHEN theme = 'dark' THEN 'dark'
    ELSE 'light'
  END
WHERE theme IS NOT NULL;