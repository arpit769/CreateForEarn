-- Multi-Comment Support Migration
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add assigned_comment_index column to task_claims table
ALTER TABLE public.task_claims 
ADD COLUMN IF NOT EXISTS assigned_comment_index INTEGER DEFAULT NULL;

-- 2. Drop existing claim_task_secure functions to ensure clean signature
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID);

-- 3. Create updated claim_task_secure with multi-comment atomic assignment
CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL
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
  v_already_claimed INT;
  v_blocking_claims INT;
  v_task_type TEXT;
  v_post_link TEXT;
  v_content_body TEXT;
  v_content_mode TEXT;
  v_task_category TEXT;
  v_platform TEXT;
  v_same_post_claims INT;
  v_time_now TIMESTAMP WITH TIME ZONE := NOW();
  v_thirty_min_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '30 minutes';
  v_is_multi_comment BOOLEAN := FALSE;
  v_comment_count INT := 0;
  v_assigned_comment_index INT := NULL;
BEGIN
  -- 1. Lock the task row to prevent concurrent race conditions
  SELECT 
    status, 
    max_claims, 
    task_type, 
    post_link, 
    content_body,
    content_mode,
    COALESCE(task_category, 'standard'), 
    COALESCE(platform, 'reddit')
  INTO 
    v_task_status, 
    v_max_claims, 
    v_task_type, 
    v_post_link, 
    v_content_body,
    v_content_mode,
    v_task_category, 
    v_platform
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT;
    RETURN;
  END IF;

  IF v_task_status != 'available' THEN
    RETURN QUERY SELECT FALSE, 'This task is no longer available.'::TEXT;
    RETURN;
  END IF;

  -- 2. Release expired claims for this specific task (lazy clean)
  UPDATE public.task_claims
  SET status = 'expired'
  WHERE task_id = p_task_id
    AND status = 'claimed'
    AND claimed_at < v_thirty_min_ago;

  -- 3. Check if this account already has an active claim
  IF v_platform = 'youtube' THEN
    SELECT COUNT(*)::INT INTO v_already_claimed
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND youtube_account_id = p_youtube_account_id
      AND status != 'expired';
  ELSE
    SELECT COUNT(*)::INT INTO v_already_claimed
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND reddit_account_id = p_reddit_account_id
      AND status != 'expired';
  END IF;

  IF v_already_claimed > 0 THEN
    RETURN QUERY SELECT FALSE, 'You have already claimed this task.'::TEXT;
    RETURN;
  END IF;

  -- 4. Count current active claims for this task
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND status IN ('claimed', 'submitted', 'approved');

  IF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
    RETURN QUERY SELECT FALSE, 'All slots for this task have already been claimed.'::TEXT;
    RETURN;
  END IF;

  -- 5. Block if the user has another task actively in progress (claimed but not yet submitted)
  IF v_platform = 'youtube' THEN
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

  -- 6. Same post limit check for upvote/like/comment tasks
  IF (v_task_type IN ('upvote', 'comment', 'like', 'comment_reply', 'subscribe')) AND v_post_link IS NOT NULL AND v_post_link != '' THEN
    IF v_platform = 'youtube' THEN
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
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this post/channel.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 7. Cooldown checks (count both approved and submitted tasks within cooldown window)
  IF v_platform = 'reddit' THEN
      -- Comment limit: 2 approved/submitted comment tasks per rolling 1 hour
      IF v_task_type = 'comment' THEN
        DECLARE
          v_comment_count_cooldown INT;
        BEGIN
          SELECT COUNT(*)::INT INTO v_comment_count_cooldown
          FROM public.task_claims tc
          JOIN public.tasks t ON tc.task_id = t.id
          WHERE tc.reddit_account_id = p_reddit_account_id
            AND tc.status IN ('approved', 'submitted')
            AND t.task_type = 'comment'
            AND COALESCE(t.task_category, 'standard') = v_task_category
            AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');

          IF v_comment_count_cooldown >= 2 THEN
            RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour.'::TEXT;
            RETURN;
          END IF;
        END;

      -- Post limit: 1 approved/submitted post task per rolling 20 hours
      ELSIF v_task_type = 'post' THEN
        DECLARE
          v_post_count INT;
        BEGIN
          SELECT COUNT(*)::INT INTO v_post_count
          FROM public.task_claims tc
          JOIN public.tasks t ON tc.task_id = t.id
          WHERE tc.reddit_account_id = p_reddit_account_id
            AND tc.status IN ('approved', 'submitted')
            AND t.task_type = 'post'
            AND COALESCE(t.task_category, 'standard') = v_task_category
            AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');

          IF v_post_count >= 1 THEN
            RETURN QUERY SELECT FALSE, 'Post limit reached: You can only complete 1 post task every 20 hours.'::TEXT;
            RETURN;
          END IF;
        END;

      -- Crosspost limit: 1 approved/submitted crosspost task per rolling 24 hours
      ELSIF v_task_type = 'crosspost' THEN
        DECLARE
          v_crosspost_count INT;
        BEGIN
          SELECT COUNT(*)::INT INTO v_crosspost_count
          FROM public.task_claims tc
          JOIN public.tasks t ON tc.task_id = t.id
          WHERE tc.reddit_account_id = p_reddit_account_id
            AND tc.status IN ('approved', 'submitted')
            AND t.task_type = 'crosspost'
            AND COALESCE(t.task_category, 'standard') = v_task_category
            AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '24 hours');

          IF v_crosspost_count >= 1 THEN
            RETURN QUERY SELECT FALSE, 'Crosspost limit reached: You can only complete 1 crosspost task every 24 hours.'::TEXT;
            RETURN;
          END IF;
        END;

      -- Upvote limit: 5 approved/submitted upvote tasks per rolling 1 hour
      ELSIF v_task_type = 'upvote' THEN
        DECLARE
          v_upvote_count INT;
        BEGIN
          SELECT COUNT(*)::INT INTO v_upvote_count
          FROM public.task_claims tc
          JOIN public.tasks t ON tc.task_id = t.id
          WHERE tc.reddit_account_id = p_reddit_account_id
            AND tc.status IN ('approved', 'submitted')
            AND t.task_type = 'upvote'
            AND COALESCE(t.task_category, 'standard') = v_task_category
            AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');

          IF v_upvote_count >= 5 THEN
            RETURN QUERY SELECT FALSE, 'Upvote limit reached: You can only complete 5 upvote tasks per hour.'::TEXT;
            RETURN;
          END IF;
        END;
      END IF;
  ELSE
      -- YouTube cooldown checks: 1 approved/submitted task of the same type per rolling 20 hours
      DECLARE
        v_youtube_task_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_youtube_task_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.youtube_account_id = p_youtube_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type::text = v_task_type
          AND tc.claimed_at >= (NOW() - INTERVAL '20 hours');

        IF v_youtube_task_count >= 1 THEN
          RETURN QUERY SELECT FALSE, ('Cooldown active: You can only complete 1 ' || REPLACE(v_task_type, '_', ' ') || ' task every 20 hours for this account.')::TEXT;
          RETURN;
        END IF;
      END;
  END IF;

  -- 8. Multi-comment slot assignment
  IF v_task_type IN ('comment', 'comment_reply') AND v_content_body IS NOT NULL THEN
    BEGIN
      IF TRIM(v_content_body) LIKE '[%' AND jsonb_typeof(TRIM(v_content_body)::jsonb) = 'array' THEN
        v_is_multi_comment := TRUE;
        v_comment_count := jsonb_array_length(TRIM(v_content_body)::jsonb);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_is_multi_comment := FALSE;
    END;
  END IF;

  IF v_is_multi_comment AND v_comment_count > 0 THEN
    -- Pick lowest index not taken by an active claim
    SELECT s.idx INTO v_assigned_comment_index
    FROM generate_series(0, v_comment_count - 1) AS s(idx)
    WHERE s.idx NOT IN (
      SELECT tc.assigned_comment_index
      FROM public.task_claims tc
      WHERE tc.task_id = p_task_id
        AND tc.status IN ('claimed', 'submitted', 'approved')
        AND tc.assigned_comment_index IS NOT NULL
    )
    ORDER BY s.idx ASC
    LIMIT 1;

    -- Fallback in case existing claims had NULL assigned_comment_index
    IF v_assigned_comment_index IS NULL THEN
      IF v_active_claims < v_comment_count THEN
        v_assigned_comment_index := v_active_claims;
      ELSE
        UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
        RETURN QUERY SELECT FALSE, 'All comment slots for this task have already been claimed.'::TEXT;
        RETURN;
      END IF;
    END IF;
  ELSE
    v_assigned_comment_index := NULL;
  END IF;

  -- 9. Insert the claim
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    status,
    assigned_comment_index
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    p_youtube_account_id,
    'claimed',
    v_assigned_comment_index
  );

  -- 10. If this was the last slot, mark task as 'claimed'
  IF (v_active_claims + 1) >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'Task claimed successfully.'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, ('An unexpected error occurred: ' || SQLERRM)::TEXT;
