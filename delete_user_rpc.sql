-- Function to safely delete a user from auth.users and all cascading tables
-- Run this in your Supabase Dashboard -> SQL Editor!

CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- 1. Check if the caller is an admin (or if it's the system/service role)
  SELECT COALESCE((role = 'admin'), FALSE) INTO is_caller_admin 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- 2. Verify authorization: caller must be deleting their own account OR must be an admin
  IF auth.uid() = target_user_id OR is_caller_admin THEN
    
    -- Delete tags associated with the user's reddit accounts
    DELETE FROM public.reddit_account_subreddits 
    WHERE reddit_account_id IN (
      SELECT id FROM public.reddit_accounts WHERE user_id = target_user_id
    );
    
    -- Delete task claims
    DELETE FROM public.task_claims 
    WHERE user_id = target_user_id;
    
    -- Delete withdrawals
    DELETE FROM public.withdrawals 
    WHERE user_id = target_user_id;

    -- Delete transactions if table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
      EXECUTE 'DELETE FROM public.transactions WHERE user_id = $1' USING target_user_id;
    END IF;
    
    -- Delete reddit accounts
    DELETE FROM public.reddit_accounts 
    WHERE user_id = target_user_id;

    -- Nullify active account reference on user to avoid cyclic reference checks
    UPDATE public.users 
    SET active_reddit_account_id = NULL 
    WHERE id = target_user_id;
    
    -- Delete from public.users
    DELETE FROM public.users 
    WHERE id = target_user_id;
    
    -- Delete from auth.users (auth schema)
    DELETE FROM auth.users 
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized to delete this user';
  END IF;
END;
$$;
