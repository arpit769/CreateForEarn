-- Migration: Update handle_new_user trigger to assign 'client' role if requested
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
  req_role TEXT;
  assigned_role public.user_role;
BEGIN
  -- 1. Read metadata passed during signup
  ref_code := NEW.raw_user_meta_data->>'referral_code_used';
  req_role := NEW.raw_user_meta_data->>'requested_role';
  
  -- Determine role (default to worker if not explicitly client)
  IF req_role = 'client' THEN
    assigned_role := 'client'::public.user_role;
  ELSE
    assigned_role := 'worker'::public.user_role;
  END IF;

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
    NEW.raw_user_meta_data->>'full_name',
    assigned_role,
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
