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
  const task_category = (formData.get('task_category') as string) || 'standard'
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
  const scheduled_for = formData.get('scheduled_for') as string | null;
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

  // Determine initial status based on scheduling
  const isScheduledForLater = scheduled_for && new Date(scheduled_for) > new Date();
  const initialStatus = isScheduledForLater ? 'scheduled' : 'available';

  const insertPayload: any = {
    title,
    task_type,
    task_category,
    content_mode,
    subreddit_id,
    post_link,
    instructions,
    content_body,
    flair,
    image_url,
    payment_amount,
    max_claims,
    due_date,
    scheduled_for: scheduled_for || null,
    status: initialStatus
  };

  if (task_category === 'karma_farm') {
    insertPayload.task_seq_id = null;
  }

  const { error } = await supabase
    .from('tasks')
    .insert([insertPayload])

  if (error) return { error: error.message }
  
  revalidatePath('/admin/tasks')
  return { success: true }
}

// ADMIN: UPDATE TASK
export async function updateTask(taskId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const task_type = formData.get('task_type') as string
  const task_category = (formData.get('task_category') as string) || 'standard'
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
  const scheduled_for = formData.get('scheduled_for') as string | null;

  if (subreddit_id === 'new_custom' && new_subreddit_name) {
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

  const isScheduledForLater = scheduled_for && new Date(scheduled_for) > new Date();

  const updatePayload: any = {
    title,
    task_type,
    task_category,
    content_mode,
    subreddit_id,
    post_link,
    instructions,
    content_body,
    flair,
    image_url,
    payment_amount,
    max_claims,
    scheduled_for: scheduled_for || null,
  };

  // If task is being rescheduled for the future, set status to scheduled
  if (isScheduledForLater) {
    updatePayload.status = 'scheduled';
  }

  const { error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId);

  if (error) return { error: error.message }

  // Sync task status based on new max_claims
  await syncTaskStatus(supabase, taskId);

  revalidatePath('/admin/tasks')
  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/my-tasks')
  return { success: true }
}

// ADMIN: DELETE TASK
export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Delete associated task_claims first
  await supabase.from('task_claims').delete().eq('task_id', taskId);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) return { error: error.message }

  revalidatePath('/admin/tasks')
  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/my-tasks')
  return { success: true }
}

// ADMIN: GET CLAIMS FOR A SPECIFIC TASK
export async function getTaskClaimsByAdmin(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('task_claims')
    .select(`
      id,
      status,
      claimed_at,
      reddit_url,
      screenshot_url,
      users ( id, full_name, email ),
      reddit_accounts ( reddit_profile_link )
    `)
    .eq('task_id', taskId)
    .order('claimed_at', { ascending: false });

  if (error) return { error: error.message }
  return { claims: data || [] }
}

// ADMIN: FETCH ALL TASKS
export async function getAllTasks() {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Lazy release expired claims first
  await releaseExpiredClaims(supabase);
  // Auto-publish any scheduled tasks whose time has arrived
  await releaseScheduledTasks(supabase);

  const { data, error } = await supabase
    .from('tasks')
    .select('*, subreddits(name), task_claims(id, status, bonus_amount)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  const formatted = (data || []).map((t: any) => {
    const activeCount = t.task_claims?.filter((c: any) => ['claimed', 'submitted', 'approved'].includes(c.status)).length || 0;
    const approvedCount = t.task_claims?.filter((c: any) => c.status === 'approved').length || 0;
    const totalBonus = t.task_claims?.filter((c: any) => c.status === 'approved').reduce((sum: number, c: any) => sum + (Number(c.bonus_amount) || 0), 0) || 0;
    return {
      ...t,
      active_claims_count: activeCount,
      approved_claims_count: approvedCount,
      total_bonus_amount: totalBonus
    };
  });

  return { tasks: formatted }
}

// HELPER: SYNC TASK STATUS (available, claimed, completed) BASED ON SLOTS & CLAIMS
async function syncTaskStatus(supabase: any, taskId: string) {
  const { error } = await supabase.rpc('sync_task_status_secure', { p_task_id: taskId });
  if (error) console.error('Error syncing task status:', error.message);
}

