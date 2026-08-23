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
  v_task_category TEXT;
  v_platform TEXT;
  v_same_post_claims INT;
  v_time_now TIMESTAMP WITH TIME ZONE := NOW();
  v_thirty_min_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '30 minutes';
BEGIN
  -- 1. Lock the task row to prevent concurrent race conditions
  SELECT status, max_claims, task_type, post_link, COALESCE(task_category, 'standard'), COALESCE(platform, 'reddit')
  INTO v_task_status, v_max_claims, v_task_type, v_post_link, v_task_category, v_platform
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
          v_comment_count INT;
        BEGIN
          SELECT COUNT(*)::INT INTO v_comment_count
          FROM public.task_claims tc
          JOIN public.tasks t ON tc.task_id = t.id
          WHERE tc.reddit_account_id = p_reddit_account_id
            AND tc.status IN ('approved', 'submitted')
            AND t.task_type = 'comment'
            AND COALESCE(t.task_category, 'standard') = v_task_category
            AND tc.claimed_at >= (NOW() - INTERVAL '1 hour');

          IF v_comment_count >= 2 THEN
            RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour for this account.'::TEXT;
            RETURN;
          END IF;
        END;

      -- Post limit: 1 approved/submitted post task per rolling 15 hours
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
            AND tc.claimed_at >= (NOW() - INTERVAL '15 hours');

          IF v_post_count >= 1 THEN
            RETURN QUERY SELECT FALSE, 'Post limit reached: You can only complete 1 post task every 15 hours for this account.'::TEXT;
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
            AND tc.claimed_at >= (NOW() - INTERVAL '24 hours');

          IF v_crosspost_count >= 1 THEN
            RETURN QUERY SELECT FALSE, 'Crosspost limit reached: You can only complete 1 crosspost task every 24 hours for this account.'::TEXT;
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
            AND tc.claimed_at >= (NOW() - INTERVAL '1 hour');

          IF v_upvote_count >= 5 THEN
            RETURN QUERY SELECT FALSE, 'Upvote limit reached: You can only complete 5 upvote tasks per hour for this account.'::TEXT;
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

  -- 8. Insert the claim
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    status
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    p_youtube_account_id,
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
