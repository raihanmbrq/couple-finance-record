-- ============================================================
-- Allow deleting wallets that still have transaction history.
-- 1. Wallets are soft-deleted via archived_at (row kept in DB so the
--    transactions.wallet_id FK + RLS policies keep working and history
--    stays readable).
-- 2. transactions.wallet_name is a denormalized snapshot so transaction
--    history still shows the wallet name used before the wallet was deleted.
-- ============================================================

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS wallet_name text;

-- Backfill the snapshot for all existing transactions from their wallet.
UPDATE public.transactions t
SET wallet_name = w.name
FROM public.wallets w
WHERE t.wallet_id = w.id
  AND t.wallet_name IS NULL;

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_name ON public.transactions(wallet_name);
