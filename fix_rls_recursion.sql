-- Run this in your Supabase SQL Editor to fix the infinite recursion!

-- 1. Create a secure function to check if current user is an admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.users WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies from all tables
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to subreddits" ON public.subreddits;
DROP POLICY IF EXISTS "Admins have full access to user_subreddits" ON public.user_subreddits;
DROP POLICY IF EXISTS "Admins have full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins have full access to claims" ON public.task_claims;
DROP POLICY IF EXISTS "Admins have full access to withdrawals" ON public.withdrawals;

-- 3. Recreate the Admin policies using the new secure function
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to subreddits" ON public.subreddits FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to user_subreddits" ON public.user_subreddits FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to tasks" ON public.tasks FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to claims" ON public.task_claims FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to withdrawals" ON public.withdrawals FOR ALL USING (public.is_admin());
