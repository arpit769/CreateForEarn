-- ==============================================================================
-- Supabase SQL Migration: LinkedIn Platform Integration
-- Run this in your Supabase SQL Editor!
-- ==============================================================================

-- 1. Create task_type_enum values if they don't exist
DO $$
BEGIN
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'connect';
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'share';
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'reaction';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Create linkedin_accounts table
CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  headline TEXT,
  connections_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'verified', 'rejected', 'banned'
  rejection_reason TEXT,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_linkedin_username UNIQUE (username)
);

-- 3. Add active_linkedin_account_id to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active_linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE SET NULL;

-- 4. Add linkedin_account_id to task_claims
ALTER TABLE public.task_claims
ADD COLUMN IF NOT EXISTS linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE CASCADE;

-- 5. Enable RLS on linkedin_accounts
ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Policies for linkedin_accounts
DROP POLICY IF EXISTS "Users can view their own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can view their own linkedin accounts"
  ON public.linkedin_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Admins can view all linkedin accounts"
  ON public.linkedin_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can insert their own linkedin accounts"
  ON public.linkedin_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can delete their own linkedin accounts"
  ON public.linkedin_accounts FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Admins can update linkedin accounts"
  ON public.linkedin_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 7. Update get_available_tasks_secure function to support LinkedIn tasks
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL,
  p_quora_account_id UUID DEFAULT NULL,
  p_instagram_account_id UUID DEFAULT NULL,
  p_linkedin_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT,
  task_category TEXT,
  task_type TEXT,
  content_mode TEXT,
  subreddit_id UUID,
  subreddit_name TEXT,
  post_link TEXT,
  instructions TEXT,
  content_body TEXT,
  flair TEXT,
  image_url TEXT,
  payment_amount NUMERIC,
  max_claims INT,
  due_date TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT,
  task_seq_id INT,
  active_claims_count INT,
  slots_remaining INT,
  platform TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tag_ids UUID[] := '{}'::UUID[];
BEGIN
  -- Get verified subreddit tag IDs for the active reddit account (if provided)
  IF p_reddit_account_id IS NOT NULL THEN
    SELECT COALESCE(ARRAY_AGG(ras.subreddit_id), '{}'::UUID[]) INTO v_tag_ids
    FROM public.reddit_account_subreddits ras
    JOIN public.reddit_accounts ra ON ras.reddit_account_id = ra.id
    WHERE ra.id = p_reddit_account_id AND ra.status = 'verified';
  END IF;

  RETURN QUERY
  WITH task_claim_counts AS (
    SELECT tc.task_id, COUNT(*)::INT AS active_count
    FROM public.task_claims tc
    WHERE tc.status IN ('claimed', 'submitted', 'approved')
    GROUP BY tc.task_id
  ),
  karma_farm_claimed AS (
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE COALESCE(t.task_category, 'standard') = 'karma_farm'
  ),
  user_has_claimed AS (
    -- Block Reddit claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND p_reddit_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND COALESCE(t.platform, 'reddit') = 'reddit'
    UNION
    -- Block YouTube claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.youtube_account_id = p_youtube_account_id
      AND p_youtube_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'youtube'
    UNION
    -- Block X claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.x_account_id = p_x_account_id
      AND p_x_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'x'
    UNION
    -- Block Quora claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.quora_account_id = p_quora_account_id
      AND p_quora_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'quora'
    UNION
    -- Block Instagram claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.instagram_account_id = p_instagram_account_id
      AND p_instagram_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'instagram'
    UNION
    -- Block LinkedIn claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.linkedin_account_id = p_linkedin_account_id
      AND p_linkedin_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'linkedin'
  )
  SELECT 
    t.id,
    t.created_at,
    t.title,
    t.task_category::TEXT,
    t.task_type::TEXT,
    t.content_mode::TEXT,
    t.subreddit_id,
    s.name AS subreddit_name,
    t.post_link,
    t.instructions,
    t.content_body,
    t.flair,
    t.image_url,
    t.payment_amount::NUMERIC,
    t.max_claims,
    t.due_date,
    t.scheduled_for,
    t.status::TEXT,
    t.task_seq_id,
    COALESCE(cc.active_count, 0) AS active_claims_count,
    GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) AS slots_remaining,
    COALESCE(t.platform, 'reddit') AS platform
  FROM public.tasks t
  LEFT JOIN public.subreddits s ON t.subreddit_id = s.id
  LEFT JOIN task_claim_counts cc ON t.id = cc.task_id
  LEFT JOIN user_has_claimed uhc ON t.id = uhc.task_id
  LEFT JOIN karma_farm_claimed kfc ON t.id = kfc.task_id
  WHERE t.status = 'available'
    -- Platform permissions check
    AND (
      t.platform IN ('youtube', 'x', 'quora', 'instagram', 'linkedin') OR 
      t.subreddit_id IS NULL OR 
      t.subreddit_id = ANY(v_tag_ids)
    )
    AND uhc.task_id IS NULL
    AND kfc.task_id IS NULL
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
