-- Add icon column to wallets table to store the selected brand icon key
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS icon text;
