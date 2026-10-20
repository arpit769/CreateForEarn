-- ============================================================================
-- Migration: Fix Tag Filtering Scoping to Worker's Active Reddit Account
-- ============================================================================
-- Previously, get_available_tasks_secure collected tags across ALL reddit accounts
-- owned by the user (ra.user_id = p_user_id), which caused workers with multiple
-- reddit accounts to see tasks for other subreddit tags that were not assigned
-- to their currently active Reddit account.
-- This fix scopes tag collection strictly to the active verified reddit account
-- (ra.id = p_reddit_account_id) and user profile assigned_tag_id.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL,
  p_quora_account_id UUID DEFAULT NULL,
  p_instagram_account_id UUID DEFAULT NULL,
  p_linkedin_account_id UUID DEFAULT NULL,
  p_facebook_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
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
  due_date TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
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
  -- Collect verified subreddit tag IDs ONLY for the active verified reddit account and user profile
  IF p_reddit_account_id IS NOT NULL THEN
    SELECT COALESCE(ARRAY_AGG(DISTINCT sub_id), '{}'::UUID[]) INTO v_tag_ids
    FROM (
      -- Tags assigned via the active verified reddit account
      SELECT ras.subreddit_id AS sub_id
      FROM public.reddit_account_subreddits ras
      JOIN public.reddit_accounts ra ON ras.reddit_account_id = ra.id
      WHERE ra.id = p_reddit_account_id 
        AND ra.user_id = p_user_id 
        AND ra.status = 'verified'
      
      UNION
      
      -- Tag directly assigned on the user profile (if any)
      SELECT u.assigned_tag_id AS sub_id
      FROM public.users u
      WHERE u.id = p_user_id AND u.assigned_tag_id IS NOT NULL
    ) tags_query;
  ELSIF p_user_id IS NOT NULL THEN
    -- If no active reddit account provided, only check user-level assigned tag
    SELECT COALESCE(ARRAY_AGG(DISTINCT u.assigned_tag_id), '{}'::UUID[]) INTO v_tag_ids
    FROM public.users u
    WHERE u.id = p_user_id AND u.assigned_tag_id IS NOT NULL;
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
    -- STRICT TAG MATCH (REDDIT ONLY): Tag filtering is strictly enforced for Reddit tasks.
    -- All other platforms (YouTube, X, Quora, Instagram, LinkedIn, Facebook) are open for all workers!
    AND (
      COALESCE(t.platform, 'reddit') != 'reddit' OR 
      t.subreddit_id IS NULL OR 
      (v_tag_ids != '{}'::UUID[] AND t.subreddit_id = ANY(v_tag_ids))
    )
    AND uhc.task_id IS NULL
    AND kfc.task_id IS NULL
    AND (t.admin_lookup_status IS NULL OR t.admin_lookup_status NOT IN ('pending', 'hidden'))
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
