-- ==============================================================================
-- MIGRATION: Re-show & Re-claim UGC Reddit Post / Crosspost Tasks After Cooldown
-- ==============================================================================
-- PURPOSE:
--   1. For UGC Reddit tasks where task_type IN ('post', 'crosspost'):
--      - Hides the task in get_available_tasks_secure and blocks re-claiming in
--        claim_task_secure while the claim is actively in progress ('claimed' < 1h)
--        or within its cooldown period (20 hours for 'post', 24 hours for 'crosspost').
--      - Once the cooldown period expires, the task reappears and can be claimed
--        again if slots remain (rejected claims remain permanently hidden).
--   2. For ALL Admin-Given tasks, UGC non-post/crosspost tasks (e.g. comments),
--      karma farm, and other platforms:
--      - Preserves the permanent hide/block once claimed.
--   3. Preserves shared 20h (post) and 24h (crosspost) cooldowns across both
--      Admin-Given and UGC on the active Reddit account.
--   4. Preserves all prior fixes: strict per-account Reddit tag scoping,
--      platform isolation (p_platform), facebook support, admin_lookup_status
--      filtering, and time-aware 1h expiration handling.
-- ==============================================================================

-- Helper predicate note (inline in both functions):
--   UGC task = LOWER(COALESCE(t.title, '')) LIKE 'user-generated%'
--           OR LOWER(COALESCE(t.title, '')) LIKE 'ugc%'
--           OR LOWER(COALESCE(t.task_category, '')) = 'ugc'

-- ------------------------------------------------------------------------------
-- 1. UPDATE get_available_tasks_secure
-- ------------------------------------------------------------------------------
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
  v_one_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
BEGIN
  -- Collect verified subreddit tag IDs ONLY for the active verified reddit account and user profile
  IF p_reddit_account_id IS NOT NULL THEN
    SELECT COALESCE(ARRAY_AGG(DISTINCT sub_id), '{}'::UUID[]) INTO v_tag_ids
    FROM (
      SELECT ras.subreddit_id AS sub_id
      FROM public.reddit_account_subreddits ras
      JOIN public.reddit_accounts ra ON ras.reddit_account_id = ra.id
      WHERE ra.id = p_reddit_account_id
        AND ra.user_id = p_user_id
        AND ra.status = 'verified'

      UNION

      SELECT u.assigned_tag_id AS sub_id
      FROM public.users u
      WHERE u.id = p_user_id AND u.assigned_tag_id IS NOT NULL
    ) tags_query;
  ELSIF p_user_id IS NOT NULL THEN
    SELECT COALESCE(ARRAY_AGG(DISTINCT u.assigned_tag_id), '{}'::UUID[]) INTO v_tag_ids
    FROM public.users u
    WHERE u.id = p_user_id AND u.assigned_tag_id IS NOT NULL;
  END IF;

  RETURN QUERY
  WITH task_claim_counts AS (
    -- Time-aware active claim count (exclude 'claimed' older than 1 hour)
    SELECT tc.task_id, COUNT(*)::INT AS active_count
    FROM public.task_claims tc
    WHERE tc.status IN ('claimed', 'submitted', 'approved')
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
    GROUP BY tc.task_id
  ),
  karma_farm_claimed AS (
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE COALESCE(t.task_category, 'standard') = 'karma_farm'
  ),
  user_has_claimed AS (
    -- Reddit claims:
    --   - UGC 'post' and 'crosspost' tasks are hidden only while active/rejected/on cooldown
    --   - All other Reddit tasks (Admin Given, UGC comments/upvotes, etc.) stay hidden permanently
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND p_reddit_account_id IS NOT NULL
      AND COALESCE(t.platform, 'reddit') = 'reddit'
      AND (
        CASE
          WHEN COALESCE(t.task_category, 'standard') != 'karma_farm'
            AND t.task_type::text IN ('post', 'crosspost')
            AND (
              LOWER(COALESCE(t.title, '')) LIKE 'user-generated%'
              OR LOWER(COALESCE(t.title, '')) LIKE 'ugc%'
              OR LOWER(COALESCE(t.task_category, '')) = 'ugc'
            )
          THEN (
            tc.status = 'rejected'
            OR (tc.status = 'claimed' AND tc.claimed_at >= v_one_hour_ago)
            OR (
              tc.status IN ('submitted', 'approved')
              AND (
                (t.task_type::text = 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= NOW() - INTERVAL '20 hours')
                OR (t.task_type::text = 'crosspost' AND COALESCE(tc.submitted_at, tc.claimed_at) >= NOW() - INTERVAL '24 hours')
              )
            )
          )
          ELSE (
            tc.status != 'expired'
            AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
          )
        END
      )
    UNION
    -- Block YouTube claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.youtube_account_id = p_youtube_account_id
      AND p_youtube_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
      AND t.platform = 'youtube'
    UNION
    -- Block X claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.x_account_id = p_x_account_id
      AND p_x_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
      AND (t.platform = 'x' OR t.platform = 'twitter')
    UNION
    -- Block Quora claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.quora_account_id = p_quora_account_id
      AND p_quora_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
      AND t.platform = 'quora'
    UNION
    -- Block Instagram claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.instagram_account_id = p_instagram_account_id
      AND p_instagram_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
      AND t.platform = 'instagram'
    UNION
    -- Block LinkedIn claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.linkedin_account_id = p_linkedin_account_id
      AND p_linkedin_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
      AND t.platform = 'linkedin'
    UNION
    -- Block Facebook claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.facebook_account_id = p_facebook_account_id
      AND p_facebook_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago)
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
  WHERE t.status IN ('available', 'claimed')
    AND (t.admin_lookup_status IS NULL OR t.admin_lookup_status NOT IN ('pending', 'hidden'))
    -- Strict platform isolation filter
    AND (
      p_platform IS NULL OR
      (LOWER(p_platform) = 'reddit' AND (t.platform IS NULL OR LOWER(t.platform) = 'reddit')) OR
      (LOWER(p_platform) IN ('x', 'twitter') AND LOWER(t.platform) IN ('x', 'twitter')) OR
      (LOWER(t.platform) = LOWER(p_platform))
    )
    -- Strict tag match for Reddit only
    AND (
      COALESCE(t.platform, 'reddit') != 'reddit' OR
      t.subreddit_id IS NULL OR
      (v_tag_ids != '{}'::UUID[] AND t.subreddit_id = ANY(v_tag_ids))
    )
    AND uhc.task_id IS NULL
    AND kfc.task_id IS NULL
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. UPDATE claim_task_secure
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
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
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_status TEXT;
  v_max_claims INT;
  v_active_claims INT;
  v_platform TEXT;
  v_task_type TEXT;
  v_task_category TEXT;
  v_title TEXT;
  v_post_link TEXT;
  v_scheduled_for TIMESTAMPTZ;
  v_has_claimed_this_task INT;
  v_blocking_claims INT;
  v_same_post_claims INT;
  v_is_ugc_reddit_post_or_crosspost BOOLEAN := FALSE;
  v_one_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
