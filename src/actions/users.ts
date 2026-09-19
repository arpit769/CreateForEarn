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
    .select('*, reddit_accounts!reddit_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount)), reddit_account_subreddits(subreddit_id, subreddits(name))), youtube_accounts!youtube_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount))), x_accounts!x_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount))), quora_accounts!quora_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount))), instagram_accounts!instagram_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount))), linkedin_accounts!linkedin_accounts_user_id_fkey(*, task_claims(status, bonus_amount, tasks(payment_amount)))')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  // Sort accounts by creation date
  if (profile.reddit_accounts) {
    profile.reddit_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  
  if (profile.youtube_accounts) {
    profile.youtube_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (profile.x_accounts) {
    profile.x_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (profile.quora_accounts) {
    profile.quora_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (profile.instagram_accounts) {
    profile.instagram_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  if (profile.linkedin_accounts) {
    profile.linkedin_accounts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
    .select('id, role, email, full_name, active_reddit_account_id, active_youtube_account_id, active_x_account_id, active_quora_account_id, active_instagram_account_id, active_linkedin_account_id, upi_id, crypto_wallet, reddit_accounts!reddit_accounts_user_id_fkey(id, status, reddit_profile_link, rejection_reason, ban_reason), youtube_accounts!youtube_accounts_user_id_fkey(id, status, channel_name, email_id, rejection_reason, ban_reason), x_accounts!x_accounts_user_id_fkey(id, status, username, profile_url, rejection_reason, ban_reason), quora_accounts!quora_accounts_user_id_fkey(id, status, username, profile_url, rejection_reason, ban_reason), instagram_accounts!instagram_accounts_user_id_fkey(id, status, username, profile_url, rejection_reason, ban_reason), linkedin_accounts!linkedin_accounts_user_id_fkey(id, status, username, profile_url, headline, connections_count, rejection_reason, ban_reason)')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching slim profile:', error)
    return null
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

export async function getAdminHeaderStats(existingProfile?: any) {
  const supabase = await createClient()
  
  // Use passed profile or fetch if not provided
  const profile = existingProfile || await getCurrentUserProfileSlim()
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

// SET ACTIVE YOUTUBE ACCOUNT
export async function setActiveYoutubeAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ active_youtube_account_id: accountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// SUBMIT YOUTUBE DETAILS
export async function submitYoutubeDetails(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const channel_name = formData.get('channel_name') as string
  const email_id = formData.get('email_id') as string

  if (!channel_name || !email_id) {
    return { error: 'Please fill out all fields.' }
  }

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('youtube_accounts')
    .select('id')
    .eq('email_id', email_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: 'This YouTube email is already registered in the system.' }
  }

  const { data: ytAcc, error: ytError } = await supabase
    .from('youtube_accounts')
    .insert({ 
      user_id: user.id,
      channel_name,
      email_id,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (ytError) {
    if (ytError.message.includes('unique') || ytError.code === '23505') {
      return { error: 'This YouTube account is already registered.' }
    }
    return { error: ytError.message }
  }

  // Set as active
  await supabase.from('users').update({ active_youtube_account_id: ytAcc.id }).eq('id', user.id)

  revalidatePath('/', 'layout')
  return { success: true }
}

// ==========================================
// YOUTUBE ADMIN ACTIONS
// ==========================================

export async function getAllYoutubeAccounts() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('youtube_accounts')
    .select('*, users:user_id(email, full_name, created_at)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { youtubeAccounts: data }
}

export async function verifyYoutubeAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('youtube_accounts')
    .update({ status: 'verified', rejection_reason: null, ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/youtube-users')
  return { success: true }
}

export async function rejectYoutubeAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('youtube_accounts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/youtube-users')
  return { success: true }
}

export async function banYoutubeAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('youtube_accounts')
    .update({ status: 'banned', ban_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/youtube-users')
  return { success: true }
}


export async function unbanYoutubeAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('youtube_accounts')
    .update({ status: 'verified', ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/youtube-users')
  return { success: true }
}

export async function adminRemoveYoutubeAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('youtube_accounts')
    .delete()
    .eq('id', accountId)
    
  if (error) return { error: error.message }
  revalidatePath('/admin/youtube-users')
  return { success: true }
}

export async function removeYoutubeAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if we're deleting the active account
  const profile = await getCurrentUserProfileSlim()
  
  // Delete the account
  const { error } = await supabase
    .from('youtube_accounts')
    .delete()
    .match({ id: accountId, user_id: user.id }) // Ensure it belongs to the user
    
  if (error) return { error: error.message }

  // If it was the active account, set active_youtube_account_id to null
  if (profile?.active_youtube_account_id === accountId) {
    await supabase.from('users').update({ active_youtube_account_id: null }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ==========================================
// X (TWITTER) USER & ADMIN ACTIONS
// ==========================================

// Helper to extract clean X/Twitter username
function extractXUsername(input: string): string {
  let cleaned = input.trim();
  // Remove trailing slashes and query params
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/+$/, '');
  // Remove @ if starts with @
  cleaned = cleaned.replace(/^@/, '');
  // If it's a URL, extract the username path
  const match = cleaned.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  if (match) {
    return match[1];
  }
  // Strip any remaining leading protocol / domain
  const parts = cleaned.split('/');
  return parts[parts.length - 1].replace(/^@/, '');
}

// SET ACTIVE X ACCOUNT
export async function setActiveXAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ active_x_account_id: accountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// SUBMIT X DETAILS (Worker Onboarding)
export async function submitXDetails(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const rawUsername = (formData.get('username') as string | null) || '';
  const rawProfileUrl = (formData.get('profile_url') as string | null) || '';

  if (!rawProfileUrl.trim() && !rawUsername.trim()) {
    return { error: 'Please enter your X (Twitter) profile URL and username.' }
  }

  if (!rawProfileUrl.trim()) {
    return { error: 'Profile link is compulsory for X account verification.' }
  }

  // Extract username from username field or profile url
  let username = extractXUsername(rawUsername || rawProfileUrl);
  if (!username && rawProfileUrl) {
    username = extractXUsername(rawProfileUrl);
  }

  if (!username) {
    return { error: 'Invalid X username or profile URL format.' }
  }

  // Normalize profile URL
  let profile_url = rawProfileUrl.trim();
  if (!profile_url.startsWith('http://') && !profile_url.startsWith('https://')) {
    profile_url = `https://${profile_url}`;
  }

  // Check for duplicate username
  const { data: existing } = await supabase
    .from('x_accounts')
    .select('id')
    .ilike('username', username)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: 'This X (Twitter) account is already registered in the system.' }
  }

  const { data: xAcc, error: xError } = await supabase
    .from('x_accounts')
    .insert({ 
      user_id: user.id,
      username,
      profile_url,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (xError) {
    if (xError.message.includes('unique') || xError.code === '23505') {
      return { error: 'This X (Twitter) account is already registered.' }
    }
    return { error: xError.message }
  }

  // Set as active
  await supabase.from('users').update({ active_x_account_id: xAcc.id }).eq('id', user.id)

  revalidatePath('/', 'layout')
  return { success: true }
}

// REMOVE X ACCOUNT (Worker)
export async function removeXAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile = await getCurrentUserProfileSlim()
  
  const { error } = await supabase
    .from('x_accounts')
    .delete()
    .match({ id: accountId, user_id: user.id })
    
  if (error) return { error: error.message }

  if (profile?.active_x_account_id === accountId) {
    await supabase.from('users').update({ active_x_account_id: null }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ADMIN: GET ALL X ACCOUNTS
export async function getAllXAccounts() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('x_accounts')
    .select('*, users:user_id(email, full_name, created_at)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { xAccounts: data }
}

// ADMIN: VERIFY X ACCOUNT
export async function verifyXAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('x_accounts')
    .update({ status: 'verified', rejection_reason: null, ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/x-users')
  return { success: true }
}

// ADMIN: REJECT X ACCOUNT
export async function rejectXAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('x_accounts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/x-users')
  return { success: true }
}

// ADMIN: BAN X ACCOUNT
export async function banXAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('x_accounts')
    .update({ status: 'banned', ban_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/x-users')
  return { success: true }
}

// ADMIN: UNBAN X ACCOUNT
export async function unbanXAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('x_accounts')
    .update({ status: 'verified', ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/x-users')
  return { success: true }
}

// ADMIN: REMOVE X ACCOUNT
export async function adminRemoveXAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('x_accounts')
    .delete()
    .eq('id', accountId)
    
  if (error) return { error: error.message }
  revalidatePath('/admin/x-users')
  return { success: true }
}

// ----------------------------------------------------
// QUORA ACCOUNT ACTIONS
// ----------------------------------------------------

// SET ACTIVE QUORA ACCOUNT
export async function setActiveQuoraAccount(quoraAccountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: quoraAccount, error: accError } = await supabase
    .from('quora_accounts')
    .select('id')
    .eq('id', quoraAccountId)
    .eq('user_id', user.id)
    .single()

  if (accError || !quoraAccount) {
    return { error: 'Quora account not found or does not belong to you' }
  }

  const { error } = await supabase
    .from('users')
    .update({ active_quora_account_id: quoraAccountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// SUBMIT QUORA DETAILS (Worker Onboarding)
export async function submitQuoraDetails(formData: FormData) {
  const rawProfileUrl = (formData.get('profile_url') as string | null) || '';
  const rawUsername = (formData.get('username') as string | null) || '';
  return addQuoraAccount(rawProfileUrl, rawUsername);
}

// ADD QUORA ACCOUNT (Worker)
export async function addQuoraAccount(rawProfileUrl: string, rawUsername?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!rawProfileUrl?.trim()) {
    return { error: 'Profile link is compulsory for Quora account verification.' }
  }

  const { extractQuoraUsername } = await import('@/utils/quora')
  let username = extractQuoraUsername(rawUsername || rawProfileUrl)
  if (!username && rawProfileUrl) {
    username = extractQuoraUsername(rawProfileUrl)
  }

  if (!username) {
    return { error: 'Invalid Quora username or profile URL format.' }
  }

  let profile_url = rawProfileUrl.trim()
  if (!profile_url.startsWith('http://') && !profile_url.startsWith('https://')) {
    profile_url = `https://${profile_url}`
  }

  // Check for duplicate username
  const { data: existing } = await supabase
    .from('quora_accounts')
    .select('id')
    .ilike('username', username)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'This Quora account is already registered in the system.' }
  }

  const { data: quoraAcc, error: quoraError } = await supabase
    .from('quora_accounts')
    .insert({ 
      user_id: user.id,
      username,
      profile_url,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (quoraError) {
    if (quoraError.message.includes('unique') || quoraError.code === '23505') {
      return { error: 'This Quora account is already registered.' }
    }
    return { error: quoraError.message }
  }

  // Set as active
  await supabase.from('users').update({ active_quora_account_id: quoraAcc.id }).eq('id', user.id)

  revalidatePath('/', 'layout')
  return { success: true }
}

// REMOVE QUORA ACCOUNT (Worker)
export async function removeQuoraAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile = await getCurrentUserProfileSlim()
  
  const { error } = await supabase
    .from('quora_accounts')
    .delete()
    .match({ id: accountId, user_id: user.id })
    
  if (error) return { error: error.message }

  if (profile?.active_quora_account_id === accountId) {
    await supabase.from('users').update({ active_quora_account_id: null }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ADMIN: GET ALL QUORA ACCOUNTS
export async function getAllQuoraAccounts() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('quora_accounts')
    .select('*, users:user_id(email, full_name, created_at)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { quoraAccounts: data }
}

// ADMIN: VERIFY QUORA ACCOUNT
export async function verifyQuoraAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('quora_accounts')
    .update({ status: 'verified', rejection_reason: null, ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/quora-users')
  return { success: true }
}

// ADMIN: REJECT QUORA ACCOUNT
export async function rejectQuoraAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('quora_accounts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/quora-users')
  return { success: true }
}

// ADMIN: BAN QUORA ACCOUNT
export async function banQuoraAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('quora_accounts')
    .update({ status: 'banned', ban_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/quora-users')
  return { success: true }
}

// ADMIN: UNBAN QUORA ACCOUNT
export async function unbanQuoraAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('quora_accounts')
    .update({ status: 'verified', ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/quora-users')
  return { success: true }
}

// ADMIN: REMOVE QUORA ACCOUNT
export async function adminRemoveQuoraAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('quora_accounts')
    .delete()
    .eq('id', accountId)
    
  if (error) return { error: error.message }
  revalidatePath('/admin/quora-users')
  return { success: true }
}

// ============================================================================
// INSTAGRAM ACCOUNT ACTIONS
// ============================================================================

// SET ACTIVE INSTAGRAM ACCOUNT
export async function setActiveInstagramAccount(instagramAccountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ active_instagram_account_id: instagramAccountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// SUBMIT INSTAGRAM DETAILS (Worker Onboarding)
export async function submitInstagramDetails(formData: FormData) {
  const rawProfileUrl = (formData.get('profile_url') as string | null) || '';
  const rawUsername = (formData.get('username') as string | null) || '';
  return addInstagramAccount(rawProfileUrl, rawUsername);
}

// ADD INSTAGRAM ACCOUNT (Worker)
export async function addInstagramAccount(rawProfileUrl: string, rawUsername?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!rawProfileUrl?.trim()) {
    return { error: 'Profile link is compulsory for Instagram account verification.' }
  }

  const { extractInstagramUsername } = await import('@/utils/instagram')
  let username = extractInstagramUsername(rawUsername || rawProfileUrl)
  if (!username && rawProfileUrl) {
    username = extractInstagramUsername(rawProfileUrl)
  }

  if (!username) {
    return { error: 'Invalid Instagram username or profile URL format.' }
  }

  let profile_url = rawProfileUrl.trim()
  if (!profile_url.startsWith('http://') && !profile_url.startsWith('https://')) {
    profile_url = `https://${profile_url}`
  }

  // Check for duplicate username
  const { data: existing } = await supabase
    .from('instagram_accounts')
    .select('id')
    .ilike('username', username)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'This Instagram account is already registered in the system.' }
  }

  const { data: igAcc, error: igError } = await supabase
    .from('instagram_accounts')
    .insert({ 
      user_id: user.id,
      username,
      profile_url,
      status: 'pending_approval' 
    })
    .select()
    .single()

  if (igError) {
    if (igError.message.includes('unique') || igError.code === '23505') {
      return { error: 'This Instagram account is already registered.' }
    }
    return { error: igError.message }
  }

  // Set as active
  await supabase.from('users').update({ active_instagram_account_id: igAcc.id }).eq('id', user.id)

  revalidatePath('/', 'layout')
  return { success: true }
}

// REMOVE INSTAGRAM ACCOUNT (Worker)
export async function removeInstagramAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile = await getCurrentUserProfileSlim()
  
  const { error } = await supabase
    .from('instagram_accounts')
    .delete()
    .match({ id: accountId, user_id: user.id })
    
  if (error) return { error: error.message }

  if (profile?.active_instagram_account_id === accountId) {
    await supabase.from('users').update({ active_instagram_account_id: null }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ADMIN: GET ALL INSTAGRAM ACCOUNTS
export async function getAllInstagramAccounts() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('instagram_accounts')
    .select('*, users:user_id(email, full_name, created_at)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { instagramAccounts: data }
}

// ADMIN: VERIFY INSTAGRAM ACCOUNT
export async function verifyInstagramAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('instagram_accounts')
    .update({ status: 'verified', rejection_reason: null, ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/instagram-users')
  return { success: true }
}

// ADMIN: REJECT INSTAGRAM ACCOUNT
export async function rejectInstagramAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('instagram_accounts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/instagram-users')
  return { success: true }
}

// ADMIN: BAN INSTAGRAM ACCOUNT
export async function banInstagramAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('instagram_accounts')
    .update({ status: 'banned', ban_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/instagram-users')
  return { success: true }
}

// ADMIN: UNBAN INSTAGRAM ACCOUNT
export async function unbanInstagramAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('instagram_accounts')
    .update({ status: 'verified', ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/instagram-users')
  return { success: true }
}

// ADMIN: REMOVE INSTAGRAM ACCOUNT
export async function adminRemoveInstagramAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('instagram_accounts')
    .delete()
    .eq('id', accountId)
    
  if (error) return { error: error.message }
  revalidatePath('/admin/instagram-users')
  return { success: true }
}

// ==========================================
// LINKEDIN USER & ADMIN ACTIONS
// ==========================================

// Helper to extract clean LinkedIn username or slug
function extractLinkedInUsernameHelper(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const inMatch = cleaned.match(/(?:linkedin\.com\/(?:in|company)\/)([a-zA-Z0-9_\-]+)/i);
  if (inMatch) {
    return inMatch[1];
  }
  cleaned = cleaned.replace(/^(?:in\/|@)/, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || cleaned;
}

// SUBMIT LINKEDIN DETAILS (Worker Onboarding)
export async function submitLinkedInDetails(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile_url = formData.get('profile_url') as string
  const headline = formData.get('headline') as string || null
  const connections_count_raw = formData.get('connections_count') as string
  const connections_count = connections_count_raw ? parseInt(connections_count_raw, 10) : 0

  if (!profile_url) {
    return { error: 'Please enter your LinkedIn profile URL or handle' }
  }

  const username = extractLinkedInUsernameHelper(profile_url)
  if (!username) {
    return { error: 'Invalid LinkedIn profile link. Use: https://www.linkedin.com/in/username' }
  }

  // Pre-check for duplicate usernames in the database
  const { data: existingUser } = await supabase
    .from('linkedin_accounts')
    .select('id, user_id')
    .ilike('username', username)
    .maybeSingle()

  if (existingUser) {
    if (existingUser.user_id === user.id) {
      return { error: 'You have already added this LinkedIn account.' }
    } else {
      return { error: 'This LinkedIn profile is already registered by another user.' }
    }
  }

  // Standardize URL
  const standardizedUrl = `https://www.linkedin.com/in/${username}`

  // Insert the LinkedIn account
  const { data: newAccount, error: insertError } = await supabase
    .from('linkedin_accounts')
    .insert({
      user_id: user.id,
      username,
      profile_url: standardizedUrl,
      headline,
      connections_count: isNaN(connections_count) ? 0 : connections_count,
      status: 'pending_approval',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('LinkedIn onboarding insert error:', insertError)
    if (insertError.code === '23505') {
      return { error: 'This LinkedIn account is already connected to an account.' }
    }
    return { error: 'Database error: ' + insertError.message }
  }

  // Set as active LinkedIn account
  await supabase
    .from('users')
    .update({ active_linkedin_account_id: newAccount.id })
    .eq('id', user.id)

  revalidatePath('/', 'layout')
  revalidatePath('/worker/home')
  revalidatePath('/worker/linkedin-tasks')
  revalidatePath('/worker/profile')
  revalidatePath('/admin/linkedin-users')
  
  return { success: true }
}

// SET ACTIVE LINKEDIN ACCOUNT
export async function setActiveLinkedInAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ active_linkedin_account_id: accountId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

// REMOVE LINKEDIN ACCOUNT
export async function removeLinkedInAccount(accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile = await getCurrentUserProfileSlim()
  
  const { error } = await supabase
    .from('linkedin_accounts')
    .delete()
    .match({ id: accountId, user_id: user.id })
    
  if (error) return { error: error.message }

  if (profile?.active_linkedin_account_id === accountId) {
    await supabase.from('users').update({ active_linkedin_account_id: null }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ADMIN: GET ALL LINKEDIN ACCOUNTS
export async function getAllLinkedInAccounts() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('linkedin_accounts')
    .select('*, users:user_id(email, full_name, created_at)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { linkedinAccounts: data }
}

// ADMIN: VERIFY LINKEDIN ACCOUNT
export async function verifyLinkedInAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('linkedin_accounts')
    .update({ status: 'verified', rejection_reason: null, ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/linkedin-users')
  return { success: true }
}

// ADMIN: REJECT LINKEDIN ACCOUNT
export async function rejectLinkedInAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('linkedin_accounts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/linkedin-users')
  return { success: true }
}

// ADMIN: BAN LINKEDIN ACCOUNT
export async function banLinkedInAccount(accountId: string, reason: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('linkedin_accounts')
    .update({ status: 'banned', ban_reason: reason })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/linkedin-users')
  return { success: true }
}

// ADMIN: UNBAN LINKEDIN ACCOUNT
export async function unbanLinkedInAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('linkedin_accounts')
    .update({ status: 'verified', ban_reason: null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/admin/linkedin-users')
  return { success: true }
}

// ADMIN: REMOVE LINKEDIN ACCOUNT
export async function adminRemoveLinkedInAccount(accountId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('linkedin_accounts')
    .delete()
    .eq('id', accountId)
    
  if (error) return { error: error.message }
  revalidatePath('/admin/linkedin-users')
  return { success: true }
}
