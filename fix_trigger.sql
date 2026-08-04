-- Run this in your Supabase SQL Editor to fix the trigger crash!

-- We are adding explicitly schema-qualified enums (public.user_role instead of user_role)
-- because sometimes the auth schema cannot find public types, causing signups to crash!

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    'worker'::public.user_role,
    'pending_details'::public.user_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Bind the trigger to auth.users if it doesn't already exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: sync any existing users who signed up but are missing a public.users profile row
INSERT INTO public.users (id, email, role, status)
SELECT id, email, 'worker'::public.user_role, 'pending_details'::public.user_status
FROM auth.users
ON CONFLICT (id) DO NOTHING;

