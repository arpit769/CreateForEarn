-- Migration: Update post task cooldown from 15 hours to 20 hours in claim_task_secure
-- Run this in your Supabase Dashboard -> SQL Editor

DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_task_secure(UUID, UUID);

CREATE OR REPLACE FUNCTION public.claim_task_secure(
  p_task_id UUID,
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  claim_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_status TEXT;
  v_max_claims INT;
  v_active_claims INT;
  v_task_type TEXT;
  v_post_link TEXT;
  v_task_category TEXT;
  v_platform TEXT;
  v_new_claim_id UUID;
  v_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 1. Fetch task details
  SELECT status, max_claims, task_type, post_link, COALESCE(task_category, 'standard'), COALESCE(platform, 'reddit')
  INTO v_task_status, v_max_claims, v_task_type, v_post_link, v_task_category, v_platform
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 2. Validate availability
  IF v_task_status != 'available' THEN
    RETURN QUERY SELECT FALSE, 'Task is no longer available.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 3. Check slots remaining
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id AND status IN ('claimed', 'submitted', 'approved');

  IF v_active_claims >= v_max_claims THEN
    UPDATE public.tasks SET status = 'completed' WHERE id = p_task_id;
    RETURN QUERY SELECT FALSE, 'All slots for this task have been claimed.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 4. Check platform specific validations
  IF v_platform = 'reddit' THEN
    IF p_reddit_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Reddit account is required to claim this task.'::TEXT, NULL::UUID;
      RETURN;
    END IF;

    -- Cooldown Checks (Only for standard tasks)
    IF v_task_category = 'standard' THEN
      -- Post limit: 1 post task per rolling 20 hours
      IF v_task_type = 'post' THEN
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
            RETURN QUERY SELECT FALSE, 'Post limit reached: You can only complete 1 post task every 20 hours.'::TEXT, NULL::UUID;
            RETURN;
          END IF;
        END;

      -- Crosspost limit: 1 per 24 hours
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
            RETURN QUERY SELECT FALSE, 'Crosspost limit reached: You can only complete 1 crosspost task every 24 hours.'::TEXT, NULL::UUID;
            RETURN;
          END IF;
        END;

      -- Comment limit: 2 per 1 hour
      ELSIF v_task_type = 'comment' THEN
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
            RETURN QUERY SELECT FALSE, 'Comment limit reached: You can only complete 2 comment tasks per hour.'::TEXT, NULL::UUID;
            RETURN;
          END IF;
        END;

      -- Upvote limit: 5 per 1 hour
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
            RETURN QUERY SELECT FALSE, 'Upvote limit reached: You can only complete 5 upvote tasks per hour.'::TEXT, NULL::UUID;
            RETURN;
          END IF;
        END;
      END IF;
    END IF;

  ELSIF v_platform = 'youtube' THEN
    IF p_youtube_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified YouTube account is required to claim this task.'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- 5. Insert new claim
  IF v_platform = 'youtube' THEN
    INSERT INTO public.task_claims (task_id, user_id, youtube_account_id, status, claimed_at)
    VALUES (p_task_id, p_user_id, p_youtube_account_id, 'claimed', NOW())
    RETURNING id INTO v_new_claim_id;
  ELSE
    INSERT INTO public.task_claims (task_id, user_id, reddit_account_id, status, claimed_at)
    VALUES (p_task_id, p_user_id, p_reddit_account_id, 'claimed', NOW())
    RETURNING id INTO v_new_claim_id;
  END IF;

  -- 6. Sync status
  PERFORM public.sync_task_status_secure(p_task_id);

  RETURN QUERY SELECT TRUE, 'Task claimed successfully!'::TEXT, v_new_claim_id;
END;
$$;
