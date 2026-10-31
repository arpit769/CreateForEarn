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

  if (claimsRes.error) {
    console.error('Error fetching claims in getWalletBalances:', claimsRes.error)
    throw new Error('Failed to fetch wallet balances')
  }
  if (withdrawalsRes.error) {
    console.error('Error fetching withdrawals in getWalletBalances:', withdrawalsRes.error)
    throw new Error('Failed to fetch wallet balances')
  }

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

  // Round to 2 decimal places to eliminate floating-point drift
  // (e.g. 12.9999999 → 13.00) that blocks full-balance withdrawals
  return {
    pendingBalance: Math.round(pendingBalance * 100) / 100,
    availableBalance: Math.round(availableBalance * 100) / 100,
    paidBalance: Math.round(paidBalance * 100) / 100,
    rejectedBalance: Math.round(rejectedBalance * 100) / 100,
    referralBalance: Math.round(referralBalance * 100) / 100,
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

  // Calculate next sequential withdrawal ID (T-1, T-2, T-3...)
  let nextSeqId: number | null = null;
  try {
    const { data: maxW } = await supabase
      .from('withdrawals')
      .select('withdrawal_seq_id')
      .not('withdrawal_seq_id', 'is', null)
      .order('withdrawal_seq_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxW?.withdrawal_seq_id) {
      nextSeqId = Number(maxW.withdrawal_seq_id) + 1;
    } else {
      const { count } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true });
      nextSeqId = (count || 0) + 1;
    }
  } catch (err) {
    console.warn('Could not compute next withdrawal_seq_id:', err);
  }

  const insertData: Record<string, string | number> = {
    user_id: profile.id,
    amount,
    method,
    status: 'pending'
  };

  if (nextSeqId) {
    insertData.withdrawal_seq_id = nextSeqId;
  }

  // Insert, gracefully falling back if withdrawal_seq_id column does not exist yet in DB
  let { error } = await supabase
    .from('withdrawals')
    .insert([insertData]);

  if (error && error.message?.includes('withdrawal_seq_id')) {
    delete insertData.withdrawal_seq_id;
    const retry = await supabase
      .from('withdrawals')
      .insert([insertData]);
    error = retry.error;
  }

  if (error) return { error: error.message }

  revalidatePath('/worker/wallet')
  revalidatePath('/admin/withdrawals')
  return { success: true }
}

export interface WithdrawalWithUser {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_hash: string | null;
  rejection_reason?: string | null;
  withdrawal_seq_id?: number | null;
  display_id?: string;
  created_at: string;
  users: {
    email: string;
    full_name?: string | null;
    upi_id: string | null;
    crypto_wallet: string | null;
    crypto_network: string | null;
  } | null;
}

// ADMIN: FETCH ALL WITHDRAWALS
export async function getAllWithdrawals() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*, users(email, full_name, upi_id, crypto_wallet, crypto_network)')
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }

  // Assign deterministic T-1, T-2... in chronological order (oldest first = 1, 2, 3...)
  const mapped: WithdrawalWithUser[] = ((data as unknown as WithdrawalWithUser[]) || []).map((w, index) => {
    const seq = w.withdrawal_seq_id ? Number(w.withdrawal_seq_id) : (index + 1);
    return {
      ...w,
      withdrawal_seq_id: seq,
      display_id: `T-${seq}`,
    };
  });

  // Re-sort descending (newest first) for admin view
  mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { withdrawals: mapped }
}

// ADMIN: PROCESS WITHDRAWAL
export async function processWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const withdrawalId = formData.get('withdrawal_id') as string
  const status = formData.get('status') as 'approved' | 'rejected' | 'paid'
  const transaction_hash = formData.get('transaction_hash') as string | null
  const rejection_reason = formData.get('rejection_reason') as string | null

  const updatePayload: Record<string, any> = {
    status,
    transaction_hash: status === 'paid' ? transaction_hash : null,
    rejection_reason: status === 'rejected' ? rejection_reason : null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('withdrawals')
    .update(updatePayload)
    .eq('id', withdrawalId)

  if (error) return { error: error.message }

  revalidatePath('/admin/withdrawals')
  revalidatePath('/worker/wallet')
  return { success: true }
}

