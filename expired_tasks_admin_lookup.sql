-- ==============================================================================
-- MIGRATION: Expired Tasks Admin Lookup & Approval Workflow
-- ==============================================================================
-- PURPOSE:
-- When a user claims a task and it expires (>1 hour without submission):
-- 1. The task must NOT automatically reflect back to users.
-- 2. The task enters the Admin's Lookup queue (admin_lookup_status = 'pending').
-- 3. The Admin inspects the task and decides:
--    - 'reflect': republish the task to users (status = 'available')
--    - 'hide': keep the task hidden permanently (status = 'completed')
-- ==============================================================================

-- 0. ADD 'paused' TO task_status ENUM
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'paused';

-- 1. ADD ADMIN LOOKUP COLUMNS TO TASKS TABLE
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS admin_lookup_status TEXT DEFAULT NULL;
-- Possible values: NULL (normal), 'pending' (awaiting admin lookup), 'reflected' (republished), 'hidden' (permanently closed)

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS lookup_notes TEXT DEFAULT NULL;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS lookup_resolved_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS lookup_resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_admin_lookup_status ON public.tasks(admin_lookup_status);


-- 2. UPDATE release_expired_claims_secure()
-- When claims older than 1 hour are marked expired:
-- Instead of immediately reverting task status to 'available',
-- move the task into Admin Lookup (admin_lookup_status = 'pending')
CREATE OR REPLACE FUNCTION public.release_expired_claims_secure()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_one_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
  v_claim RECORD;
BEGIN
  FOR v_claim IN 
    SELECT DISTINCT task_id 
    FROM public.task_claims 
    WHERE status = 'claimed' AND claimed_at < v_one_hour_ago
  LOOP
    -- Mark expired claims for this task as expired
    UPDATE public.task_claims
    SET status = 'expired'
    WHERE task_id = v_claim.task_id 
      AND status = 'claimed' 
      AND claimed_at < v_one_hour_ago;

    -- Send task to admin lookup so it DOES NOT reflect to users
    UPDATE public.tasks
    SET admin_lookup_status = 'pending',
        status = 'claimed'
    WHERE id = v_claim.task_id
      AND (admin_lookup_status IS NULL OR admin_lookup_status = 'pending');
  END LOOP;
END;
$$;


-- 3. UPDATE sync_task_status_secure()
-- Protect tasks awaiting Admin Lookup from becoming 'available' automatically
CREATE OR REPLACE FUNCTION public.sync_task_status_secure(p_task_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_claims INT;
  v_active_claims INT;
  v_approved_claims INT;
  v_task_category TEXT;
  v_lookup_status TEXT;
  v_any_claims INT;
BEGIN
  -- Fetch max claims, task category, and admin lookup status
  SELECT max_claims, COALESCE(task_category, 'standard'), admin_lookup_status
  INTO v_max_claims, v_task_category, v_lookup_status
  FROM public.tasks WHERE id = p_task_id;
  
  -- If task is awaiting Admin Lookup, DO NOT set it to 'available'!
  IF v_lookup_status = 'pending' THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
    RETURN;
  END IF;

  -- If admin explicitly decided to keep it hidden, keep it completed
  IF v_lookup_status = 'hidden' THEN
    UPDATE public.tasks SET status = 'completed' WHERE id = p_task_id;
    RETURN;
  END IF;

  -- For karma farm tasks: once any claim exists (even expired), mark as completed permanently
  IF v_task_category = 'karma_farm' THEN
    SELECT COUNT(*)::INT INTO v_any_claims
    FROM public.task_claims
    WHERE task_id = p_task_id;

    IF v_any_claims > 0 THEN
      UPDATE public.tasks SET status = 'completed' WHERE id = p_task_id;
      RETURN;
    END IF;
  END IF;

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


-- 4. FUNCTION: resolve_expired_task_lookup()
-- Admin decision handler to either republish to users or keep hidden
CREATE OR REPLACE FUNCTION public.resolve_expired_task_lookup(
  p_task_id UUID,
  p_action TEXT, -- 'reflect' or 'hide'
  p_notes TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_action = 'reflect' THEN
    -- Admin approved reflecting to users again
    UPDATE public.tasks
    SET admin_lookup_status = 'reflected',
        lookup_notes = p_notes,
        lookup_resolved_at = NOW(),
        lookup_resolved_by = p_admin_user_id,
        status = 'available'
    WHERE id = p_task_id;

    -- Perform status sync to ensure proper slot counts
    PERFORM public.sync_task_status_secure(p_task_id);

    RETURN QUERY SELECT TRUE, 'Task has been reflected to users and is now available in worker feeds.'::TEXT;

  ELSIF p_action = 'hide' THEN
    -- Admin decided NOT to reflect to users (keep hidden)
    UPDATE public.tasks
    SET admin_lookup_status = 'hidden',
        lookup_notes = p_notes,
        lookup_resolved_at = NOW(),
        lookup_resolved_by = p_admin_user_id,
        status = 'completed'
    WHERE id = p_task_id;

    RETURN QUERY SELECT TRUE, 'Task has been hidden and will not reflect to users.'::TEXT;

  ELSE
    RETURN QUERY SELECT FALSE, 'Invalid action. Must be "reflect" or "hide".'::TEXT;
  END IF;
END;
$$;


-- 5. UPDATE get_available_tasks_secure()
-- Ensure tasks with admin_lookup_status = 'pending' or 'hidden' are NEVER returned to workers
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
  v_one_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
BEGIN
  -- Lazy release expired claims into admin lookup
  PERFORM public.release_expired_claims_secure();

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
      AND tc.status NOT IN ('expired', 'rejected')
      AND COALESCE(t.platform, 'reddit') = 'reddit'
    UNION
    -- Block YouTube claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.youtube_account_id = p_youtube_account_id
      AND p_youtube_account_id IS NOT NULL
      AND tc.status NOT IN ('expired', 'rejected')
      AND t.platform = 'youtube'
    UNION
    -- Block X claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.x_account_id = p_x_account_id
      AND p_x_account_id IS NOT NULL
      AND tc.status NOT IN ('expired', 'rejected')
      AND t.platform = 'x'
    UNION
    -- Block Quora claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.quora_account_id = p_quora_account_id
      AND p_quora_account_id IS NOT NULL
      AND tc.status NOT IN ('expired', 'rejected')
      AND t.platform = 'quora'
    UNION
    -- Block Instagram claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.instagram_account_id = p_instagram_account_id
      AND p_instagram_account_id IS NOT NULL
      AND tc.status NOT IN ('expired', 'rejected')
      AND t.platform = 'instagram'
    UNION
    -- Block LinkedIn claims
    SELECT DISTINCT tc.task_id
    FROM public.task_claims tc
    JOIN public.tasks t ON tc.task_id = t.id
    WHERE tc.linkedin_account_id = p_linkedin_account_id
      AND p_linkedin_account_id IS NOT NULL
      AND tc.status NOT IN ('expired', 'rejected')
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
    AND COALESCE(t.admin_lookup_status, 'none') NOT IN ('pending', 'hidden')
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
