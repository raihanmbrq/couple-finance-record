-- Add user currency preference to profiles.
-- Stored as ISO 4217 code (default 'IDR').
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR';