-- ==============================================================================
-- IMMEDIATE FIX: ADD 'paused' TO task_status ENUM & UPDATE FUNCTIONS
-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX:
-- "invalid input value for enum task_status: "paused""
-- ==============================================================================

-- 1. Add 'paused' to the task_status enum
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'paused';

-- 2. Update release_expired_claims_secure() to safely use valid enum values
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

-- 3. Update sync_task_status_secure()
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

  -- Count approved claims
  SELECT COUNT(*)::INT INTO v_approved_claims
  FROM public.task_claims
  WHERE task_id = p_task_id AND status = 'approved';

  -- Count active claims (claimed, submitted, approved)
  SELECT COUNT(*)::INT INTO v_active_claims
  FROM public.task_claims
  WHERE task_id = p_task_id AND status IN ('claimed', 'submitted', 'approved');

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