END;
$$;

-- 4. Update get_available_tasks_secure to filter out tasks with same post link if already claimed
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL
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
  -- Karma farm tasks that have ANY claim (including expired) — these should never reappear
  karma_farm_claimed AS (
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE COALESCE(t.task_category, 'standard') = 'karma_farm'
  ),
  user_has_claimed AS (
    -- Block this specific reddit account from seeing tasks it has already claimed
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND p_reddit_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND COALESCE(t.platform, 'reddit') = 'reddit'
    UNION
    -- Block this specific youtube account from seeing tasks it has already claimed
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.youtube_account_id = p_youtube_account_id
      AND p_youtube_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'youtube'
  ),
  user_has_claimed_post_links AS (
    -- Block accounts from seeing another comment/upvote/like task on the SAME post link
    SELECT DISTINCT t.post_link, t.task_type::TEXT as link_task_type
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE (
      (tc.reddit_account_id = p_reddit_account_id AND p_reddit_account_id IS NOT NULL) OR
      (tc.youtube_account_id = p_youtube_account_id AND p_youtube_account_id IS NOT NULL)
    )
    AND tc.status IN ('claimed', 'submitted', 'approved')
    AND t.post_link IS NOT NULL
    AND t.post_link != ''
    AND t.task_type IN ('upvote', 'comment', 'like', 'comment_reply', 'subscribe')
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
    -- Exclude tasks this user has already claimed (across any account type)
    AND uhc.task_id IS NULL
    -- Exclude karma farm tasks that anyone has ever claimed
    AND kfc.task_id IS NULL
    -- Exclude tasks for the same post_link if already claimed/submitted/approved
    AND NOT EXISTS (
      SELECT 1 FROM user_has_claimed_post_links pl
      WHERE pl.post_link = t.post_link AND pl.link_task_type = t.task_type::TEXT
    )
    -- Only show if there are slots remaining
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
