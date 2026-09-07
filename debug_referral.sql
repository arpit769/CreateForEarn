-- ============================================================================
-- REFERRAL DEBUG — Run each query one at a time in Supabase SQL Editor
-- ============================================================================

-- 1. Check if the trigger function exists and what version is deployed
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check if the trigger is actually attached to auth.users
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- 3. Check the most recent signups and whether referred_by was set
SELECT id, email, full_name, referred_by, referral_code, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check the referrals table — are there ANY rows?
SELECT * FROM public.referrals ORDER BY created_at DESC LIMIT 10;

-- 5. Check if the new user's auth metadata actually has the referral code
SELECT id, email, raw_user_meta_data->>'referral_code_used' AS ref_code_used,
       raw_user_meta_data->>'full_name' AS signup_name,
       created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