// HELPER: AUTO-RELEASE SCHEDULED TASKS WHOSE TIME HAS ARRIVED
async function releaseScheduledTasks(supabase: any) {
  const now = new Date().toISOString();
  
  await supabase
    .from('tasks')
    .update({ status: 'available' })
    .eq('status', 'scheduled')
    .lte('scheduled_for', now);
}

// HELPER: LAZY RELEASE EXPIRED CLAIMS (> 30 MINUTES)
async function releaseExpiredClaims(supabase: any) {
  const { error } = await supabase.rpc('release_expired_claims_secure');
  if (error) console.error('Error releasing expired claims:', error.message);
}

// WORKER: FETCH AVAILABLE TASKS (Filtered by Tags & Remaining Slots)
export async function getAvailableTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);
  // Auto-publish any scheduled tasks whose time has arrived
  await releaseScheduledTasks(supabase);

  // Get available tasks bypassing RLS
  const { data, error } = await supabase.rpc('get_available_tasks_secure', {
    p_reddit_account_id: activeAccount.id
  });

  if (error) return { error: error.message }

  // Format to match the old schema for the frontend, and exclude karma farm tasks
  const availableTasks = (data || [])
    .filter((t: any) => t.task_category !== 'karma_farm')
    .map((t: any) => ({
      ...t,
      subreddits: t.subreddit_name ? { name: t.subreddit_name } : null
    }));

  // Calculate separate cooldowns for post tasks (15h, 1 approved) and comment tasks (1h, 2 approved)

  // --- POST COOLDOWN: 1 approved post task in last 15 hours ---
  const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000);
  const { data: lastApprovedPostClaim } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'post')
    .neq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', fifteenHoursAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let postNextAvailableAt: string | null = null;
  if (lastApprovedPostClaim) {
    const claimTime = new Date(lastApprovedPostClaim.claimed_at).getTime();
    postNextAvailableAt = new Date(claimTime + 15 * 60 * 60 * 1000).toISOString();
  }

  // --- COMMENT COOLDOWN: 2 approved comment tasks in last 1 hour ---
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { data: approvedCommentClaims } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'comment')
    .neq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', oneHourAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(2);

  let commentNextAvailableAt: string | null = null;
  if (approvedCommentClaims && approvedCommentClaims.length >= 2) {
    // The oldest of the 2 recent approved claims determines when the window reopens
    const oldestClaimTime = new Date(approvedCommentClaims[approvedCommentClaims.length - 1].claimed_at).getTime();
    commentNextAvailableAt = new Date(oldestClaimTime + 60 * 60 * 1000).toISOString();
  }

  // --- CROSSPOST COOLDOWN: 1 approved crosspost task in last 24 hours ---
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: lastApprovedCrosspostClaim } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'crosspost')
    .neq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', twentyFourHoursAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let crosspostNextAvailableAt: string | null = null;
  if (lastApprovedCrosspostClaim) {
    const claimTime = new Date(lastApprovedCrosspostClaim.claimed_at).getTime();
    crosspostNextAvailableAt = new Date(claimTime + 24 * 60 * 60 * 1000).toISOString();
  }

  // --- UPVOTE COOLDOWN: max 5 approved upvote tasks in last 1 hour ---
  const { data: approvedUpvoteClaims } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'upvote')
    .neq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', oneHourAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(5);

  let upvoteNextAvailableAt: string | null = null;
  if (approvedUpvoteClaims && approvedUpvoteClaims.length >= 5) {
    const oldestClaimTime = new Date(approvedUpvoteClaims[approvedUpvoteClaims.length - 1].claimed_at).getTime();
    upvoteNextAvailableAt = new Date(oldestClaimTime + 60 * 60 * 1000).toISOString();
  }

  return { tasks: availableTasks, postNextAvailableAt, commentNextAvailableAt, crosspostNextAvailableAt, upvoteNextAvailableAt }
}

// WORKER: FETCH MY CLAIMED TASKS
export async function getMyTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);

  // Fetch all claims for this active reddit account with task and subreddit details
  const { data, error } = await supabase
    .from('task_claims')
    .select(`
      *,
      tasks (
        *,
        subreddits (
          name
        )
      )
    `)
    .eq('reddit_account_id', activeAccount.id)
    .order('claimed_at', { ascending: false });

  if (error) return { error: error.message }
  const claims = (data || []).filter((c: any) => (c.tasks as any)?.task_category !== 'karma_farm');
  return { claims }
}


