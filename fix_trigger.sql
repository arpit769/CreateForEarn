-- Run this in your Supabase SQL Editor to fix the trigger crash and automate referrals!

-- We are adding explicitly schema-qualified enums (public.user_role instead of user_role)
-- because sometimes the auth schema cannot find public types, causing signups to crash!

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
BEGIN
  -- 1. Read referral code from user metadata passed during signup
  ref_code := NEW.raw_user_meta_data->>>'referral_code_used';
  
  -- 2. Find the referrer's ID if code is provided
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO referrer_id 
    FROM public.users 
    WHERE UPPER(referral_code) = UPPER(TRIM(ref_code))
    LIMIT 1;
  END IF;

  -- 3. Insert the new user profile with the referred_by field populated
  INSERT INTO public.users (id, email, role, status, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    'worker'::public.user_role,
    'pending_details'::public.user_status,
    referrer_id
  );

  -- 4. If a valid referrer was found, record the referral linkage
  IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
    BEGIN
      INSERT INTO public.referrals (referrer_id, referred_user_id)
      VALUES (referrer_id, NEW.id)
      ON CONFLICT (referrer_id, referred_user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Safely catch any unexpected errors so signup never fails
      RAISE WARNING 'Referral link failed: %', SQLERRM;
    END;
  END IF;

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


