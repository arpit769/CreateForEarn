'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile, getCurrentUserProfileSlim } from './users'


// WORKER: GET WALLET BALANCES
export async function getWalletBalances() {
  const supabase = await createClient()
  // Use direct auth — we only need user.id, no need for the full profile JOIN
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Run claims, withdrawals, and referral balance in parallel
  const [claimsRes, withdrawalsRes, referralRes] = await Promise.all([
    supabase
      .from('task_claims')
      .select('status, bonus_amount, tasks(payment_amount)')
      .eq('user_id', user.id),
    supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('referral_balance')
      .eq('id', user.id)
      .single(),
  ])

  const claims = claimsRes.data
  const withdrawals = withdrawalsRes.data
  const referralBalance = Number(referralRes.data?.referral_balance) || 0

  let pendingBalance = 0
  let availableBalance = 0
  let paidBalance = 0
  let rejectedBalance = 0

  // Aggregate claims
  claims?.forEach((claim: any) => {
    const amount = Number(claim.tasks.payment_amount)
    const bonus = Number(claim.bonus_amount) || 0
    if (claim.status === 'submitted') pendingBalance += amount
    if (claim.status === 'approved') availableBalance += (amount + bonus)
    if (claim.status === 'rejected') rejectedBalance += amount
  })

  // Deduct withdrawals from available, add to paid
  withdrawals?.forEach((w: any) => {
    const amount = Number(w.amount)
    if (w.status === 'pending' || w.status === 'approved') {
      availableBalance -= amount // It's locked/requested
    }
    if (w.status === 'paid') {
      availableBalance -= amount // Deduct from available permanently
      paidBalance += amount
    }
  })

  return {
    pendingBalance,
    availableBalance,
    paidBalance,
    rejectedBalance,
    referralBalance
  }
}

// WORKER: REQUEST WITHDRAWAL
export async function requestWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const requestingProfile = await getCurrentUserProfileSlim()
  if (!requestingProfile) return { error: 'Unauthorized' }

  const amount = parseFloat(formData.get('amount') as string)
  const method = formData.get('method') as 'upi' | 'crypto_polygon' | 'crypto_bep20'

  if (isNaN(amount) || amount <= 0) return { error: 'Invalid amount' }
  if (amount < 1.00) return { error: 'Minimum withdrawal amount is $1.00' }
  if (!method) return { error: 'Invalid method' }

  // Need full profile for payment details validation
  const profile = await getCurrentUserProfile()
  if (!profile) return { error: 'Unauthorized' }


  // Check if they have payment details for this method
  const cryptoParts = (profile.crypto_wallet || '').split('|');
  const polygonAddress = cryptoParts.length > 1 ? cryptoParts[0] : (profile.crypto_network === 'polygon_usdt' ? profile.crypto_wallet : '');
  const cozyWalletId = cryptoParts.length > 1 ? cryptoParts[1] : (profile.crypto_network === 'cozy' ? profile.crypto_wallet : '');

  if (method === 'upi' && !profile.upi_id) {
    return { error: 'UPI details are missing in profile' }
  }
  if (method === 'crypto_polygon' && !polygonAddress) {
    return { error: 'Polygon USDT wallet address is missing in profile' }
  }
  if (method === 'crypto_bep20' && !cozyWalletId) {
    return { error: 'Cozy Wallet ID is missing in profile' }
  }

  // Double check balance server-side
  const balances = await getWalletBalances()
  if (!balances || balances.availableBalance < amount) {
    return { error: 'Insufficient available balance' }
  }

  const { error } = await supabase
    .from('withdrawals')
    .insert([{
      user_id: profile.id,
      amount,
      method,
      status: 'pending'
    }])

  if (error) return { error: error.message }

  revalidatePath('/worker/wallet')
  return { success: true }
}

// ADMIN: FETCH ALL WITHDRAWALS
export async function getAllWithdrawals() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const { data, error } = await supabase
    .from('withdrawals')
    .select('*, users(email, full_name, upi_id, crypto_wallet, crypto_network)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { withdrawals: data }
}

// ADMIN: PROCESS WITHDRAWAL
export async function processWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const withdrawalId = formData.get('withdrawal_id') as string
  const status = formData.get('status') as 'approved' | 'rejected' | 'paid'
  const transaction_hash = formData.get('transaction_hash') as string | null

  const { error } = await supabase
    .from('withdrawals')
    .update({
      status,
      transaction_hash,
      updated_at: new Date().toISOString()
    })
    .eq('id', withdrawalId)

  if (error) return { error: error.message }

  revalidatePath('/admin/withdrawals')
  return { success: true }
}
