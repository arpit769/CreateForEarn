-- Run this in your Supabase SQL Editor!

-- 1. Create task_type_enum values if they don't exist
DO $$
BEGIN
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'repost';
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'quote_post';
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'follow';
  ALTER TYPE public.task_type_enum ADD VALUE IF NOT EXISTS 'bookmark';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Create x_accounts table
CREATE TABLE IF NOT EXISTS public.x_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'verified', 'rejected', 'banned'
  rejection_reason TEXT,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_x_username UNIQUE (username)
);

-- 3. Add active_x_account_id to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active_x_account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL;

-- 4. Add x_account_id to task_claims
ALTER TABLE public.task_claims
ADD COLUMN IF NOT EXISTS x_account_id UUID REFERENCES public.x_accounts(id) ON DELETE CASCADE;

-- 5. Enable RLS on x_accounts
ALTER TABLE public.x_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Policies for x_accounts
DROP POLICY IF EXISTS "Users can view their own x accounts" ON public.x_accounts;
CREATE POLICY "Users can view their own x accounts"
  ON public.x_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all x accounts" ON public.x_accounts;
CREATE POLICY "Admins can view all x accounts"
  ON public.x_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own x accounts" ON public.x_accounts;
CREATE POLICY "Users can insert their own x accounts"
  ON public.x_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own x accounts" ON public.x_accounts;
CREATE POLICY "Users can delete their own x accounts"
  ON public.x_accounts FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update x accounts" ON public.x_accounts;
CREATE POLICY "Admins can update x accounts"
  ON public.x_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 7. Update get_available_tasks_secure function to support X tasks
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_available_tasks_secure(uuid, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_available_tasks_secure(
  p_user_id UUID,
  p_reddit_account_id UUID DEFAULT NULL,
  p_youtube_account_id UUID DEFAULT NULL,
  p_x_account_id UUID DEFAULT NULL
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
    -- Block reddit account
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.reddit_account_id = p_reddit_account_id
      AND p_reddit_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND COALESCE(t.platform, 'reddit') = 'reddit'
    UNION
    -- Block youtube account
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.youtube_account_id = p_youtube_account_id
      AND p_youtube_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'youtube'
    UNION
    -- Block X account
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.x_account_id = p_x_account_id
      AND p_x_account_id IS NOT NULL
      AND tc.status != 'expired'
      AND t.platform = 'x'
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
    -- Filter by verified subreddits if reddit task, else open for youtube & x
    AND (
      t.platform IN ('youtube', 'x') OR 
      t.subreddit_id IS NULL OR 
      t.subreddit_id = ANY(v_tag_ids)
    )
    -- Exclude tasks this user account has already claimed
    AND uhc.task_id IS NULL
    -- Exclude karma farm tasks that anyone has ever claimed
    AND kfc.task_id IS NULL
    -- Only show if there are slots remaining
    AND GREATEST(0, t.max_claims - COALESCE(cc.active_count, 0)) > 0
  ORDER BY t.created_at DESC;
END;
$$;

-- 8. Update claim_task_secure to support X tasks and cooldowns
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
  v_already_claimed INT;
  v_blocking_claims INT;
  v_task_type TEXT;
  v_post_link TEXT;
  v_task_category TEXT;
  v_platform TEXT;
  v_same_post_claims INT;
  v_time_now TIMESTAMP WITH TIME ZONE := NOW();
  v_one_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
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

  -- 2. Release expired claims for this specific task
  UPDATE public.task_claims
  SET status = 'expired'
  WHERE task_id = p_task_id
    AND status = 'claimed'
    AND claimed_at < v_one_hour_ago;

  -- 3. Check if this account already has an active claim
  IF v_platform = 'x' THEN
    SELECT COUNT(*)::INT INTO v_already_claimed
    FROM public.task_claims
    WHERE task_id = p_task_id
      AND x_account_id = p_x_account_id
      AND status != 'expired';
  ELSIF v_platform = 'youtube' THEN
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
  IF v_post_link IS NOT NULL AND v_post_link != '' THEN
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
          RETURN QUERY SELECT FALSE, 'X Action limit reached: You can only complete 2 tasks per hour on this X account.'::TEXT;
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
