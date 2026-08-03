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
