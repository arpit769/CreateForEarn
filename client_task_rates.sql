-- Run this in your Supabase SQL Editor to support custom client task rates!

-- 1. Add task_rates column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS task_rates JSONB DEFAULT '{
  "reddit": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "youtube": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "x": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "instagram": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "linkedin": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "quora": { "post": 10, "comment": 5, "upvote": 1, "reshare": 3, "follow": 1 },
  "custom_addup": 0
}'::jsonb;

-- 2. Ensure clients can read their own user record including task_rates
-- (Existing users SELECT policy already allows auth.uid() = id or admin access)

-- 3. Example verification and update query:
-- UPDATE public.users 
-- SET task_rates = '{"reddit":{"post":12,"comment":6,"upvote":1,"reshare":4,"follow":1}}'::jsonb 
-- WHERE id = 'YOUR_CLIENT_USER_ID';
