-- Add language preference to profiles.
-- language: 'id' (Bahasa Indonesia, default) | 'en' (English)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'id';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_language_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_language_check
  CHECK (language IN ('id', 'en'));