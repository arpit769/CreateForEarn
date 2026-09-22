-- ==============================================================================
-- MULTI-COMMENT SCHEMA — STANDALONE MODULE
-- ==============================================================================
--
-- This file contains all multi-comment logic as STANDALONE helper functions
-- that are INDEPENDENT of claim_task_secure. Even if claim_task_secure is
-- rewritten for new platforms, these helpers persist and only need a one-line
-- call to integrate.
--
-- CONTENTS:
--   1. Column: task_claims.assigned_comment_index
--   2. Function: is_multi_comment_task(task_type, content_body) → BOOLEAN
--   3. Function: assign_multi_comment_slot(task_id, content_body, task_type, active_claims) → INT
--   4. Updated: claim_task_secure — calls the helpers instead of inlining logic
--
-- Run this in Supabase Dashboard → SQL Editor
-- ==============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 1. ENSURE COLUMN EXISTS                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.task_claims
ADD COLUMN IF NOT EXISTS assigned_comment_index INTEGER DEFAULT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 2. HELPER: is_multi_comment_task                                            ║
-- ║                                                                              ║
-- ║ Returns TRUE if the task is a comment/comment_reply type AND content_body    ║
-- ║ contains a JSON array with 2+ items.                                         ║
-- ║                                                                              ║
-- ║ Can be reused anywhere: get_available_tasks_secure, admin views, reports.    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP FUNCTION IF EXISTS public.is_multi_comment_task(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.is_multi_comment_task(
  p_task_type TEXT,
  p_content_body TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Only comment/comment_reply types can be multi-comment
  IF p_task_type NOT IN ('comment', 'comment_reply') THEN
    RETURN FALSE;
  END IF;

  IF p_content_body IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if content_body is a JSON array
  BEGIN
    IF TRIM(p_content_body) LIKE '[%'
       AND jsonb_typeof(TRIM(p_content_body)::jsonb) = 'array'
       AND jsonb_array_length(TRIM(p_content_body)::jsonb) > 0 THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.is_multi_comment_task(TEXT, TEXT) IS
  'Returns TRUE if task_type is comment/comment_reply and content_body is a valid JSON array. Standalone helper — safe to call from any context.';


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 3. HELPER: assign_multi_comment_slot                                        ║
-- ║                                                                              ║
-- ║ For multi-comment tasks, atomically picks the lowest available comment       ║
-- ║ index not yet taken by an active claim.                                      ║
-- ║                                                                              ║
-- ║ Returns:                                                                     ║
-- ║   >= 0   : assigned comment index (success)                                  ║
-- ║   -1     : all comment slots exhausted (caller should reject the claim)      ║
-- ║   NULL   : not a multi-comment task (caller should proceed normally)         ║
-- ║                                                                              ║
-- ║ IMPORTANT: Must be called AFTER acquiring FOR UPDATE lock on the task row    ║
-- ║ to prevent concurrent claims from grabbing the same slot.                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP FUNCTION IF EXISTS public.assign_multi_comment_slot(UUID, TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION public.assign_multi_comment_slot(
  p_task_id UUID,
  p_content_body TEXT,
  p_task_type TEXT,
  p_active_claims INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_count INT := 0;
  v_assigned_index INT := NULL;
BEGIN
  -- 1. Check if this is a multi-comment task
  IF NOT public.is_multi_comment_task(p_task_type, p_content_body) THEN
    RETURN NULL;  -- Not multi-comment, caller proceeds normally
  END IF;

  -- 2. Get the number of comments in the JSON array
  v_comment_count := jsonb_array_length(TRIM(p_content_body)::jsonb);

  IF v_comment_count <= 0 THEN
    RETURN NULL;
  END IF;

  -- 3. Pick the lowest index not already taken by an active claim
  SELECT s.idx INTO v_assigned_index
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

  -- 4. Fallback: if existing claims had NULL assigned_comment_index (legacy data)
  IF v_assigned_index IS NULL THEN
    IF p_active_claims < v_comment_count THEN
      v_assigned_index := p_active_claims;
    ELSE
      -- All slots exhausted — signal to caller
      RETURN -1;
    END IF;
  END IF;

  RETURN v_assigned_index;
END;
$$;

COMMENT ON FUNCTION public.assign_multi_comment_slot(UUID, TEXT, TEXT, INT) IS
  'Atomically assigns the next available comment slot index for multi-comment tasks. Returns index >= 0 on success, -1 when exhausted, NULL when not applicable. Standalone helper — safe to call from any claim function.';


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 4. UPDATED: claim_task_secure                                               ║
-- ║                                                                              ║
-- ║ Same 8-param signature for all 6 platforms. The multi-comment section is    ║
-- ║ now a SINGLE FUNCTION CALL instead of 30+ inlined lines.                    ║
-- ║                                                                              ║
-- ║ FUTURE MAINTAINERS: When rewriting this function for new platforms,         ║
-- ║ keep the section marked "MULTI-COMMENT SLOT ASSIGNMENT" intact.             ║
-- ║ It is a single call: assign_multi_comment_slot(...)                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Drop all existing signatures to prevent conflicts
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.claim_task_secure(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);

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
  v_content_body TEXT;
  v_content_mode TEXT;
  v_scheduled_for TIMESTAMPTZ;
  v_has_claimed_this_task INT;
  v_blocking_claims INT;
  v_same_post_claims INT;
  v_assigned_comment_index INT := NULL;
BEGIN
  -- ══════════════════════════════════════════════════════════════════════════
  -- 1. Get task details WITH FOR UPDATE lock to prevent race conditions
  -- ══════════════════════════════════════════════════════════════════════════
  SELECT
    status, max_claims, COALESCE(platform, 'reddit'), task_type,
    COALESCE(task_category, 'standard'), post_link, scheduled_for,
    content_body, content_mode
  INTO
    v_task_status, v_max_claims, v_platform, v_task_type,
    v_task_category, v_post_link, v_scheduled_for,
    v_content_body, v_content_mode
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 2. Check scheduled release
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_scheduled_for IS NOT NULL AND v_scheduled_for > NOW() THEN
    RETURN QUERY SELECT FALSE, 'This task is scheduled for a future release.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 3. Check slots remaining
  -- ══════════════════════════════════════════════════════════════════════════
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id
    AND status IN ('claimed', 'submitted', 'approved');

  IF v_active_claims >= COALESCE(v_max_claims, 1) THEN
    RETURN QUERY SELECT FALSE, 'This task has no remaining slots available.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 4. Check if user already claimed this task on active account
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_platform = 'linkedin' THEN
    IF p_linkedin_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified LinkedIn account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND linkedin_account_id = p_linkedin_account_id AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'instagram' THEN
    IF p_instagram_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Instagram account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND instagram_account_id = p_instagram_account_id AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'quora' THEN
    IF p_quora_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Quora account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND quora_account_id = p_quora_account_id AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'x' THEN
    IF p_x_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified X account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND x_account_id = p_x_account_id AND status IN ('claimed', 'submitted', 'approved');

  ELSIF v_platform = 'youtube' THEN
    IF p_youtube_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified YouTube account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND youtube_account_id = p_youtube_account_id AND status IN ('claimed', 'submitted', 'approved');

  ELSE -- reddit
    IF p_reddit_account_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'A verified Reddit account is required to claim this task.'::TEXT;
      RETURN;
    END IF;
    SELECT COUNT(*)::INT INTO v_has_claimed_this_task
    FROM public.task_claims
    WHERE task_id = p_task_id AND reddit_account_id = p_reddit_account_id AND status IN ('claimed', 'submitted', 'approved');
  END IF;

  IF v_has_claimed_this_task > 0 THEN
    RETURN QUERY SELECT FALSE, 'You have already claimed or completed this task.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 5. Block if user has another task in progress on this platform
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_platform = 'linkedin' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE linkedin_account_id = p_linkedin_account_id AND status = 'claimed';
  ELSIF v_platform = 'instagram' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE instagram_account_id = p_instagram_account_id AND status = 'claimed';
  ELSIF v_platform = 'quora' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE quora_account_id = p_quora_account_id AND status = 'claimed';
  ELSIF v_platform = 'x' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE x_account_id = p_x_account_id AND status = 'claimed';
  ELSIF v_platform = 'youtube' THEN
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE youtube_account_id = p_youtube_account_id AND status = 'claimed';
  ELSE
    SELECT COUNT(*)::INT INTO v_blocking_claims FROM public.task_claims WHERE reddit_account_id = p_reddit_account_id AND status = 'claimed';
  END IF;

  IF v_blocking_claims > 0 THEN
    RETURN QUERY SELECT FALSE, 'You already have a task in progress on this platform. Complete or wait for it to expire.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 6. Duplicate action on same post check
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_post_link IS NOT NULL AND v_post_link != '' AND v_task_type NOT IN ('post', 'answer', 'repost', 'text', 'image', 'video') THEN
    IF v_platform = 'linkedin' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.linkedin_account_id = p_linkedin_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'instagram' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.instagram_account_id = p_instagram_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'quora' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.quora_account_id = p_quora_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'x' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.x_account_id = p_x_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSIF v_platform = 'youtube' THEN
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.youtube_account_id = p_youtube_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    ELSE
      SELECT COUNT(*)::INT INTO v_same_post_claims
      FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
      WHERE tc.reddit_account_id = p_reddit_account_id AND t.post_link = v_post_link AND t.task_type::text = v_task_type AND tc.status IN ('claimed', 'submitted', 'approved');
    END IF;

    IF v_same_post_claims > 0 THEN
      RETURN QUERY SELECT FALSE, ('You have already completed or claimed a ' || v_task_type || ' task for this link/post.')::TEXT;
      RETURN;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 7. Platform-specific cooldowns
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_platform = 'reddit' THEN
    IF v_task_type = 'comment' THEN
      DECLARE v_count INT;
      BEGIN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.task_claims tc JOIN public.tasks t ON tc.task_id = t.id
        WHERE tc.reddit_account_id = p_reddit_account_id AND tc.status IN ('approved', 'submitted')
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
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 8. MULTI-COMMENT SLOT ASSIGNMENT (delegated to standalone helper)
  --
  --    ⚠️  FUTURE MAINTAINERS: DO NOT REMOVE THIS SECTION  ⚠️
  --    This single call replaces 30+ lines of inline logic.
  --    The helper function lives independently and handles:
  --      - JSON array detection in content_body
  --      - Atomic slot assignment (lowest available index)
  --      - Legacy NULL fallback
  --
  --    Returns: index >= 0 (assigned), -1 (exhausted), NULL (not applicable)
  -- ══════════════════════════════════════════════════════════════════════════
  v_assigned_comment_index := public.assign_multi_comment_slot(
    p_task_id, v_content_body, v_task_type, v_active_claims
  );

  IF v_assigned_comment_index = -1 THEN
    UPDATE public.tasks SET status = 'claimed' WHERE id = p_task_id;
    RETURN QUERY SELECT FALSE, 'All comment slots for this task have already been claimed.'::TEXT;
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 9. Insert the claim (WITH assigned_comment_index)
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.task_claims (
    task_id,
    user_id,
    reddit_account_id,
    youtube_account_id,
    x_account_id,
    quora_account_id,
    instagram_account_id,
    linkedin_account_id,
    status,
    assigned_comment_index
  ) VALUES (
    p_task_id,
    p_user_id,
    p_reddit_account_id,
    p_youtube_account_id,
    p_x_account_id,
    p_quora_account_id,
    p_instagram_account_id,
    p_linkedin_account_id,
    'claimed',
    v_assigned_comment_index
  );

  -- ══════════════════════════════════════════════════════════════════════════
  -- 10. Update task status if all slots filled
  -- ══════════════════════════════════════════════════════════════════════════
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

COMMENT ON FUNCTION public.claim_task_secure(UUID, UUID, UUID, UUID, UUID, UUID, UUID, UUID) IS
  'Claims a task for a user across all 6 platforms. Multi-comment logic is delegated to assign_multi_comment_slot() helper. When rewriting this function, preserve section 8.';