// WORKER: CLAIM TASK (With Slot Limits & 30-min window)
export async function claimTask(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Call the secure RPC function to handle claiming atomically and bypass RLS
  const { data, error } = await supabase.rpc('claim_task_secure', {
    p_task_id: taskId,
    p_user_id: profile.id,
    p_reddit_account_id: activeAccount.id
  });

  if (error) return { error: 'Failed to process claim: ' + error.message };
  
  // RPC returns table: [{ success: boolean, error_message: text }]
  const result = Array.isArray(data) ? data[0] : data;
  if (!result || !result.success) {
    return { error: result?.error_message || 'This task is no longer available.' };
  }

  revalidatePath('/worker/available-tasks');
  revalidatePath('/worker/my-tasks');
  revalidatePath('/worker/karma-farm');
  return { success: true };
}



// WORKER: SUBMIT TASK WORK (Enforcing 30-min window)
export async function submitTaskWork(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (!profile) return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const reddit_url = (formData.get('reddit_url') as string | null)?.trim() || ''
  const screenshot_url = (formData.get('screenshot_url') as string | null)?.trim() || null

  // Fetch claim details with task type
  const { data: claim, error: fetchError } = await supabase
    .from('task_claims')
    .select('claimed_at, status, task_id, tasks(task_type, post_link)')
    .eq('id', claimId)
    .single();

  if (fetchError || !claim) return { error: 'Claim details not found.' };
  if (claim.status === 'expired') return { error: 'This task claim has already expired.' };

  const isUpvote = (claim.tasks as any)?.task_type === 'upvote';

  if (isUpvote) {
    if (!screenshot_url && !reddit_url) {
      return { error: 'Please provide a screenshot proof of your upvote.' };
    }
  } else {
    if (!reddit_url) {
      return { error: 'Reddit URL is required.' };
    }
  }

  const finalRedditUrl = reddit_url || (claim.tasks as any)?.post_link || screenshot_url || 'https://reddit.com';

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

    // 2. Sync task status to free up the slot for others
    await syncTaskStatus(supabase, claim.task_id);

    revalidatePath('/worker/available-tasks');
    revalidatePath('/worker/my-tasks');
    revalidatePath('/worker/karma-farm');
    return { error: 'This task claim has expired. You must submit your work within 30 minutes of claiming.' };
  }

  const { error } = await supabase
    .from('task_claims')
    .update({
      status: 'submitted',
      reddit_url: finalRedditUrl,
      screenshot_url,
      submitted_at: new Date().toISOString()
    })
    .eq('id', claimId)
    .eq('user_id', profile.id);

  if (error) return { error: error.message };

  await syncTaskStatus(supabase, claim.task_id);

  revalidatePath('/worker/my-tasks');
  revalidatePath('/worker/karma-farm');
  return { success: true };
}



