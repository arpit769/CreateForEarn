-- ==============================================================================
-- UNIVERSAL DATABASE FIX FOR ALL 6 PLATFORMS
-- (Reddit, YouTube, X, Quora, Instagram, LinkedIn)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENSURE ALL TASK_CLAIMS PLATFORM COLUMNS EXIST
-- ------------------------------------------------------------------------------
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS reddit_account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS youtube_account_id UUID REFERENCES public.youtube_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS x_account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS quora_account_id UUID REFERENCES public.quora_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE SET NULL;


-- ------------------------------------------------------------------------------
-- 2. DROP PREVIOUS FUNCTION SIGNATURES TO PREVENT SIGNATURE/CACHE CONFLICTS
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid);

DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);


-- ------------------------------------------------------------------------------
-- 3. FUNCTION: get_available_tasks_secure (All 6 Platforms)
-- ------------------------------------------------------------------------------
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
    -- Platform filter
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


-- ------------------------------------------------------------------------------
-- 4. FUNCTION: claim_task_secure (All 6 Platforms with exact existing cooldowns)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL,
  p_quora_account_id UUID DEFAULT NULL,
  p_instagram_account_id UUID DEFAULT NULL,
  p_linkedin_account_id UUID DEFAULT NULL
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
  v_post_link TEXT;
  v_scheduled_for TIMESTAMPTZ;
  v_has_claimed_this_task INT;
  v_blocking_claims INT;
  v_same_post_claims INT;
BEGIN
  -- 1. Get task details
  SELECT status, max_claims, COALESCE(platform, 'reddit'), task_type, COALESCE(task_category, 'standard'), post_link, scheduled_for
  INTO v_task_status, v_max_claims, v_platform, v_task_type, v_task_category, v_post_link, v_scheduled_for
  FROM public.tasks
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT;
    RETURN;
  END IF;

  -- 2. Check scheduled release
  IF v_scheduled_for IS NOT NULL AND v_scheduled_for > NOW() THEN
    RETURN QUERY SELECT FALSE, 'This task is scheduled for a future release.'::TEXT;
    RETURN;
  END IF;

  -- 3. Check slots remaining
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND status IN ('claimed', 'submitted', 'approved');

  IF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    RETURN QUERY SELECT FALSE, 'This task has no remaining slots available.'::TEXT;
    RETURN;
  END IF;

  -- 4. Check if user already claimed this specific task on active account
  IF v_platform = 'linkedin' THEN
    IF p_linkedin_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified LinkedIn account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND linkedin_account_id = p_linkedin_account_id
      AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'instagram' THEN
    IF p_instagram_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Instagram account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND instagram_account_id = p_instagram_account_id
      AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'quora' THEN
    IF p_quora_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Quora account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND quora_account_id = p_quora_account_id
      AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'x' THEN
    IF p_x_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified X account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND x_account_id = p_x_account_id
      AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'youtube' THEN
    IF p_youtube_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified YouTube account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND youtube_account_id = p_youtube_account_id
      AND status IN ('claimed', 'submitted', 'approved');

  ELSE -- reddit
    IF p_reddit_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Reddit account is required to claim this task.'::TEXT;
      RETURN;
    END IF;

    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND reddit_account_id = p_reddit_account_id
      AND status IN ('claimed', 'submitted', 'approved');
  END IF;

  IF v_has_claimed_this_task > 0 THEN
    RETURN QUERY SELECT FALSE, 'You have already claimed or completed this task.'::TEXT;
    RETURN;
  END IF;

  -- 5. Block if the user has another task actively in progress on this platform
  IF v_platform = 'linkedin' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE linkedin_account_id = p_linkedin_account_id
      AND status = 'claimed';
  ELSIF v_platform = 'instagram' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE instagram_account_id = p_instagram_account_id
      AND status = 'claimed';
  ELSIF v_platform = 'quora' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE quora_account_id = p_quora_account_id
      AND status = 'claimed';
  ELSIF v_platform = 'x' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE x_account_id = p_x_account_id
      AND status = 'claimed';
  ELSIF v_platform = 'youtube' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE youtube_account_id = p_youtube_account_id
      AND status = 'claimed';
  ELSE
    SELECT COUNT(*)::INT INTO v_blocking_claims
    FROM public.task_claims
    WHERE reddit_account_id = p_reddit_account_id
      AND status = 'claimed';
  END IF;

  IF v_blocking_claims > 0 THEN
    RETURN QUERY SELECT FALSE, 'You already have a task in progress on this platform. Complete or wait for it to expire.'::TEXT;
    RETURN;
  END IF;

  -- 6. Duplicate action on same post check
  IF v_post_link IS NOT NULL AND v_post_link != '' AND v_task_type NOT IN ('post', 'answer', 'repost', 'text', 'image', 'video') THEN
    IF v_platform = 'linkedin' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.linkedin_account_id = p_linkedin_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'instagram' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.instagram_account_id = p_instagram_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'quora' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.quora_account_id = p_quora_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'x' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.x_account_id = p_x_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'youtube' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.youtube_account_id = p_youtube_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSE
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id
        AND t.post_link = v_post_link
        AND t.task_type::text = v_task_type
        AND tc.status IN ('claimed', 'submitted', 'approved');
    END IF;

    IF v_same_post_claims > 0 THEN
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this link/post.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 7. Platform-specific Cooldowns (preserving exact cooldown windows)
  IF v_platform = 'reddit' THEN
    IF v_task_type = 'comment' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'comment'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 2 THEN
          RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'post' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Post limit reached: You can only complete 1 post task every 20 hours on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'crosspost' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'crosspost'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '24 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Crosspost limit reached: You can only complete 1 crosspost task every 24 hours on this Reddit account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSIF v_task_type = 'upvote' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'upvote'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
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
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.youtube_account_id = p_youtube_account_id
        AND tc.status IN ('approved', 'submitted')
        AND t.task_type::text = v_task_type
        AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
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
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'X Post limit reached: You can only complete 1 post task every 20 hours on this X account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type != 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
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
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.quora_account_id = p_quora_account_id
        AND tc.status IN ('approved', 'submitted')
        AND t.task_type::text = v_task_type
        AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
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
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.instagram_account_id = p_instagram_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'Instagram Post limit reached: You can only complete 1 post task every 20 hours on this Instagram account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.instagram_account_id = p_instagram_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
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
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.linkedin_account_id = p_linkedin_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');
        IF v_count >= 1 THEN
          RETURN QUERY SELECT FALSE, ('LinkedIn ' || INITCAP(v_task_type) || ' limit reached: You can only complete 1 ' || v_task_type || ' task every 20 hours on this LinkedIn account.')::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.linkedin_account_id = p_linkedin_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');
        IF v_count >= 3 THEN
          RETURN QUERY SELECT FALSE, ('LinkedIn Action limit reached: You can only complete 3 ' || REPLACE(v_task_type, '_', ' ') || ' tasks per hour on this LinkedIn account.')::TEXT;
          RETURN;
        END IF;
      END;
    END IF;
  END IF;

  -- 8. Insert the claim into task_claims (without non-existent expires_at column)
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    x_account_id,
    quora_account_id,
    instagram_account_id,
    linkedin_account_id,
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
    'claimed'
  );

  -- 9. Update task status if all slots filled
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
