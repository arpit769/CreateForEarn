-- Function to safely delete a user from auth.users (cascades to public.users)
-- This function runs with SECURITY DEFINER so it can access auth.users,
-- but has explicit security checks inside to ensure only the user themselves
-- or an admin can trigger it.

create or replace function delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer -- runs as the function creator (postgres user)
as $$
declare
  is_admin boolean;
begin
  -- 1. Check if the caller is an admin
  select (role = 'admin') into is_admin from public.users where id = auth.uid();
  
  -- 2. Verify authorization (Caller must be the target user OR an admin)
  if auth.uid() = target_user_id or is_admin then
    
    -- Delete the user from auth.users. 
    -- If your public.users table has "ON DELETE CASCADE" for the foreign key, 
    -- it will automatically be removed from public.users as well.
    -- Otherwise, you must delete from public.users first to avoid foreign key constraints.
    delete from public.users where id = target_user_id;
    
    delete from auth.users where id = target_user_id;
  else
    raise exception 'Unauthorized to delete this user';
  end if;
end;
$$;