// ADMIN: REVIEW SUBMISSION (Approve/Reject)
export async function reviewSubmission(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const action = formData.get('action') as 'approved' | 'rejected'
  const admin_notes = formData.get('admin_notes') as string | null
  const bonus_amount_str = formData.get('bonus_amount') as string | null
  const bonus_amount = bonus_amount_str ? parseFloat(bonus_amount_str) : 0.00

  // Fetch the task_id and user_id for this claim
  const { data: claim } = await supabase
    .from('task_claims')
    .select('task_id, user_id')
    .eq('id', claimId)
    .single();

  const { error } = await supabase
    .from('task_claims')
    .update({
      status: action,
      admin_notes,
      bonus_amount: action === 'approved' ? bonus_amount : 0.00,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', claimId);

  if (error) return { error: error.message };

  // Perform task state transitioning based on admin decision
  if (claim) {
    await syncTaskStatus(supabase, claim.task_id);

    // REFERRAL TRACKING: If the task was approved, check if the user was referred
    if (action === 'approved' && claim.user_id) {
      try {
        // Check if this user has a referrer
        const { data: submittingUser } = await supabase
          .from('users')
          .select('referred_by')
          .eq('id', claim.user_id)
          .single();

        if (submittingUser?.referred_by) {
          // Find the referral tracking row
          const { data: referral } = await supabase
            .from('referrals')
            .select('id, successful_tasks_count, reward_paid')
            .eq('referrer_id', submittingUser.referred_by)
            .eq('referred_user_id', claim.user_id)
            .single();

          if (referral && !referral.reward_paid) {
            const newCount = (referral.successful_tasks_count || 0) + 1;

            if (newCount >= 5) {
              // Award $2 to the referrer and mark reward as paid
              await supabase
                .from('referrals')
                .update({
                  successful_tasks_count: newCount,
                  reward_paid: true,
                  reward_paid_at: new Date().toISOString(),
                })
                .eq('id', referral.id);

              // Add $2 to the referrer's referral balance
              const { data: referrer } = await supabase
                .from('users')
                .select('referral_balance')
                .eq('id', submittingUser.referred_by)
                .single();

              const currentBalance = Number(referrer?.referral_balance) || 0;
              await supabase
                .from('users')
                .update({ referral_balance: currentBalance + 2.0 })
                .eq('id', submittingUser.referred_by);
            } else {
              // Just increment the counter
              await supabase
                .from('referrals')
                .update({ successful_tasks_count: newCount })
                .eq('id', referral.id);
            }
          }
        }
      } catch (e) {
        // Referral tracking is non-critical; don't block the review
        console.error('Referral tracking error:', e);
      }
    }
  }

  revalidatePath('/admin/submissions');
  revalidatePath('/worker/available-tasks');
  revalidatePath('/worker/my-tasks');
  revalidatePath('/worker/karma-farm');
  return { success: true };
}

// ADMIN: FETCH ALL SUBMISSIONS
export async function getAllSubmissions() {
  const supabase = await createClient()
  
  // Verify Admin (slim — only needs role)
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }


  const { data, error } = await supabase
    .from('task_claims')
    .select('*, tasks(*, subreddits(name)), users:user_id(email, full_name), reddit_accounts:reddit_account_id(reddit_profile_link)')
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (error) return { error: error.message }
  return { submissions: data }
}

// WORKER: FETCH AVAILABLE KARMA TASKS
export async function getAvailableKarmaTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  await releaseExpiredClaims(supabase);
  await releaseScheduledTasks(supabase);

  const { data, error } = await supabase.rpc('get_available_tasks_secure', {
    p_reddit_account_id: activeAccount.id
  });

  if (error) return { error: error.message }

  const availableTasks = (data || [])
    .filter((t: any) => t.task_category === 'karma_farm')
    .map((t: any) => ({
      ...t,
      subreddits: t.subreddit_name ? { name: t.subreddit_name } : null
    }));

  const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000);
  const { data: lastApprovedPostClaim } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'post')
    .eq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', fifteenHoursAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let postNextAvailableAt: string | null = null;
  if (lastApprovedPostClaim) {
    const claimTime = new Date(lastApprovedPostClaim.claimed_at).getTime();
    postNextAvailableAt = new Date(claimTime + 15 * 60 * 60 * 1000).toISOString();
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { data: approvedCommentClaims } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type, task_category)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'comment')
    .eq('tasks.task_category', 'karma_farm')
    .gte('claimed_at', oneHourAgo.toISOString())
    .order('claimed_at', { ascending: false })
    .limit(2);

  let commentNextAvailableAt: string | null = null;
  if (approvedCommentClaims && approvedCommentClaims.length >= 2) {
    const oldestClaimTime = new Date(approvedCommentClaims[approvedCommentClaims.length - 1].claimed_at).getTime();
    commentNextAvailableAt = new Date(oldestClaimTime + 60 * 60 * 1000).toISOString();
  }

  return { tasks: availableTasks, postNextAvailableAt, commentNextAvailableAt, crosspostNextAvailableAt: null, upvoteNextAvailableAt: null }
}

// WORKER: FETCH MY CLAIMED KARMA TASKS
export async function getMyKarmaTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  await releaseExpiredClaims(supabase);

  const { data, error } = await supabase
    .from('task_claims')
    .select(`
      *,
      tasks (
        *,
        subreddits (
          name
        )
      )
    `)
    .eq('reddit_account_id', activeAccount.id)
    .order('claimed_at', { ascending: false });

  if (error) return { error: error.message }
  const claims = (data || []).filter((c: any) => (c.tasks as any)?.task_category === 'karma_farm');
  return { claims }
}
