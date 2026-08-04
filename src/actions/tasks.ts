'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile, getCurrentUserProfileSlim } from './users'

// ADMIN: CREATE TASK
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const title = formData.get('title') as string
  const task_type = formData.get('task_type') as string
  const content_mode = formData.get('content_mode') as string
  let subreddit_id: string | null = formData.get('subreddit_id') as string
  if (subreddit_id === 'open_for_all') {
    subreddit_id = null;
  }
  const new_subreddit_name = formData.get('new_subreddit_name') as string | null
  const instructions = formData.get('instructions') as string
  const post_link = formData.get('post_link') as string | null
  const content_body = formData.get('content_body') as string | null
  const flair = formData.get('flair') as string | null
  const image_url = formData.get('image_url') as string | null
  const payment_amount = parseFloat(formData.get('payment_amount') as string)
  const max_claims = parseInt(formData.get('max_claims') as string) || 1
  let due_date = formData.get('due_date') as string
  if (!due_date) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    due_date = defaultDate.toISOString();
  }
  if (subreddit_id === 'new_custom' && new_subreddit_name) {
    // Check if it already exists to be safe
    const { data: existingSub } = await supabase
      .from('subreddits')
      .select('id')
      .ilike('name', new_subreddit_name)
      .maybeSingle()
      
    if (existingSub) {
      subreddit_id = existingSub.id
    } else {
      const { data: newSub, error: insertErr } = await supabase
        .from('subreddits')
        .insert([{ name: new_subreddit_name }])
        .select()
        .single()
        
      if (insertErr) return { error: 'Failed to create new subreddit tag: ' + insertErr.message }
      subreddit_id = newSub.id
    }
  }

  const { error } = await supabase
    .from('tasks')
    .insert([{
      title,
      task_type,
      content_mode,
      subreddit_id,
      post_link,
      instructions,
      content_body,
      flair,
      image_url,
      payment_amount,
      max_claims,
      due_date
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/admin/tasks')
  return { success: true }
}

// ADMIN: FETCH ALL TASKS
export async function getAllTasks() {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const { data, error } = await supabase
    .from('tasks')
    .select('*, subreddits(name)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { tasks: data }
}

// HELPER: LAZY RELEASE EXPIRED CLAIMS (> 30 MINUTES)
async function releaseExpiredClaims(supabase: any) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { data: expiredClaims } = await supabase
    .from('task_claims')
    .select('id, task_id')
    .eq('status', 'claimed')
    .lt('claimed_at', thirtyMinutesAgo);

  if (expiredClaims && expiredClaims.length > 0) {
    const expiredClaimIds = expiredClaims.map((c: any) => c.id);
    const expiredTaskIds = expiredClaims.map((c: any) => c.task_id);

    // Update claims to expired
    await supabase
      .from('task_claims')
      .update({ status: 'expired' })
      .in('id', expiredClaimIds);

    // Reset task statuses to available
    await supabase
      .from('tasks')
      .update({ status: 'available' })
      .in('id', expiredTaskIds);
  }
}

// WORKER: FETCH AVAILABLE TASKS (Filtered by Tags)
export async function getAvailableTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);

  // Get tag IDs for the ACTIVE account via RPC (bypasses RLS)
  const { data: tagRows } = await supabase.rpc('get_account_tags', { target_account_id: activeAccount.id });
  const tagIds = tagRows?.map((t: any) => t.subreddit_id).filter(Boolean) || [];

  // Fetch tasks for those tags that are available, OR tasks that are open to all (null)
  let query = supabase
    .from('tasks')
    .select('*, subreddits(name)')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (tagIds.length > 0) {
    query = query.or(`subreddit_id.in.(${tagIds.join(',')}),subreddit_id.is.null`);
  } else {
    query = query.is('subreddit_id', null);
  }

  const { data, error } = await query;

  if (error) return { error: error.message }
  return { tasks: data }
}

// WORKER: FETCH MY CLAIMED TASKS
export async function getMyTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);

  const { data, error } = await supabase
    .from('task_claims')
    .select('*, tasks(*, subreddits(name))')
    .eq('reddit_account_id', profile.active_reddit_account_id)
    .neq('status', 'expired')
    .order('claimed_at', { ascending: false })

  if (error) return { error: error.message }

  // Filter out claims that were approved more than a week ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const filteredClaims = data?.filter((claim: any) => {
    if (claim.status === 'approved' && claim.reviewed_at) {
      return new Date(claim.reviewed_at).getTime() >= oneWeekAgo.getTime();
    }
    return true;
  }) || [];

  return { claims: filteredClaims }
}


