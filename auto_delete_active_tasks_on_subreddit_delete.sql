-- ==============================================================================
-- Migration: Automatically Delete Active Tasks When Subreddit is Deleted
-- ==============================================================================
-- When a subreddit is deleted by admin:
-- 1. All active/uncompleted tasks ('available', 'paused', 'scheduled') belonging to it
--    are completely deleted along with any active claims so nobody sees them.
-- 2. Any completed/historical tasks have their subreddit_id set to NULL to preserve
--    payout and submission auditing history.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_subreddit_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Delete claims for active tasks belonging to this deleted subreddit
  DELETE FROM public.task_claims 
  WHERE task_id IN (
    SELECT id FROM public.tasks 
    WHERE subreddit_id = OLD.id 
      AND status IN ('available', 'paused', 'scheduled')
  );

  -- 2. Delete the active tasks themselves completely
  DELETE FROM public.tasks 
  WHERE subreddit_id = OLD.id 
    AND status IN ('available', 'paused', 'scheduled');

  -- 3. For any remaining completed/approved historical tasks, unlink subreddit_id
  UPDATE public.tasks 
  SET subreddit_id = NULL 
  WHERE subreddit_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_subreddit_before_delete ON public.subreddits;

CREATE TRIGGER trg_handle_subreddit_before_delete
BEFORE DELETE ON public.subreddits
FOR EACH ROW
EXECUTE FUNCTION public.handle_subreddit_before_delete();

