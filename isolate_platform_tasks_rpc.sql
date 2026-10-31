-- ==============================================================================
-- MIGRATION: Isolate Platform Tasks in get_available_tasks_secure
-- ==============================================================================
-- PURPOSE:
-- Ensures that tasks for each platform are strictly scoped to their respective
-- platform so that Reddit tasks are never visible on X, YouTube tasks only on YouTube, etc.
-- Adds optional p_platform parameter (e.g. 'reddit', 'x', 'youtube', etc.).
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL,
  p_quora_account_id UUID DEFAULT NULL,
  p_instagram_account_id UUID DEFAULT NULL,
  p_linkedin_account_id UUID DEFAULT NULL,
  p_facebook_account_id UUID DEFAULT NULL,
  p_platform TEXT DEFAULT NULL
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
      AND (t.platform = 'x' OR t.platform = 'twitter')
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
    UNION
    -- Block Facebook claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.facebook_account_id = p_facebook_account_id
      AND p_facebook_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'facebook'
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
    -- Strict platform isolation filter
    AND (
      p_platform IS NULL OR
      (LOWER(p_platform) = 'reddit' AND (t.platform IS NULL OR LOWER(t.platform) = 'reddit')) OR
      (LOWER(p_platform) IN ('x', 'twitter') AND LOWER(t.platform) IN ('x', 'twitter')) OR
      (LOWER(t.platform) = LOWER(p_platform))
    )
    -- Platform permissions check
    AND (
      t.platform IN ('youtube', 'x', 'quora', 'instagram', 'linkedin', 'facebook') OR 
      t.subreddit_id IS NULL OR 
      t.subreddit_id = ANY(v_tag_ids)
    )
    AND uhc.task_id IS NULL
    AND kfc.task_id IS NULL
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
