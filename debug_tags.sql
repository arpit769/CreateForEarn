-- Diagnostic function to see all tag assignments (bypasses RLS)
CREATE OR REPLACE FUNCTION public.debug_all_tags()
RETURNS TABLE(
  account_id UUID,
  profile_link TEXT,
  subreddit_name TEXT,
  subreddit_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id,
    ra.reddit_profile_link,
    s.name,
    ras.subreddit_id
  FROM public.reddit_accounts ra
  LEFT JOIN public.reddit_account_subreddits ras ON ras.reddit_account_id = ra.id
  LEFT JOIN public.subreddits s ON s.id = ras.subreddit_id
  ORDER BY ra.reddit_profile_link, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
