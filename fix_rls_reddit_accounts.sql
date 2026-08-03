-- Fix RLS recursion for reddit_accounts and reddit_account_subreddits tables
-- These were missed in the original fix_rls_recursion.sql

-- 1. Drop the old recursive admin policies
DROP POLICY IF EXISTS "Admins have full access to reddit_accounts" ON public.reddit_accounts;
DROP POLICY IF EXISTS "Admins have full access to tags" ON public.reddit_account_subreddits;

-- 2. Recreate them using the secure is_admin() function (no recursion)
CREATE POLICY "Admins have full access to reddit_accounts" ON public.reddit_accounts
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins have full access to tags" ON public.reddit_account_subreddits
    FOR ALL USING (public.is_admin());
