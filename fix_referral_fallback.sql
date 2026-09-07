-- ============================================================================
-- REFERRAL SYSTEM FIX — Run this in Supabase SQL Editor
-- Adds a fallback RPC function + UPDATE trigger to handle edge cases
-- where the INSERT trigger doesn't fire (e.g., soft-deleted user re-signup)
-- ============================================================================

-- 1. Secure RPC function: creates referral link (called from signup action as fallback)
CREATE OR REPLACE FUNCTION public.create_referral_link(p_user_id UUID, p_referral_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  IF p_referral_code IS NULL OR TRIM(p_referral_code) = '' THEN
    RETURN;
  END IF;

  -- Find the referrer by their referral code
  SELECT id INTO v_referrer_id
  FROM public.users
  WHERE UPPER(referral_code) = UPPER(TRIM(p_referral_code))
  LIMIT 1;

  -- Don't allow self-referral
  IF v_referrer_id IS NULL OR v_referrer_id = p_user_id THEN
    RETURN;
  END IF;

  -- Set referred_by on the user (only if not already set)
  UPDATE public.users 
  SET referred_by = v_referrer_id 
  WHERE id = p_user_id AND referred_by IS NULL;

  -- Create the referral tracking row
  INSERT INTO public.referrals (referrer_id, referred_user_id)
  VALUES (v_referrer_id, p_user_id)
  ON CONFLICT (referrer_id, referred_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. UPDATE trigger: catches re-signups where Supabase reactivates a soft-deleted user
CREATE OR REPLACE FUNCTION public.handle_user_reactivation()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
  user_full_name TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Only process meaningful updates (metadata changes during re-signup)
  IF OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
    ref_code := NEW.raw_user_meta_data->>'referral_code_used';
    user_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Check if public.users row exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;

    IF NOT user_exists THEN
      -- User row missing (was cascade deleted) — recreate it
      IF ref_code IS NOT NULL AND ref_code <> '' THEN
        SELECT id INTO referrer_id
        FROM public.users
        WHERE UPPER(referral_code) = UPPER(TRIM(ref_code))
        LIMIT 1;
      END IF;

      INSERT INTO public.users (id, email, full_name, role, status, referred_by)
      VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        'worker'::public.user_role,
        'pending_details'::public.user_status,
        referrer_id
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        referred_by = COALESCE(public.users.referred_by, EXCLUDED.referred_by);

      -- Create referral link if applicable
      IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id)
        VALUES (referrer_id, NEW.id)
        ON CONFLICT (referrer_id, referred_user_id) DO NOTHING;
      END IF;
    ELSE
      -- User row exists but referred_by might be missing — update it
      IF ref_code IS NOT NULL AND ref_code <> '' THEN
        SELECT id INTO referrer_id
        FROM public.users
        WHERE UPPER(referral_code) = UPPER(TRIM(ref_code))
        LIMIT 1;

        IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
          UPDATE public.users
          SET referred_by = referrer_id,
              full_name = COALESCE(user_full_name, full_name)
          WHERE id = NEW.id AND referred_by IS NULL;

          INSERT INTO public.referrals (referrer_id, referred_user_id)
          VALUES (referrer_id, NEW.id)
          ON CONFLICT (referrer_id, referred_user_id) DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_reactivated ON auth.users;
CREATE TRIGGER on_auth_user_reactivated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_reactivation();
