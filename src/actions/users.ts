'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// FETCH CURRENT USER PROFILE (full — used by worker/profile and admin pages)
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

// FETCH SLIM PROFILE — used by the dashboard layout only.
// Selects only what is needed to check auth + role without the heavy Reddit account JOIN.
export async function getCurrentUserProfileSlim() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, role, email, full_name, active_reddit_account_id, upi_id, crypto_wallet, reddit_accounts!reddit_accounts_user_id_fkey(id, status, rejection_reason, ban_reason)')
    .eq('id', user.id)
    .single()

  if (error) return null
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

// Helper to extract Reddit username from link
function extractRedditUsername(link: string): string | null {
  const match = link.trim().toLowerCase().match(/^(?:https?:\/\/)?(?:www\.)?reddit\.com\/(?:user|u)\/([a-zA-Z0-9_\-]+)/);
  return match ? match[1] : null;
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

  const username = extractRedditUsername(reddit_profile_link)
  if (!username) {
    return { error: 'Invalid Reddit profile link format. Use: https://reddit.com/u/username' }
  }

  // Pre-check for duplicate usernames in the database
  const { data: existing } = await supabase
    .from('reddit_accounts')
    .select('id')
    .ilike('reddit_profile_link', `%/${username}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: 'This Reddit account is already registered in the system.' }
  }

  const normalizedLink = `https://www.reddit.com/u/${username}`

  const { data: redditAcc, error: redditError } = await supabase
    .from('reddit_accounts')
    .insert({ 
      user_id: user.id,
      reddit_profile_link: normalizedLink,
      reddit_karma,
      reddit_account_age,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (redditError) {
    if (redditError.message.includes('unique') || redditError.code === '23505') {
      return { error: 'This Reddit account is already registered in the system.' }
    }
    return { error: redditError.message }
  }

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
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('*, users!reddit_accounts_user_id_fkey(email, full_name, created_at), task_claims(status, tasks(payment_amount)), reddit_account_subreddits(subreddit_id)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { redditAccounts: data }
}

// Helper for assigning tags directly or via RPC
async function syncAccountTags(supabase: any, redditAccountId: string, subredditIds: string[]) {
  // Try direct table operations first (delete old + insert new)
  const { error: delError } = await supabase
    .from('reddit_account_subreddits')
    .delete()
    .eq('reddit_account_id', redditAccountId);

  if (!delError) {
    if (subredditIds && subredditIds.length > 0) {
      const rows = subredditIds.map(subId => ({
        reddit_account_id: redditAccountId,
        subreddit_id: subId
      }));
      const { error: insError } = await supabase
        .from('reddit_account_subreddits')
        .insert(rows);
        
      if (insError) {
        // Fallback to RPC if direct table insert fails
        const { error: tagError } = await supabase.rpc('assign_tags_to_account', {
          target_account_id: redditAccountId,
          tag_ids: subredditIds
        });
        if (tagError) return { error: tagError.message };
      }
    }
    return { success: true };
  }

  // Fallback to RPC if direct delete fails
  const { error: tagError } = await supabase.rpc('assign_tags_to_account', {
    target_account_id: redditAccountId,
    tag_ids: subredditIds
  });
  if (tagError) return { error: tagError.message };

  return { success: true };
}

// ADMIN: VERIFY USER AND ASSIGN TAGS
export async function verifyUser(redditAccountId: string, subredditIds: string[]) {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Update status to verified
  const { error: userError } = await supabase
    .from('reddit_accounts')
    .update({ status: 'verified' })
    .eq('id', redditAccountId)

  if (userError) return { error: userError.message }
  
  // Assign Subreddit Tags
  const tagRes = await syncAccountTags(supabase, redditAccountId, subredditIds);
  if (tagRes?.error) return { error: tagRes.error }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: UPDATE USER TAGS
export async function updateUserTags(redditAccountId: string, subredditIds: string[]) {
  const supabase = await createClient()
  
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const tagRes = await syncAccountTags(supabase, redditAccountId, subredditIds);
  if (tagRes?.error) return { error: tagRes.error }
  
  revalidatePath('/admin/users')
  return { success: true }
}

// ADMIN: REJECT USER
export async function rejectUser(redditAccountId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
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
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
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
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
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
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
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
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const sanitized = name.replace(/^r\//i, '').trim();
  if (!sanitized) return { error: 'Tag name cannot be empty' };

  // Check if exists first
  const { data: existing } = await supabase
    .from('subreddits')
    .select('*')
    .ilike('name', sanitized)
    .maybeSingle()

  if (existing) {
    return { subreddit: existing }
  }

  const { data, error } = await supabase
    .from('subreddits')
    .insert({ name: sanitized })
    .select()
    .single()
    
  if (error) return { error: error.message }
  return { subreddit: data }
}

// ADMIN: DELETE SUBREDDIT / TAG
export async function deleteSubreddit(id: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // 1. Delete associated mappings in reddit_account_subreddits
  const { error: rasError } = await supabase
    .from('reddit_account_subreddits')
    .delete()
    .eq('subreddit_id', id)

  if (rasError) {
    console.error('Error removing account subreddit mappings:', rasError)
  }

  // 2. Unlink any tasks referencing this subreddit
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ subreddit_id: null })
    .eq('subreddit_id', id)

  if (taskError) {
    console.error('Error updating tasks with deleted subreddit:', taskError)
  }

  // 3. Delete the subreddit itself
  const { error } = await supabase
    .from('subreddits')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  revalidatePath('/admin/tasks')
  return { success: true }
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
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { activeUsers: 0, pendingCount: 0 }

  // Run both count queries in parallel
  const [pendingRes, activeRes] = await Promise.all([
    supabase
      .from('reddit_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    supabase
      .from('reddit_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
  ])

  return {
    activeUsers: activeRes.count || 0,
    pendingCount: pendingRes.count || 0,
  }
}
