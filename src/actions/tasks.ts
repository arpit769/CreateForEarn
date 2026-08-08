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
      due_date,
      scheduled_for: scheduled_for || null,
      status: initialStatus
    }])

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
    .select('*, subreddits(name), task_claims(id, status)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  const formatted = (data || []).map((t: any) => {
    const activeCount = t.task_claims?.filter((c: any) => ['claimed', 'submitted', 'approved'].includes(c.status)).length || 0;
    const approvedCount = t.task_claims?.filter((c: any) => c.status === 'approved').length || 0;
    return {
      ...t,
      active_claims_count: activeCount,
      approved_claims_count: approvedCount
    };
  });

  return { tasks: formatted }
}

// HELPER: SYNC TASK STATUS (available, claimed, completed) BASED ON SLOTS & CLAIMS
async function syncTaskStatus(supabase: any, taskId: string) {
  const { data: task } = await supabase
    .from('tasks')
    .select('id, max_claims, status')
    .eq('id', taskId)
    .single();

  if (!task) return;

  // Fetch all claims for this task
  const { data: claims } = await supabase
    .from('task_claims')
    .select('id, status')
    .eq('task_id', taskId);

  const activeClaims = claims?.filter((c: any) => ['claimed', 'submitted', 'approved'].includes(c.status)) || [];
  const approvedClaims = claims?.filter((c: any) => c.status === 'approved') || [];

  const maxSlots = task.max_claims || 1;

  if (approvedClaims.length >= maxSlots) {
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
  } else if (activeClaims.length >= maxSlots) {
    await supabase.from('tasks').update({ status: 'claimed' }).eq('id', taskId);
  } else {
    await supabase.from('tasks').update({ status: 'available' }).eq('id', taskId);
  }
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
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { data: expiredClaims } = await supabase
    .from('task_claims')
    .select('id, task_id')
    .eq('status', 'claimed')
    .lt('claimed_at', thirtyMinutesAgo);

  if (expiredClaims && expiredClaims.length > 0) {
    const expiredClaimIds = expiredClaims.map((c: any) => c.id as string);
    const affectedTaskIds: string[] = Array.from(new Set(expiredClaims.map((c: any) => c.task_id as string)));

    // Update claims to expired
    await supabase
      .from('task_claims')
      .update({ status: 'expired' })
      .in('id', expiredClaimIds);

    // Sync task availability for each affected task
    for (const tid of affectedTaskIds) {
      if (tid) {
        await syncTaskStatus(supabase, tid);
      }
    }
  }
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

  // Get tag IDs for the ACTIVE account via RPC (bypasses RLS)
  const { data: tagRows } = await supabase.rpc('get_account_tags', { target_account_id: activeAccount.id });
  const tagIds = tagRows?.map((t: any) => t.subreddit_id).filter(Boolean) || [];

  // Fetch tasks for those tags that are available, OR tasks that are open to all (null)
  let query = supabase
    .from('tasks')
    .select('*, subreddits(name), task_claims(id, status, reddit_account_id)')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (tagIds.length > 0) {
    query = query.or(`subreddit_id.in.(${tagIds.join(',')}),subreddit_id.is.null`);
  } else {
    query = query.is('subreddit_id', null);
  }

  const { data, error } = await query;

  if (error) return { error: error.message }

  // Filter tasks:
  // 1. Exclude tasks that this reddit account already has an active/approved claim on
  // 2. Filter out tasks where active claims have filled max_claims
  const availableTasks = (data || []).map((task: any) => {
    const activeClaims = task.task_claims?.filter((c: any) => ['claimed', 'submitted', 'approved'].includes(c.status)) || [];
    const maxSlots = task.max_claims || 1;
    const slotsRemaining = Math.max(0, maxSlots - activeClaims.length);
    const hasAlreadyClaimed = task.task_claims?.some((c: any) => c.reddit_account_id === activeAccount.id && c.status !== 'expired');

    return {
      ...task,
      active_claims_count: activeClaims.length,
      slots_remaining: slotsRemaining,
      has_claimed: hasAlreadyClaimed
    };
  }).filter((task: any) => !task.has_claimed && task.slots_remaining > 0);

  // Calculate separate cooldowns for post tasks (15h, 1 approved) and comment tasks (1h, 2 approved)

  // --- POST COOLDOWN: 1 approved post task in last 15 hours ---
  const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000);
  const { data: lastApprovedPostClaim } = await supabase
    .from('task_claims')
    .select('claimed_at, tasks!inner(task_type)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'post')
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
    .select('claimed_at, tasks!inner(task_type)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'comment')
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
    .select('claimed_at, tasks!inner(task_type)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'crosspost')
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
    .select('claimed_at, tasks!inner(task_type)')
    .eq('reddit_account_id', activeAccount.id)
    .eq('status', 'approved')
    .eq('tasks.task_type', 'upvote')
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
  return { claims: data || [] }
}


// WORKER: CLAIM TASK (With Slot Limits & 30-min window)
export async function claimTask(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  
  if (!profile || !profile.active_reddit_account_id) return { error: 'Unauthorized or no active account' }
  
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id)
  if (!activeAccount || activeAccount.status !== 'verified') return { error: 'Account not verified' }

  // Lazy release any expired claims first
  await releaseExpiredClaims(supabase);

  // 1. Get task details
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, max_claims, status, task_type, post_link')
    .eq('id', taskId)
    .single();

  if (taskErr || !task || task.status !== 'available') {
    return { error: 'This task is no longer available.' };
  }

  // 2. Check if this account already claimed this task
  const { data: existingUserClaim } = await supabase
    .from('task_claims')
    .select('id, status')
    .eq('task_id', taskId)
    .eq('reddit_account_id', activeAccount.id)
    .neq('status', 'expired')
    .maybeSingle();

  if (existingUserClaim) {
    return { error: 'You have already claimed this task.' };
  }

  // 3. Count active claims for this task
  const { count: activeClaimCount } = await supabase
    .from('task_claims')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .in('status', ['claimed', 'submitted', 'approved']);

  const maxSlots = task.max_claims || 1;
  const currentActive = activeClaimCount || 0;

  if (currentActive >= maxSlots) {
    await supabase.from('tasks').update({ status: 'claimed' }).eq('id', taskId);
    return { error: 'All slots for this task have already been claimed.' };
  }

  // 4a. Block if user has an active claim in progress OR a submission under admin review
  const { data: blockingClaim } = await supabase
    .from('task_claims')
    .select('id, status')
    .eq('reddit_account_id', activeAccount.id)
    .in('status', ['claimed', 'submitted'])
    .maybeSingle();

  if (blockingClaim) {
    if (blockingClaim.status === 'claimed') {
      return { error: 'You already have a task in progress. Complete or wait for it to expire before claiming another.' };
    }
    return { error: 'Your previous submission is under admin review. You can claim a new task once it is approved or rejected.' };
  }

  // Same post check for upvote and comment task types
  if ((task.task_type === 'upvote' || task.task_type === 'comment') && task.post_link) {
    const { data: samePostClaim } = await supabase
      .from('task_claims')
      .select('id, tasks!inner(post_link, task_type)')
      .eq('reddit_account_id', activeAccount.id)
      .eq('tasks.post_link', task.post_link)
      .eq('tasks.task_type', task.task_type)
      .in('status', ['claimed', 'submitted', 'approved'])
      .limit(1)
      .maybeSingle();

    if (samePostClaim) {
      return { error: `You have already completed or claimed a ${task.task_type} task for this post.` };
    }
  }

  // 4b. Type-specific cooldown checks
  if (task.task_type === 'comment') {
    // COMMENT TASKS: max 2 approved comment tasks per rolling 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data: approvedComments, error: checkError } = await supabase
      .from('task_claims')
      .select('id, claimed_at, tasks!inner(task_type)')
      .eq('reddit_account_id', activeAccount.id)
      .eq('status', 'approved')
      .eq('tasks.task_type', 'comment')
      .gte('claimed_at', oneHourAgo.toISOString())
      .order('claimed_at', { ascending: false })
      .limit(2);

    if (checkError) return { error: 'Failed to verify task limits: ' + checkError.message };
    if (approvedComments && approvedComments.length >= 2) {
      const oldestTime = new Date(approvedComments[approvedComments.length - 1].claimed_at).getTime();
      const nextTime = oldestTime + 60 * 60 * 1000;
      const diffMs = nextTime - Date.now();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
      return { error: `Comment task limit reached (2 per hour). Next comment task available in: ${diffMins}m ${diffSecs}s.` };
    }
  } else if (task.task_type === 'post') {
    // POST TASKS: max 1 approved post task per rolling 15 hours
    const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000);

    const { data: approvedPost, error: checkError } = await supabase
      .from('task_claims')
      .select('id, claimed_at, tasks!inner(task_type)')
      .eq('reddit_account_id', activeAccount.id)
      .eq('status', 'approved')
      .eq('tasks.task_type', 'post')
      .gte('claimed_at', fifteenHoursAgo.toISOString())
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) return { error: 'Failed to verify task limits: ' + checkError.message };
    if (approvedPost) {
      const nextTime = new Date(approvedPost.claimed_at).getTime() + 15 * 60 * 60 * 1000;
      const diffMs = nextTime - Date.now();
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffMins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      return { error: `Post limit reached (1 per 15 hours). Next post task available in: ${diffHours}h ${diffMins}m.` };
    }
  } else if (task.task_type === 'crosspost') {
    // CROSSPOST TASKS: max 1 approved crosspost task per rolling 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: approvedCrosspost, error: checkError } = await supabase
      .from('task_claims')
      .select('id, claimed_at, tasks!inner(task_type)')
      .eq('reddit_account_id', activeAccount.id)
      .eq('status', 'approved')
      .eq('tasks.task_type', 'crosspost')
      .gte('claimed_at', twentyFourHoursAgo.toISOString())
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) return { error: 'Failed to verify task limits: ' + checkError.message };
    if (approvedCrosspost) {
      const nextTime = new Date(approvedCrosspost.claimed_at).getTime() + 24 * 60 * 60 * 1000;
      const diffMs = nextTime - Date.now();
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffMins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      return { error: `Daily crosspost limit reached (1 per day). Next crosspost task available in: ${diffHours}h ${diffMins}m.` };
    }
  } else if (task.task_type === 'upvote') {
    // UPVOTE TASKS: max 5 approved upvote tasks per rolling 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data: approvedUpvotes, error: checkError } = await supabase
      .from('task_claims')
      .select('id, claimed_at, tasks!inner(task_type)')
      .eq('reddit_account_id', activeAccount.id)
      .eq('status', 'approved')
      .eq('tasks.task_type', 'upvote')
      .gte('claimed_at', oneHourAgo.toISOString())
      .order('claimed_at', { ascending: false })
      .limit(5);

    if (checkError) return { error: 'Failed to verify task limits: ' + checkError.message };
    if (approvedUpvotes && approvedUpvotes.length >= 5) {
      const oldestTime = new Date(approvedUpvotes[approvedUpvotes.length - 1].claimed_at).getTime();
      const nextTime = oldestTime + 60 * 60 * 1000;
      const diffMs = nextTime - Date.now();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
      return { error: `Upvote task limit reached (max 5 per hour). Next upvote task available in: ${diffMins}m ${diffSecs}s.` };
    }
  }

  // 5. Insert the claim
  const { error: insertErr } = await supabase
    .from('task_claims')
    .insert([{
      task_id: taskId,
      user_id: profile.id,
      reddit_account_id: activeAccount.id,
      status: 'claimed',
      claimed_at: new Date().toISOString()
    }]);

  if (insertErr) return { error: insertErr.message };

  // 6. Sync task status (sets 'claimed' if all slots are now filled, or keeps 'available' if slots remain)
  await syncTaskStatus(supabase, taskId);

  revalidatePath('/worker/available-tasks');
  revalidatePath('/worker/my-tasks');
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
