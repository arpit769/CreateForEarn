-- Migration: Add full_name column to users table and sync from signup metadata
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add full_name column to public.users if it doesn't already exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Update the handle_new_user() trigger function to extract full_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
  user_full_name TEXT;
BEGIN
  -- 1. Read metadata passed during signup
  ref_code := NEW.raw_user_meta_data->>'referral_code_used';
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- 2. Find the referrer's ID if code is provided
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO referrer_id 
    FROM public.users 
    WHERE UPPER(referral_code) = UPPER(TRIM(ref_code))
    LIMIT 1;
  END IF;

  -- 3. Insert the new user profile with the full_name and referred_by populated
  INSERT INTO public.users (id, email, full_name, role, status, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
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

-- 3. Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill full_name for existing users from auth.users metadata
UPDATE public.users u
SET full_name = a.raw_user_meta_data->>'full_name'
FROM auth.users a
WHERE u.id = a.id
  AND (u.full_name IS NULL OR u.full_name = '')
  AND a.raw_user_meta_data->>'full_name' IS NOT NULL;
