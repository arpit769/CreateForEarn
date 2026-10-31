-- ==============================================================================
-- Migration: Add Premium Tags to Reddit Accounts
-- ==============================================================================
-- Adds premium tagging support to reddit_accounts table to support extra
-- task completion bonuses and expedited payout times.
--
-- Tiers:
--   'elite'    -> 💎 Elite / Diamond (+ $0.50 bonus, Instant Fast-Track < 2h)
--   'high'     -> 🟢 High Tier       (+ $0.30 bonus, Priority Queue < 6h)
--   'moderate' -> 🔵 Moderate Tier   (+ $0.15 bonus, Expedited < 24h)
--   'low'      -> 🟡 Low Tier        (+ $0.05 bonus, Standard < 48h)
--   'none'     -> ⚪ Standard / None (Normal rates)
-- ==============================================================================

-- 1. Add premium_tag column with default 'none'
ALTER TABLE public.reddit_accounts 
ADD COLUMN IF NOT EXISTS premium_tag TEXT DEFAULT 'none';

-- 2. Add optional custom bonus rate override
ALTER TABLE public.reddit_accounts 
ADD COLUMN IF NOT EXISTS custom_bonus_rate NUMERIC(10, 2) DEFAULT NULL;

-- 3. Create index for fast tier filtering and joins
CREATE INDEX IF NOT EXISTS idx_reddit_accounts_premium_tag 
ON public.reddit_accounts(premium_tag);

-- 4. Enable admin update policy on reddit_accounts if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reddit_accounts' AND policyname = 'Admins can update premium_tags'
    ) THEN
        CREATE POLICY "Admins can update premium_tags" ON public.reddit_accounts
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

