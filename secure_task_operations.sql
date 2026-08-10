-- Run this in your Supabase SQL Editor!

-- 1. Create a function to securely sync a task's status based on all claims
CREATE OR REPLACE FUNCTION public.sync_task_status_secure(p_task_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_claims INT;
  v_active_claims INT;
  v_approved_claims INT;
BEGIN
  -- Fetch max claims
  SELECT max_claims INTO v_max_claims FROM public.tasks WHERE id = p_task_id;
  
  -- Count active claims (claimed, submitted, approved)
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id AND status IN ('claimed', 'submitted', 'approved');

  -- Count approved claims
  SELECT COUNT(*)::INT INTO v_approved_claims
  FROM public.task_claims
  WHERE task_id = p_task_id AND status = 'approved';

  -- Update task status
  IF v_approved_claims >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks SET status = 'completed' WHERE id = p_task_id;
  ELSIF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
  ELSE
    UPDATE public.tasks SET status = 'available' WHERE id = p_task_id;
  END IF;
END;
$$;

-- 2. Create a function to securely release all expired claims across all tasks
CREATE OR REPLACE FUNCTION public.release_expired_claims_secure()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thirty_min_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '30 minutes';
  v_claim RECORD;
BEGIN
  -- Find all tasks that have expired claims
  FOR v_claim IN 
    SELECT DISTINCT task_id 
    FROM public.task_claims 
    WHERE status = 'claimed' AND claimed_at < v_thirty_min_ago
  LOOP
    -- Mark expired claims for this task as expired
    UPDATE public.task_claims
    SET status = 'expired'
    WHERE task_id = v_claim.task_id 
      AND status = 'claimed' 
      AND claimed_at < v_thirty_min_ago;

    -- Sync task status
    PERFORM public.sync_task_status_secure(v_claim.task_id);
  END LOOP;
END;
$$;

-- 3. Create a function to securely claim a task (Atomic + Concurrency Locked)
CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
  p_user_id UUID,
  p_reddit_account_id UUID
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
  v_same_post_claims INT;
  v_time_now TIMESTAMP WITH TIME ZONE := NOW();
  v_thirty_min_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '30 minutes';
BEGIN
  -- 1. Lock the task row to prevent concurrent race conditions
  SELECT status, max_claims, task_type, post_link
  INTO v_task_status, v_max_claims, v_task_type, v_post_link
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
  SELECT COUNT(*)::INT INTO v_already_claimed
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND reddit_account_id = p_reddit_account_id
    AND status != 'expired';

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

  -- 5. Block if the user has another task in progress (claimed or submitted)
  SELECT COUNT(*)::INT INTO v_blocking_claims
  FROM public.task_claims
  WHERE reddit_account_id = p_reddit_account_id
    AND status IN ('claimed', 'submitted');

  IF v_blocking_claims > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.task_claims 
      WHERE reddit_account_id = p_reddit_account_id AND status = 'claimed'
    ) THEN
      RETURN QUERY SELECT FALSE, 'You already have a task in progress. Complete or wait for it to expire.'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'Your previous submission is under admin review.'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- 6. Same post limit check for upvote/comment tasks
  IF (v_task_type = 'upvote' OR v_task_type = 'comment') AND v_post_link IS NOT NULL AND v_post_link != '' THEN
    SELECT COUNT(*)::INT INTO v_same_post_claims
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND t.post_link = v_post_link
      AND t.task_type = v_task_type
      AND tc.status IN ('claimed', 'submitted', 'approved');

    IF v_same_post_claims > 0 THEN
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this post.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 7. Cooldown checks
  -- Comment limit: 2 approved comment tasks per rolling 1 hour
  IF v_task_type = 'comment' THEN
    DECLARE
      v_comment_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_comment_count
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id
        AND tc.status = 'approved'
        AND t.task_type = 'comment'
        AND tc.claimed_at >= (NOW() - INTERVAL '1 hour');

      IF v_comment_count >= 2 THEN
        RETURN QUERY SELECT FALSE, 'Comment task limit reached (2 per hour).'::TEXT;
        RETURN;
      END IF;
    END;
  -- Post limit: 1 approved post task per rolling 15 hours
  ELSIF v_task_type = 'post' THEN
    DECLARE
      v_post_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_post_count
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id
        AND tc.status = 'approved'
        AND t.task_type = 'post'
        AND tc.claimed_at >= (NOW() - INTERVAL '15 hours');

      IF v_post_count >= 1 THEN
        RETURN QUERY SELECT FALSE, 'Post limit reached (1 per 15 hours).'::TEXT;
        RETURN;
      END IF;
    END;
  -- Crosspost limit: 1 approved crosspost task per rolling 24 hours
  ELSIF v_task_type = 'crosspost' THEN
    DECLARE
      v_crosspost_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_crosspost_count
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id
        AND tc.status = 'approved'
        AND t.task_type = 'crosspost'
        AND tc.claimed_at >= (NOW() - INTERVAL '24 hours');

      IF v_crosspost_count >= 1 THEN
        RETURN QUERY SELECT FALSE, 'Daily crosspost limit reached (1 per day).'::TEXT;
        RETURN;
      END IF;
    END;
  -- Upvote limit: 5 approved upvote tasks per rolling 1 hour
  ELSIF v_task_type = 'upvote' THEN
    DECLARE
      v_upvote_count INT;
    BEGIN
      SELECT COUNT(*)::INT INTO v_upvote_count
      FROM public.task_claims tc
      JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id
        AND tc.status = 'approved'
        AND t.task_type = 'upvote'
        AND tc.claimed_at >= (NOW() - INTERVAL '1 hour');

      IF v_upvote_count >= 5 THEN
        RETURN QUERY SELECT FALSE, 'Upvote task limit reached (max 5 per hour).'::TEXT;
        RETURN;
      END IF;
    END;
  END IF;

  -- 8. Insert the claim
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    status,
    claimed_at
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    'claimed',
    v_time_now
  );

  -- 9. Sync the task status to update it to 'claimed' or keep 'available'
  PERFORM public.sync_task_status_secure(p_task_id);

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- 4. Create a function to securely fetch available tasks for a worker bypassing RLS
CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_reddit_account_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT,
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
  seq_id INT,
  active_claims_count INT,
  slots_remaining INT
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
    t.task_type,
    t.content_mode,
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
    t.status,
    t.seq_id,
    COALESCE(cc.active_count, 0) AS active_claims_count,
    GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) AS slots_remaining
  FROM public.tasks t
  LEFT JOIN public.subreddits s ON t.subreddit_id = s.id
  LEFT JOIN task_claim_counts cc ON t.id = cc.task_id
  LEFT JOIN user_has_claimed uhc ON t.id = uhc.task_id
  WHERE t.status = 'available'
    -- Filter by verified subreddits (or null)
    AND (
      t.subreddit_id IS NULL 
      OR t.subreddit_id = ANY(v_tag_ids)
    )
    -- Exclude tasks this reddit account has already claimed
    AND uhc.task_id IS NULL
    -- Only show if there are slots remaining
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;
