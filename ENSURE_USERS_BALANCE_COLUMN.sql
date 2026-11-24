-- ============================================================================
-- SQL Helper: Ensure `balance` column exists on `public.users` table
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================================

-- 1. Safely add `balance` column to users table if not already added
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2) DEFAULT 0.00;

-- 2. Backfill existing balances from `task_rates` JSONB
--    If an admin topped up a client's account previously, their balance
--    was stored in task_rates->>'balance'. This synchronizes it to the column.
UPDATE public.users
SET balance = COALESCE(
  NULLIF((task_rates->>'balance')::NUMERIC, 0),
  balance,
  0.00
)
WHERE task_rates IS NOT NULL 
  AND task_rates ? 'balance'
  AND (task_rates->>'balance')::NUMERIC > 0
  AND (balance IS NULL OR balance = 0);

-- 3. Ensure authenticated clients can view their own profile and balance
GRANT SELECT(id, full_name, email, role, balance, task_rates, assigned_tag_id, assigned_tag_name) 
ON public.users TO authenticated;

-- 4. Verification query: view all clients and their live balances
SELECT id, full_name, email, role, balance, task_rates->>'balance' AS jsonb_balance
FROM public.users
WHERE role = 'client';
