-- Create a SECURITY DEFINER function so admin tag assignment always works
-- regardless of RLS policies on reddit_account_subreddits

CREATE OR REPLACE FUNCTION public.assign_tags_to_account(
  target_account_id UUID,
  tag_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- Only allow admins
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete existing tags for this account
  DELETE FROM public.reddit_account_subreddits 
  WHERE reddit_account_id = target_account_id;

  -- Insert new tags
  IF array_length(tag_ids, 1) > 0 THEN
    INSERT INTO public.reddit_account_subreddits (reddit_account_id, subreddit_id)
    SELECT target_account_id, unnest(tag_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create a function to fetch tags for any account (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_account_tags(target_account_id UUID)
RETURNS TABLE(subreddit_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ras.subreddit_id 
  FROM public.reddit_account_subreddits ras
  WHERE ras.reddit_account_id = target_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
