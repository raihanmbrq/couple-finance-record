-- Add user theme preference to profiles.
-- Values: 'system' | 'default' | 'emerald' | 'rose' | 'dark' (default 'default').
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'default';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_check
  CHECK (theme IN ('system', 'default', 'emerald', 'rose', 'dark'));