-- Add 'like' and 'comment_reply' to task_type_enum if they don't exist
ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'like';
ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'comment_reply';
ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'subscribe';

-- Add platform column to tasks table to distinguish between Reddit and YouTube tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'reddit';

-- Update get_available_tasks_secure function to allow YouTube tasks (where subreddit_id is NULL) to bypass the tag check if the platform is youtube
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid);
CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_reddit_account_id UUID
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
  v_tag_ids UUID[];
BEGIN
  -- Get verified subreddit tag IDs for the active reddit account
  SELECT COALESCE(ARRAY_AGG(ras.subreddit_id), '{}'::UUID[]) INTO v_tag_ids
  FROM public.reddit_account_subreddits ras
  JOIN public.reddit_accounts ra ON ras.reddit_account_id = ra.id
  WHERE ra.id = p_reddit_account_id AND ra.status = 'verified';

  RETURN QUERY
  WITH task_claim_counts AS (
    SELECT tc.task_id, COUNT(*)::INT AS active_count
    FROM public.task_claims tc
    WHERE tc.status IN ('claimed', 'submitted', 'approved')
    GROUP BY tc.task_id
  ),
  -- Karma farm tasks that have ANY claim (including expired) — these should never reappear
  karma_farm_claimed AS (
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE COALESCE(t.task_category, 'standard') = 'karma_farm'
  ),
  user_has_claimed AS (
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND tc.status != 'expired'
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
    t.platform
  FROM public.tasks t
  LEFT JOIN public.subreddits s ON t.subreddit_id = s.id
  LEFT JOIN task_claim_counts cc ON t.id = cc.task_id
  LEFT JOIN user_has_claimed uhc ON t.id = uhc.task_id
  LEFT JOIN karma_farm_claimed kfc ON t.id = kfc.task_id
  WHERE t.status = 'available'
    -- Filter by verified subreddits if reddit task, else open for youtube
    AND (
      t.platform = 'youtube' OR 
      t.subreddit_id IS NULL OR 
      t.subreddit_id = ANY(v_tag_ids)
    )
    -- Exclude tasks this reddit account has already claimed
    AND uhc.task_id IS NULL
    -- Exclude karma farm tasks that anyone has ever claimed
    AND kfc.task_id IS NULL
    -- Only show if there are slots remaining
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
