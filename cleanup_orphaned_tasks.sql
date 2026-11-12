-- ==============================================================================
-- 1. DELETE ORPHANED ACTIVE TASKS WHOSE SUBREDDITS WERE DELETED
-- ==============================================================================
-- Deletes the 42 active tasks that point to deleted subreddits (like twittermarketing,
-- tiktokrise, youtubecamp, etc.) so they are permanently removed from the database.

-- First, delete any uncompleted claims on these active orphaned tasks
DELETE FROM public.task_claims
WHERE task_id IN (
  SELECT id FROM public.tasks
  WHERE status = 'available'
    AND (platform = 'reddit' OR platform IS NULL)
    AND subreddit_id IS NULL
    AND post_link ~* 'reddit\.com/r/[a-zA-Z0-9_]+'
);

-- Next, delete the active orphaned tasks themselves
DELETE FROM public.tasks
WHERE status = 'available'
  AND (platform = 'reddit' OR platform IS NULL)
  AND subreddit_id IS NULL
  AND post_link ~* 'reddit\.com/r/[a-zA-Z0-9_]+';


-- ==============================================================================
-- 2. AUTOMATIC TRIGGER: DELETE ACTIVE TASKS ON SUBREDDIT DELETION
-- ==============================================================================
-- Going forward, if an admin deletes a subreddit:
-- - Active tasks ('available', 'paused', 'scheduled') are automatically DELETED.
-- - Completed tasks keep their history for payments with subreddit_id = NULL.

CREATE OR REPLACE FUNCTION public.handle_subreddit_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete uncompleted claims on active tasks for this subreddit
  DELETE FROM public.task_claims 
  WHERE task_id IN (
    SELECT id FROM public.tasks 
    WHERE subreddit_id = OLD.id 
      AND status IN ('available', 'paused', 'scheduled')
  );

  -- Delete the active tasks completely
  DELETE FROM public.tasks 
  WHERE subreddit_id = OLD.id 
    AND status IN ('available', 'paused', 'scheduled');

  -- Unlink historical/completed tasks so past payouts/claims are preserved
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