// WORKER: CLAIM TASK
export async function claimTask(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);

  // Check if ANYONE has already claimed this task (global block, excluding expired claims)
  const { count: existingClaimCount } = await supabase
    .from('task_claims')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .neq('status', 'expired');

  // Get the task's max claims
  const { data: task } = await supabase
    .from('tasks')
    .select('max_claims, status')
    .eq('id', taskId)
    .single();


  if (!task || task.status !== 'available') {
    return { error: 'This task is no longer available.' };
  }

  if (existingClaimCount !== null && existingClaimCount >= (task.max_claims || 1)) {
    return { error: 'This task has already been claimed by someone else.' };
  }

  // Check if they already claimed a task today with this active account
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data: claimsToday, error: checkError } = await supabase
    .from('task_claims')
    .select('id')
    .eq('reddit_account_id', activeAccount.id)
    .gte('claimed_at', todayStart.toISOString());
    
  if (checkError) return { error: 'Failed to verify task limits: ' + checkError.message };
  if (claimsToday && claimsToday.length >= 1) {
    return { error: 'Daily limit reached. You can only complete 1 task per Reddit account per day.' };
  }

  // Insert the claim
  const { error } = await supabase
    .from('task_claims')
    .insert([{
      task_id: taskId,
      user_id: profile.id,
      reddit_account_id: activeAccount.id,
      status: 'claimed'
    }])

  if (error) return { error: error.message }

  // Lock task immediately (locks the task from everyone else)
  await supabase
    .from('tasks')
    .update({ status: 'claimed' })
    .eq('id', taskId);

  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/my-tasks')
  return { success: true }
}


// WORKER: SUBMIT TASK WORK
export async function submitTaskWork(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (!profile) return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const reddit_url = formData.get('reddit_url') as string
  const screenshot_url = formData.get('screenshot_url') as string | null // We'll add file upload later

  if (!reddit_url) return { error: 'Reddit URL is required' }

  // Check if the claim has expired
  const { data: claim, error: fetchError } = await supabase
    .from('task_claims')
    .select('claimed_at, status, task_id')
    .eq('id', claimId)
    .single();

  if (fetchError || !claim) return { error: 'Claim details not found.' };
  if (claim.status === 'expired') return { error: 'This task claim has already expired.' };

  const claimedTime = new Date(claim.claimed_at).getTime();
  const currentTime = new Date().getTime();
  const timeElapsedMs = currentTime - claimedTime;
  const maxTimeMs = 30 * 60 * 1000; // 30 minutes in milliseconds

  if (timeElapsedMs > maxTimeMs) {
    // 1. Mark claim as expired
    await supabase
      .from('task_claims')
      .update({ status: 'expired' })
      .eq('id', claimId);

    // 2. Make the task available again
    await supabase
      .from('tasks')
      .update({ status: 'available' })
      .eq('id', claim.task_id);

    revalidatePath('/worker/available-tasks');
    revalidatePath('/worker/my-tasks');
    return { error: 'This task claim has expired. You must submit your work within 30 minutes of claiming.' };
  }

  const { error } = await supabase
    .from('task_claims')
    .update({
      status: 'submitted',
      reddit_url,
      screenshot_url,
      submitted_at: new Date().toISOString()
    })
    .eq('id', claimId)
    .eq('user_id', profile.id) // Ensure they own it

  if (error) return { error: error.message }

  revalidatePath('/worker/my-tasks')
  return { success: true }
}



// ADMIN: REVIEW SUBMISSION (Approve/Reject)
export async function reviewSubmission(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const action = formData.get('action') as 'approved' | 'rejected'
  const admin_notes = formData.get('admin_notes') as string | null

  // Fetch the task_id for this claim to update the task's availability status
  const { data: claim } = await supabase
    .from('task_claims')
    .select('task_id')
    .eq('id', claimId)
    .single();

  const { error } = await supabase
    .from('task_claims')
    .update({
      status: action,
      admin_notes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', claimId)

  if (error) return { error: error.message }

  // Perform task state transitioning based on admin decision
  if (claim) {
    if (action === 'approved') {
      // Mark task as fully completed (no one can claim it)
      await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', claim.task_id);
    } else if (action === 'rejected') {
      // Release the task back to the active pool so other workers can attempt it
      await supabase
        .from('tasks')
        .update({ status: 'available' })
        .eq('id', claim.task_id);
    }
  }

  revalidatePath('/admin/submissions')
  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/my-tasks')
  return { success: true }
}

// ADMIN: FETCH ALL SUBMISSIONS
export async function getAllSubmissions() {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const { data, error } = await supabase
    .from('task_claims')
    .select('*, tasks(*, subreddits(name)), users:user_id(email), reddit_accounts:reddit_account_id(reddit_profile_link)')
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (error) return { error: error.message }
  return { submissions: data }
}
