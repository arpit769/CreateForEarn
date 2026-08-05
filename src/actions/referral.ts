'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentUserProfileSlim } from './users'

// WORKER: GET REFERRAL DATA (code, stats, referred users list)
export async function getReferralData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch user's referral code and balance
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('referral_code, referral_balance')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  // Fetch all referrals where this user is the referrer
  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('*, referred_user:referred_user_id(email, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  if (referralsError) {
    console.error('Error fetching referrals:', referralsError)
  }

  const referralsList = referrals || []

  const totalReferred = referralsList.length
  const successfulReferrals = referralsList.filter(
    (r: any) => r.reward_paid === true
  ).length
  const pendingReferrals = referralsList.filter(
    (r: any) => r.reward_paid === false
  ).length
  const totalEarnings = Number(profile.referral_balance) || 0

  return {
    referralCode: profile.referral_code,
    referralBalance: totalEarnings,
    totalReferred,
    successfulReferrals,
    pendingReferrals,
    referrals: referralsList,
  }
}

// WORKER: GET REFERRAL BALANCE (lightweight — for wallet display)
export async function getReferralBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from('users')
    .select('referral_balance')
    .eq('id', user.id)
    .single()

  if (error || !data) return 0
  return Number(data.referral_balance) || 0
}
