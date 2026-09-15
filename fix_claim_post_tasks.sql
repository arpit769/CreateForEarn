-- FIX: Allow multiple post tasks in the same subreddit & resolve function overloading
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL
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
  SELECT status, max_claims, platform, task_type, task_category, post_link, scheduled_for
  INTO v_task_status, v_max_claims, v_platform, v_task_type, v_task_category, v_post_link, v_scheduled_for
  FROM public.tasks
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT;
    RETURN;
  END IF;

  -- 2. Check scheduling
  IF v_scheduled_for IS NOT NULL AND v_scheduled_for > NOW() THEN
    RETURN QUERY SELECT FALSE, 'This task is scheduled for a future release.'::TEXT;
    RETURN;
  END IF;

  -- 3. Check slots
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND status IN ('claimed', 'submitted', 'approved');

  IF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    RETURN QUERY SELECT FALSE, 'This task has no remaining slots available.'::TEXT;
    RETURN;
  END IF;

  -- 4. Check if user already claimed this specific task
  IF v_platform = 'x' THEN
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
  ELSE
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
  IF v_platform = 'x' THEN
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

  -- 6. Same post/profile duplicate check
  -- NOTE: Excludes 'post', 'text', 'image', 'video' because post tasks are in subreddits where users make different posts over time (governed by 20h cooldown).
  -- This duplicate check is strictly for targeted single-item interactions (commenting on a specific post, upvoting a specific link, subscribing to a channel, etc.).
  IF v_post_link IS NOT NULL AND v_post_link != '' AND v_task_type NOT IN ('post', 'text', 'image', 'video') THEN
    IF v_platform = 'x' THEN
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
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this link/profile.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 7. Platform-specific Cooldowns
  IF v_platform = 'x' THEN
    -- X Cooldown rules: Post task = 1 in 20 hours. All other tasks = 2 in 1 hour.
    IF v_task_type = 'post' THEN
      DECLARE
        v_x_post_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_x_post_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '20 hours');

        IF v_x_post_count >= 1 THEN
          RETURN QUERY SELECT FALSE, 'X Post limit reached: You can only complete 1 post task every 20 hours on this X account.'::TEXT;
          RETURN;
        END IF;
      END;
    ELSE
      DECLARE
        v_x_other_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_x_other_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.x_account_id = p_x_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type != 'post'
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');

        IF v_x_other_count >= 2 THEN
          RETURN QUERY SELECT FALSE, 'X Interaction limit reached: You can only complete 2 interaction tasks per hour on this X account.'::TEXT;
          RETURN;
        END IF;
      END;
    END IF;
  ELSIF v_platform = 'youtube' THEN
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
  ELSE
    -- Reddit cooldown checks
    IF v_task_type = 'comment' THEN
      DECLARE
        v_comment_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_comment_count
        FROM public.task_claims tc
        JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id
          AND tc.status IN ('approved', 'submitted')
          AND t.task_type = 'comment'
          AND COALESCE(t.task_category, 'standard') = v_task_category
          AND COALESCE(tc.submitted_at, tc.claimed_at) >= (NOW() - INTERVAL '1 hour');

        IF v_comment_count >= 2 THEN
          RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour.'::TEXT;
          RETURN;
        END IF;
      END;
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
  END IF;

  -- 8. Insert the claim
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    x_account_id,
    status
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    p_youtube_account_id,
    p_x_account_id,
    'claimed'
  );

  -- 9. If this was the last slot, mark task as 'claimed'
  IF (v_active_claims + 1) >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'Task claimed successfully.'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, ('An unexpected error occurred: ' || SQLERRM)::TEXT;
END;
$$;
