-- Migration: Add withdrawal_seq_id to withdrawals table
-- Run this in your Supabase SQL Editor

-- 1. Add withdrawal_seq_id column
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS withdrawal_seq_id BIGINT;

-- 2. Backfill existing records with sequential IDs (T-1, T-2, T-3...) ordered by creation time
WITH numbered_withdrawals AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as seq_num
  FROM public.withdrawals
)
UPDATE public.withdrawals w
SET withdrawal_seq_id = numbered_withdrawals.seq_num
FROM numbered_withdrawals
WHERE w.id = numbered_withdrawals.id 
  AND (w.withdrawal_seq_id IS NULL OR w.withdrawal_seq_id = 0);

-- 3. Create index for fast sequence ordering and lookups
CREATE INDEX IF NOT EXISTS idx_withdrawals_seq_id 
ON public.withdrawals(withdrawal_seq_id DESC NULLS LAST);

