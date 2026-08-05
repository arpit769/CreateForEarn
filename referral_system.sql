-- ============================================================================
-- REFERRAL SYSTEM — Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Add referral columns to the users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referral_balance NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Create the referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  successful_tasks_count INTEGER DEFAULT 0,
  reward_paid BOOLEAN DEFAULT FALSE,
  reward_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_user_id)
);

-- 3. Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own referral rows (as referrer)
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- RLS: Admins have full access
CREATE POLICY "Admins have full access to referrals"
  ON public.referrals FOR ALL
  USING (public.is_admin());

-- RLS: Allow insert for authenticated users (needed during signup to create the referral link)
CREATE POLICY "Authenticated users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Function to generate a unique 8-character referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: auto-generate referral code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_referral_code_on_insert ON public.users;
CREATE TRIGGER set_referral_code_on_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral_code();

-- 6. Backfill: generate referral codes for all existing users who don't have one
UPDATE public.users
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;
