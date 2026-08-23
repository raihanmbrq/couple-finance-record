-- Add receipt_url column to transactions table for receipt attachments.
ALTER TABLE public.transactions ADD COLUMN receipt_url text;