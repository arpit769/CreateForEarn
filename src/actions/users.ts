'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// FETCH CURRENT USER PROFILE
export async function getCurrentUserProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*, reddit_accounts!reddit_accounts_user_id_fkey(*, task_claims(status, tasks(payment_amount)), reddit_account_subreddits(subreddit_id, subreddits(name)))')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  // Sort reddit accounts by creation date
  if (profile.reddit_accounts) {
    profile.reddit_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return profile
}

// SET ACTIVE REDDIT ACCOUNT
export async function setActiveRedditAccount(redditAccountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ active_reddit_account_id: redditAccountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// SUBMIT REDDIT DETAILS (Worker Onboarding)
export async function submitRedditDetails(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const reddit_profile_link = formData.get('reddit_profile_link') as string
  const reddit_karma = parseInt(formData.get('reddit_karma') as string)
  const reddit_account_age = formData.get('reddit_account_age') as string

  if (!reddit_profile_link || isNaN(reddit_karma) || !reddit_account_age) {
    return { error: 'Please fill out all fields correctly' }
  }

  const { data: redditAcc, error: redditError } = await supabase
    .from('reddit_accounts')
    .insert({ 
      user_id: user.id,
      reddit_profile_link,
      reddit_karma,
      reddit_account_age,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (redditError) return { error: redditError.message }

  // Always set the newly added account as active so they can see its pending status immediately
  await supabase.from('users').update({ active_reddit_account_id: redditAcc.id }).eq('id', user.id)

  revalidatePath('/', 'layout')
  return { success: true }
}

// REMOVE REDDIT ACCOUNT
export async function removeRedditAccount(redditAccountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('reddit_accounts')
    .delete()
    .eq('id', redditAccountId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  
  // Try to set a new active account if they just deleted their active one
  const { data: profile } = await supabase.from('users').select('active_reddit_account_id').eq('id', user.id).single()
  if (profile && !profile.active_reddit_account_id) {
    const { data: remainingAccounts } = await supabase.from('reddit_accounts').select('id').eq('user_id', user.id).limit(1)
    if (remainingAccounts && remainingAccounts.length > 0) {
      await supabase.from('users').update({ active_reddit_account_id: remainingAccounts[0].id }).eq('id', user.id)
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// UPDATE PAYMENT DETAILS
export async function updatePaymentDetails(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const upi_id = formData.get('upi_id') as string | null
  const crypto_wallet = formData.get('crypto_wallet') as string | null
  const crypto_network = formData.get('crypto_network') as string | null

  const { error } = await supabase
    .from('users')
    .update({ 
      upi_id,
      crypto_wallet,
      crypto_network
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/worker/profile')
  return { success: true }
}

// ADMIN: FETCH ALL REDDIT ACCOUNTS
export async function getAllRedditAccounts() {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('*, users!reddit_accounts_user_id_fkey(email, created_at), task_claims(status, tasks(payment_amount)), reddit_account_subreddits(subreddit_id)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { redditAccounts: data }
}

// ADMIN: VERIFY USER AND ASSIGN TAGS
export async function verifyUser(redditAccountId: string, subredditIds: string[]) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Update status to verified
  const { error: userError } = await supabase
    .from('reddit_accounts')
    .update({ status: 'verified' })
    .eq('id', redditAccountId)

  if (userError) return { error: userError.message }
  
  // Assign Subreddit Tags via RPC (bypasses RLS)
  const { error: tagError } = await supabase.rpc('assign_tags_to_account', {
    target_account_id: redditAccountId,
    tag_ids: subredditIds
  });
  if (tagError) return { error: tagError.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: UPDATE USER TAGS
export async function updateUserTags(redditAccountId: string, subredditIds: string[]) {
  const supabase = await createClient()
  
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error: tagError } = await supabase.rpc('assign_tags_to_account', {
    target_account_id: redditAccountId,
    tag_ids: subredditIds
  });
  if (tagError) return { error: tagError.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: REJECT USER
export async function rejectUser(redditAccountId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('reddit_accounts')
    .update({ 
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', redditAccountId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: BAN USER
export async function banUser(redditAccountId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('reddit_accounts')
    .update({ 
      status: 'banned',
      ban_reason: reason
    })
    .eq('id', redditAccountId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: BAN ENTIRE USER (ALL REDDIT ACCOUNTS)
export async function banEntireUser(userId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('reddit_accounts')
    .update({ 
      status: 'banned',
      ban_reason: reason
    })
    .eq('user_id', userId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: UNBAN USER
export async function unbanUser(redditAccountId: string) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('reddit_accounts')
    .update({ 
      status: 'verified',
      ban_reason: null
    })
    .eq('id', redditAccountId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: GET ALL SUBREDDITS
export async function getSubreddits() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('subreddits').select('*').order('name')
  if (error) return { error: error.message }
  return { subreddits: data }
}

// ADMIN: CREATE SUBREDDIT
export async function createSubreddit(name: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('subreddits')
    .insert({ name })
    .select()
    .single()
    
  if (error) return { error: error.message }
  return { subreddit: data }
}

// DELETE USER ACCOUNT
export async function deleteUserAccount(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // We rely on the Postgres RPC which runs with SECURITY DEFINER and checks auth internally
  const { error } = await supabase.rpc('delete_user_account', { target_user_id: targetUserId })

  if (error) {
    console.error('Error deleting user:', error)
    return { error: error.message }
  }

  // If the user deleted themselves, sign them out
  if (user.id === targetUserId) {
    await supabase.auth.signOut()
    revalidatePath('/')
  } else {
    revalidatePath('/admin/users')
  }
  
  return { success: true }
}
// ... existing functions ...

export async function getAdminHeaderStats() {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { activeUsers: 0, pendingCount: 0 }

  // Get pending count (reddit accounts)
  const { count: pendingCount } = await supabase
    .from('reddit_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval')

  // Get active users (verified reddit accounts)
  const { count: activeUsers } = await supabase
    .from('reddit_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')

  return {
    activeUsers: activeUsers || 0,
    pendingCount: pendingCount || 0
  }
}