BEGIN
  -- 0. Eagerly mark expired claims for THIS task before any checks
  UPDATE public.task_claims
  SET status = 'expired'
  WHERE task_id = p_task_id
    AND status = 'claimed'
    AND claimed_at < v_one_hour_ago;

  IF FOUND THEN
    PERFORM public.sync_task_status_secure(p_task_id);
  END IF;

  -- 1. Get task details with row lock
  SELECT
    status, max_claims, COALESCE(platform, 'reddit'), task_type,
    COALESCE(task_category, 'standard'), title, post_link, scheduled_for
  INTO
    v_task_status, v_max_claims, v_platform, v_task_type,
    v_task_category, v_title, v_post_link, v_scheduled_for
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT;
    RETURN;
  END IF;

  v_is_ugc_reddit_post_or_crosspost := (
    v_platform = 'reddit'
    AND v_task_category != 'karma_farm'
    AND v_task_type IN ('post', 'crosspost')
    AND (
      LOWER(COALESCE(v_title, '')) LIKE 'user-generated%'
      OR LOWER(COALESCE(v_title, '')) LIKE 'ugc%'
      OR LOWER(COALESCE(v_task_category, '')) = 'ugc'
    )
  );

  -- 2. Check scheduled release
  IF v_scheduled_for IS NOT NULL AND v_scheduled_for > NOW() THEN
    RETURN QUERY SELECT FALSE, 'This task is scheduled for a future release.'::TEXT;
    RETURN;
  END IF;

  -- 3. Check slots remaining (excluding time-expired 'claimed' records)
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND status IN ('claimed', 'submitted', 'approved')
    AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  IF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    RETURN QUERY SELECT FALSE, 'This task has no remaining slots available.'::TEXT;
    RETURN;
  END IF;

  -- 4. Check if user already claimed this specific task on active account
  IF v_platform = 'facebook' THEN
    IF p_facebook_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Facebook account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND facebook_account_id = p_facebook_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSIF v_platform = 'linkedin' THEN
    IF p_linkedin_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified LinkedIn account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND linkedin_account_id = p_linkedin_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSIF v_platform = 'instagram' THEN
    IF p_instagram_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Instagram account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND instagram_account_id = p_instagram_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSIF v_platform = 'quora' THEN
    IF p_quora_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Quora account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND quora_account_id = p_quora_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSIF v_platform = 'x' THEN
    IF p_x_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified X account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND x_account_id = p_x_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSIF v_platform = 'youtube' THEN
    IF p_youtube_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified YouTube account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND youtube_account_id = p_youtube_account_id
      AND status IN ('claimed', 'submitted', 'approved')
      AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);

  ELSE -- reddit
    IF p_reddit_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Reddit account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    IF v_is_ugc_reddit_post_or_crosspost THEN
      -- For UGC post/crosspost: only block while active ('claimed' < 1h), rejected, or within cooldown
      SELECT COUNT(*)::INT INTO v_has_claimed_this_task
      FROM public.task_claims
      WHERE task_id = p_task_id
        AND reddit_account_id = p_reddit_account_id
        AND (
          status = 'rejected'
          OR (status = 'claimed' AND claimed_at >= v_one_hour_ago)
          OR (
            status IN ('submitted', 'approved')
            AND (
              (v_task_type = 'post' AND COALESCE(submitted_at, claimed_at) >= NOW() - INTERVAL '20 hours')
              OR (v_task_type = 'crosspost' AND COALESCE(submitted_at, claimed_at) >= NOW() - INTERVAL '24 hours')
            )
          )
        );
    ELSE
      SELECT COUNT(*)::INT INTO v_has_claimed_this_task
      FROM public.task_claims
      WHERE task_id = p_task_id
        AND reddit_account_id = p_reddit_account_id
        AND status IN ('claimed', 'submitted', 'approved')
        AND NOT (status = 'claimed' AND claimed_at < v_one_hour_ago);
    END IF;
  END IF;

  IF v_has_claimed_this_task > 0 THEN
    RETURN QUERY SELECT FALSE, 'You have already claimed or completed this task.'::TEXT;
    RETURN;
  END IF;

  -- 5. Block if the user has another task actively in progress on this platform
  IF v_platform = 'facebook' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE facebook_account_id = p_facebook_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSIF v_platform = 'linkedin' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE linkedin_account_id = p_linkedin_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSIF v_platform = 'instagram' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE instagram_account_id = p_instagram_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSIF v_platform = 'quora' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE quora_account_id = p_quora_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSIF v_platform = 'x' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE x_account_id = p_x_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSIF v_platform = 'youtube' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE youtube_account_id = p_youtube_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  ELSE
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE reddit_account_id = p_reddit_account_id AND status = 'claimed' AND claimed_at >= v_one_hour_ago;
  END IF;

  IF v_blocking_claims > 0 THEN
    RETURN QUERY SELECT FALSE, 'You already have a task in progress on this platform. Complete or wait for it to expire.'::TEXT;
    RETURN;
  END IF;

  -- 6. Duplicate action on same post check (exempt UGC Reddit crosspost after cooldown)
  IF v_post_link IS NOT NULL AND v_post_link != '' AND v_task_type NOT IN ('post', 'answer', 'repost', 'text', 'image', 'video') AND NOT v_is_ugc_reddit_post_or_crosspost THEN
    IF v_platform = 'facebook' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.facebook_account_id = p_facebook_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSIF v_platform = 'linkedin' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.linkedin_account_id = p_linkedin_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSIF v_platform = 'instagram' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.instagram_account_id = p_instagram_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSIF v_platform = 'quora' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.quora_account_id = p_quora_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSIF v_platform = 'x' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.x_account_id = p_x_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSIF v_platform = 'youtube' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.youtube_account_id = p_youtube_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    ELSE
      SELECT COUNT(*)::INT INTO v_same_post_claims FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved') AND NOT (tc.status = 'claimed' AND tc.claimed_at < v_one_hour_ago);
    END IF;

    IF v_same_post_claims > 0 THEN
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this link/post.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 7. Platform-specific Cooldowns (shared across Admin-Given and UGC on the same account)
  IF v_platform = 'reddit' AND v_task_category != 'karma_farm' THEN
    IF v_task_type = 'comment' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id AND tc.status IN ('approved', 'submitted')
          AND COALESCE(t.task_category, 'standard') != 'karma_farm'
          AND t.task_type = 'comment' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 2 THEN
          RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'post' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id AND tc.status IN ('approved', 'submitted')
          AND COALESCE(t.task_category, 'standard') != 'karma_farm'
          AND t.task_type = 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Post limit reached: You can only complete 1 post task every 20 hours on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'crosspost' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id AND tc.status IN ('approved', 'submitted')
          AND COALESCE(t.task_category, 'standard') != 'karma_farm'
          AND t.task_type = 'crosspost' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '24 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Crosspost limit reached: You can only complete 1 crosspost task every 24 hours on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'upvote' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id AND tc.status IN ('approved', 'submitted')
          AND COALESCE(t.task_category, 'standard') != 'karma_farm'
          AND t.task_type = 'upvote' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 5 THEN
          RETURN QUERY SELECT FALSE, 'Upvote limit reached: You can only complete 5 upvote tasks per hour on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    END IF;

  ELSIF v_platform = 'youtube' THEN
    DECLARE v_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_count
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.youtube_account_id = p_youtube_account_id AND tc.status IN ('approved', 'submitted')
        AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
      IF v_count >= 1 THEN
        RETURN QUERY SELECT FALSE, ('YouTube cooldown active: You can only complete 1 ' || REPLACE(v_task_type, '_', ' ') || ' task every 20 hours for this account.')::TEXT;
        RETURN;
      END IF;
    END;

  ELSIF v_platform = 'x' THEN
    IF v_task_type = 'post' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'X Post limit reached: You can only complete 1 post task every 20 hours on this X account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type != 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 2 THEN
          RETURN QUERY SELECT FALSE, 'X Action limit reached: You can only complete 2 tasks per hour on this X account.'::TEXT;
          RETURN;
        END IF;
      END;
    END IF;

  ELSIF v_platform = 'quora' THEN
    DECLARE v_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_count
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.quora_account_id = p_quora_account_id AND tc.status IN ('approved', 'submitted')
        AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
      IF v_count >= 3 THEN
        RETURN QUERY SELECT FALSE, ('Quora Action limit reached: You can only complete 3 ' || REPLACE(v_task_type, '_', ' ') || ' tasks per hour on this Quora account.')::TEXT;
        RETURN;
      END IF;
    END;

  ELSIF v_platform = 'instagram' THEN
    IF v_task_type = 'post' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.instagram_account_id = p_instagram_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Instagram Post limit reached: You can only complete 1 post task every 20 hours on this Instagram account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.instagram_account_id = p_instagram_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 3 THEN
          RETURN QUERY SELECT FALSE, ('Instagram Action limit reached: You can only complete 3 ' || REPLACE(v_task_type, '_', ' ') || ' tasks per hour on this Instagram account.')::TEXT;
          RETURN;
        END IF;
      END;
    END IF;

  ELSIF v_platform = 'linkedin' THEN
    IF v_task_type IN ('post', 'repost') THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.linkedin_account_id = p_linkedin_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, ('LinkedIn ' || INITCAP(v_task_type) || ' limit reached: You can only complete 1 ' || v_task_type || ' task every 20 hours on this LinkedIn account.')::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.linkedin_account_id = p_linkedin_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 3 THEN
          RETURN QUERY SELECT FALSE, ('LinkedIn Action limit reached: You can only complete 3 ' || REPLACE(v_task_type, '_', ' ') || ' tasks per hour on this LinkedIn account.')::TEXT;
          RETURN;
        END IF;
      END;
    END IF;

  ELSIF v_platform = 'facebook' THEN
    IF v_task_type = 'post' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.facebook_account_id = p_facebook_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post' AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Facebook Post limit reached: You can only complete 1 post task every 20 hours on this Facebook account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.facebook_account_id = p_facebook_account_id AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 3 THEN
          RETURN QUERY SELECT FALSE, ('Facebook Action limit reached: You can only complete 3 ' || REPLACE(v_task_type, '_', ' ') || ' tasks per hour on this Facebook account.')::TEXT;
          RETURN;
        END IF;
      END;
    END IF;
  END IF;

  -- 8. Eagerly expire ALL stale 'claimed' records for this user's account
  IF v_platform = 'facebook' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE facebook_account_id = p_facebook_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSIF v_platform = 'linkedin' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE linkedin_account_id = p_linkedin_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSIF v_platform = 'instagram' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE instagram_account_id = p_instagram_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSIF v_platform = 'quora' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE quora_account_id = p_quora_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSIF v_platform = 'x' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE x_account_id = p_x_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSIF v_platform = 'youtube' THEN
    UPDATE public.task_claims SET status = 'expired'
    WHERE youtube_account_id = p_youtube_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  ELSE
    UPDATE public.task_claims SET status = 'expired'
    WHERE reddit_account_id = p_reddit_account_id AND status = 'claimed' AND claimed_at < v_one_hour_ago;
  END IF;

  -- 9. Insert the claim into task_claims
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    x_account_id,
    quora_account_id,
    instagram_account_id,
    linkedin_account_id,
    facebook_account_id,
    status
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    p_youtube_account_id,
    p_x_account_id,
    p_quora_account_id,
    p_instagram_account_id,
    p_linkedin_account_id,
    p_facebook_account_id,
    'claimed'
  );

  -- 10. Update task status if all slots filled
  IF (v_active_claims + 1) >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks
    SET status = 'claimed'
    WHERE id = p_task_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'Task claimed successfully.'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, ('Claim processing error: ' || SQLERRM)::TEXT;
END;
$$;
