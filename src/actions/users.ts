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
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  return profile
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

  const { error } = await supabase
    .from('users')
    .update({ 
      reddit_profile_link,
      reddit_karma,
      reddit_account_age,
      status: 'pending_approval' 
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

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

// ADMIN: FETCH ALL USERS
export async function getAllUsers() {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { users: data }
}

// ADMIN: VERIFY USER AND ASSIGN TAGS
export async function verifyUser(userId: string, subredditIds: string[]) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Update status to verified
  const { error: userError } = await supabase
    .from('users')
    .update({ status: 'verified' })
    .eq('id', userId)

  if (userError) return { error: userError.message }
  
  // Assign Subreddit Tags
  const records = subredditIds.map(id => ({ user_id: userId, subreddit_id: id }));
  if (records.length > 0) {
    const { error: tagError } = await supabase
      .from('user_subreddits')
      .insert(records)
      
    // If tag assignment fails due to unique constraint, it's fine, they already have it.
    // Otherwise, handle error.
    if (tagError && tagError.code !== '23505') {
      return { error: tagError.message }
    }
  }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: REJECT USER
export async function rejectUser(userId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('users')
    .update({ 
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', userId)

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

  // Get pending count
  const { count: pendingCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval')

  // Get active users (verified workers)
  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')
    .eq('role', 'worker')

  return {
    activeUsers: activeUsers || 0,
    pendingCount: pendingCount || 0
  }
}
