-- SQL script to enforce unique Reddit usernames across all linked accounts
-- Copy and run this in your Supabase SQL Editor.

-- 1. Deduplicate existing entries (keeps only the oldest account per unique username)
DELETE FROM public.reddit_accounts r1
USING public.reddit_accounts r2
WHERE r1.id > r2.id 
  AND LOWER(
    REGEXP_REPLACE(
      r1.reddit_profile_link, 
      '^(https?://)?(www\.)?reddit\.com/(user|u)/([a-zA-Z0-9_\-]+)/?$', 
      '\4'
    )
  ) = LOWER(
    REGEXP_REPLACE(
      r2.reddit_profile_link, 
      '^(https?://)?(www\.)?reddit\.com/(user|u)/([a-zA-Z0-9_\-]+)/?$', 
      '\4'
    )
  );

-- 2. Create a unique index on the extracted Reddit username from the profile link
CREATE UNIQUE INDEX IF NOT EXISTS unique_reddit_username ON public.reddit_accounts (
  LOWER(
    REGEXP_REPLACE(
      reddit_profile_link, 
      '^(https?://)?(www\.)?reddit\.com/(user|u)/([a-zA-Z0-9_\-]+)/?$', 
      '\4'
    )
  )
);
