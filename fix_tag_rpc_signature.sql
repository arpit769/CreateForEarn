-- SQL migration to fix tag RPC signature mismatch issues.
-- Copy and run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.assign_tags_to_account(
  target_account_id UUID,
  tag_ids TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Security check: Only allow admins
  IF COALESCE(public.is_admin(), FALSE) = FALSE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete existing tags for this account
  DELETE FROM public.reddit_account_subreddits 
  WHERE reddit_account_id = target_account_id;

  -- Insert new tags
  IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
    INSERT INTO public.reddit_account_subreddits (reddit_account_id, subreddit_id)
    SELECT target_account_id, unnest(tag_ids)::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
