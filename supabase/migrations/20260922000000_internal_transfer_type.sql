-- ============================================================
-- Internal Wallet Transfer type
--
-- PROBLEM
-- An internal transfer (e.g. BCA -> GoPay) used to be stored as a PAIR of
-- ordinary rows: an `expense` on the source wallet + an `income` on the
-- destination wallet, both with `category = 'transfer'`. Because both legs
-- were real expense/income rows, every analytic aggregate (dashboard totals,
-- charts, budget progress, exports) counted them as real money movement,
-- inflating Total Income & Total Expense and double counting each transfer.
--
-- FIX
-- A single row per internal movement: `type = 'transfer'` with an explicit
-- `source_wallet_id` / `destination_wallet_id` pair. Aggregations can then
-- simply exclude `type = 'transfer'`.
--
-- MEANING OF `category = 'transfer'` AFTER THIS MIGRATION
-- - `type = 'transfer'`              -> INTERNAL movement (own wallets),
--                                       excluded from income/expense.
-- - `type = 'expense' | 'income'` +
--   category `'transfer'`            -> EXTERNAL movement (money sent to or
--                                       received from a third party),
--                                       INCLUDED in income/expense.
--
-- Wallet balances are intentionally NOT touched by this migration: the two
-- legacy legs already netted to zero (source -amount, destination +amount),
-- so collapsing them into one transfer row keeps every wallet balance and the
-- household net worth identical.
-- ============================================================

-- ==================== 1. Allow type = 'transfer' ====================
-- The original schema enforced `CHECK (type IN ('income', 'expense'))`.
-- Drop whatever check constraint constrains `type`, then install the new one.
DO $$
DECLARE
  con text;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.transactions'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%type%'
      AND pg_get_constraintdef(c.oid) ILIKE '%income%'
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', con);
  END LOOP;
END $$;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));


-- ==================== 2. Source / destination wallet tracking ====================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source_wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS destination_wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL;

-- Denormalized snapshot so history stays readable after the destination
-- wallet is deleted (mirrors the existing `wallet_name` behaviour).
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS destination_wallet_name text;

-- Links the two legs of a legacy paired transfer when only one of them could be
-- collapsed (kept for diagnostics / future repair jobs).
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_source_wallet ON public.transactions(source_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_wallet ON public.transactions(destination_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group ON public.transactions(transfer_group_id);


-- ==================== 3. Collapse existing paired transfers ====================
-- Pairs an `expense` leg with the matching `income` leg written by the transfer
-- form: same household, same amount, same transaction_date, different wallets,
-- both still flagged `category = 'transfer'` with a NULL source_wallet_id.
--
-- The expense leg becomes the single `type = 'transfer'` row (keeping its id,
-- notes, spent_by and date); its income counterpart is deleted.
--
-- Note: when two identically-valued transfers happen on the same day for the
-- same household, pairing order follows created_at. The debit/credit result is
-- unaffected (identical amounts) - only notes could swap between the two rows.
DROP TABLE IF EXISTS _legacy_transfer_pairs;

CREATE TEMP TABLE _legacy_transfer_pairs AS
WITH legacy AS (
  SELECT
    t.id,
    t.wallet_id,
    t.wallet_name,
    t.type,
    t.amount,
    t.transaction_date,
    t.created_at,
    w.household_id,
    ROW_NUMBER() OVER (
      PARTITION BY w.household_id, t.type, t.amount, t.transaction_date
      ORDER BY t.created_at, t.id
    ) AS rn
  FROM public.transactions t
  JOIN public.wallets w ON w.id = t.wallet_id
  WHERE t.type IN ('income', 'expense')
    AND t.category = 'transfer'
    AND t.source_wallet_id IS NULL
    AND t.destination_wallet_id IS NULL
),
expense_legs AS (
  SELECT household_id, amount, transaction_date, rn, id, wallet_id
  FROM legacy
  WHERE type = 'expense'
),
income_legs AS (
  SELECT household_id, amount, transaction_date, rn, id, wallet_id, wallet_name
  FROM legacy
  WHERE type = 'income'
)
SELECT
  e.id AS expense_id,
  i.id AS income_id,
  e.wallet_id AS source_wallet_id,
  i.wallet_id AS destination_wallet_id,
  i.wallet_name AS destination_wallet_name
FROM expense_legs e
JOIN income_legs i
  ON i.household_id = e.household_id
 AND i.amount = e.amount
 AND i.transaction_date = e.transaction_date
 AND i.rn = e.rn
 AND i.wallet_id <> e.wallet_id;

UPDATE public.transactions t
SET
  type = 'transfer',
  source_wallet_id = p.source_wallet_id,
  destination_wallet_id = p.destination_wallet_id,
  destination_wallet_name = COALESCE(p.destination_wallet_name, t.wallet_name),
  transfer_group_id = gen_random_uuid()
FROM _legacy_transfer_pairs p
WHERE t.id = p.expense_id;

DELETE FROM public.transactions t
USING _legacy_transfer_pairs p
WHERE t.id = p.income_id;

-- Backfill destination names for transfers created without a snapshot.
UPDATE public.transactions t
SET destination_wallet_name = w.name
FROM public.wallets w
WHERE t.type = 'transfer'
  AND t.destination_wallet_id = w.id
  AND t.destination_wallet_name IS NULL;

DROP TABLE IF EXISTS _legacy_transfer_pairs;

-- ==================== 4. Verification (run manually) ====================
-- a) Every internal transfer must now be a single row with both wallets set:
--    SELECT id, amount, wallet_id, source_wallet_id, destination_wallet_id
--    FROM public.transactions
--    WHERE type = 'transfer'
--      AND (source_wallet_id IS NULL OR destination_wallet_id IS NULL);
--
-- b) No legacy paired transfers must remain (each group should return 0 rows):
--    SELECT amount, transaction_date, type, count(*)
--    FROM public.transactions
--    WHERE category = 'transfer' AND type IN ('income', 'expense')
--    GROUP BY 1, 2, 3
--    HAVING count(*) > 1;
--
-- c) Aggregates must ignore internal transfers entirely:
--    SELECT type, count(*), sum(amount) FROM public.transactions GROUP BY type;
