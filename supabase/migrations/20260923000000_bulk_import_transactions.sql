-- Atomic XLSX import boundary for the desktop Import & Export center.
CREATE OR REPLACE FUNCTION public.bulk_import_transactions(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid := public.user_household_id();
  v_current_user_id uuid := auth.uid();
  row_data jsonb;
  row_number integer := 0;
  v_transaction_date date;
  v_transaction_type text;
  v_transaction_amount bigint;
  v_category_name text;
  v_category_id text;
  v_wallet_name text;
  v_wallet_id uuid;
  v_spent_by text;
  v_notes text;
  v_created_count integer := 0;
BEGIN
  IF v_household_id IS NULL THEN RAISE EXCEPTION 'Household tidak ditemukan.'; END IF;
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN RAISE EXCEPTION 'Tidak ada baris transaksi untuk diimpor.'; END IF;

  FOR row_data IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    row_number := row_number + 1;
    v_transaction_date := COALESCE(NULLIF(row_data->>'date', '')::date, CURRENT_DATE);
    v_transaction_type := row_data->>'type';
    v_transaction_amount := (row_data->>'amount')::bigint;
    v_category_name := NULLIF(btrim(row_data->>'category'), '');
    v_wallet_name := NULLIF(btrim(row_data->>'wallet'), '');
    v_spent_by := NULLIF(btrim(row_data->>'spentBy'), '');
    v_notes := NULLIF(row_data->>'notes', '');

    IF v_transaction_type NOT IN ('income', 'expense') THEN RAISE EXCEPTION 'Kolom tipe pada row % tidak sesuai.', row_number; END IF;
    IF v_transaction_amount IS NULL OR v_transaction_amount <= 0 THEN RAISE EXCEPTION 'Kolom nominal pada row % bukan angka valid.', row_number; END IF;
    IF v_category_name IS NULL THEN RAISE EXCEPTION 'Kolom kategori pada row % perlu di-isi.', row_number; END IF;
    IF v_wallet_name IS NULL THEN RAISE EXCEPTION 'Kolom dompet pada row % perlu di-isi.', row_number; END IF;
    IF v_spent_by IS NULL THEN RAISE EXCEPTION 'Kolom oleh pada row % perlu di-isi.', row_number; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.household_id = v_household_id AND p.full_name = v_spent_by
    ) THEN RAISE EXCEPTION 'Kolom oleh pada row % tidak sesuai.', row_number; END IF;

    SELECT c.id INTO v_category_id FROM public.categories c
      WHERE (c.is_system OR c.household_id = v_household_id) AND lower(c.name) = lower(v_category_name)
      LIMIT 1;
    IF v_category_id IS NULL THEN
      v_category_id := gen_random_uuid()::text;
      INSERT INTO public.categories (id, name, icon, type, user_id, household_id, is_system)
      VALUES (v_category_id, v_category_name, 'Sparkles', CASE WHEN v_transaction_type = 'income' THEN 'income' ELSE 'expense' END, v_current_user_id, v_household_id, false);
    END IF;

    SELECT w.id INTO v_wallet_id FROM public.wallets w
      WHERE w.household_id = v_household_id AND lower(w.name) = lower(v_wallet_name) AND w.archived_at IS NULL
      LIMIT 1;
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, household_id, name, type, balance)
      VALUES (v_current_user_id, v_household_id, v_wallet_name, 'cash', 0)
      RETURNING id INTO v_wallet_id;
    END IF;

    PERFORM 1 FROM public.wallets AS locked_wallet WHERE locked_wallet.id = v_wallet_id FOR UPDATE;
    INSERT INTO public.transactions (user_id, wallet_id, amount, type, category, notes, spent_by, transaction_date, wallet_name)
    VALUES (v_current_user_id, v_wallet_id, v_transaction_amount, v_transaction_type, v_category_id, v_notes, v_spent_by, v_transaction_date, v_wallet_name);
    UPDATE public.wallets AS target_wallet
    SET balance = target_wallet.balance + CASE WHEN v_transaction_type = 'income' THEN v_transaction_amount ELSE -v_transaction_amount END
    WHERE target_wallet.id = v_wallet_id;
    v_created_count := v_created_count + 1;
  END LOOP;

  RETURN jsonb_build_object('imported', v_created_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_transactions(jsonb) TO authenticated;
