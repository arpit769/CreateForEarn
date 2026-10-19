'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfileSlim } from './users'

// ============================================================================
// CLIENT: Submit a new campaign for admin review
// ============================================================================
export async function submitClientCampaign(data: {
  name: string;
  platform: string;
  taskType: string;
  taskCount: number;
  unitRate: number;
  totalBudget: number;
  targetUrl?: string;
  instructions?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify user is a client
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'client') return { error: 'Only brand clients can create campaigns' }

  // Fetch client user to retrieve assigned tag
  let clientTagId: string | null = null
  let clientTagName: string | null = null
  try {
    const { data: clientUser } = await supabase
      .from('users')
      .select('assigned_tag_id, assigned_tag_name, task_rates')
      .eq('id', user.id)
      .maybeSingle()

    if (clientUser) {
      clientTagId = clientUser.assigned_tag_id || clientUser.task_rates?.assigned_tag_id || null
      clientTagName = clientUser.assigned_tag_name || clientUser.task_rates?.assigned_tag_name || null
    }
  } catch (err) {
    console.warn('Could not fetch client tag:', err)
  }

  // Append client tag to instructions if available
  let finalInstructions = data.instructions || ''
  if (clientTagName && !finalInstructions.includes('[Client Tag:')) {
    finalInstructions = `${finalInstructions ? finalInstructions + '\n' : ''}[Client Tag: ${clientTagName}]`
  }

  // Try insert with subreddit_id and tag_name
  const campaignPayload: any = {
    client_id: user.id,
    name: data.name,
    platform: data.platform,
    task_type: data.taskType,
    task_count: data.taskCount,
    unit_rate: data.unitRate,
    total_budget: data.totalBudget,
    target_url: data.targetUrl || null,
    instructions: finalInstructions || null,
    status: 'pending_review',
    subreddit_id: clientTagId,
    tag_name: clientTagName
  }

  const { error } = await supabase
    .from('client_campaigns')
    .insert([campaignPayload])

  if (error) {
    // Fallback if subreddit_id or tag_name columns don't exist in client_campaigns yet
    if (error.message.includes('subreddit_id') || error.message.includes('tag_name')) {
      delete campaignPayload.subreddit_id
      delete campaignPayload.tag_name
      const { error: retryError } = await supabase
        .from('client_campaigns')
        .insert([campaignPayload])
      if (retryError) return { error: retryError.message }
    } else {
      return { error: error.message }
    }
  }

  revalidatePath('/client/home')
  revalidatePath('/client/campaigns')
  revalidatePath('/admin/campaign-moderation')
  return { success: true }
}

// ============================================================================
// CLIENT: Fetch own campaigns
// ============================================================================
export async function getClientCampaigns() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { campaigns: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('client_campaigns')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { campaigns: [], error: error.message }
  return { campaigns: data || [] }
}

// ============================================================================
// ADMIN: Fetch all pending campaigns (for moderation page)
// ============================================================================
export async function getAllCampaignsForAdmin(statusFilter?: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { campaigns: [], error: 'Unauthorized' }

  let query = supabase
    .from('client_campaigns')
    .select('*, users!client_campaigns_client_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  let campaignsList = data || []

  if (error) {
    // Fallback: try without the join if FK name doesn't match
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('client_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallbackError) return { campaigns: [], lastApprovedRates: {}, error: fallbackError.message }
    campaignsList = fallbackData || []
  }

  // Fetch the latest payment amounts per task_type and platform from the tasks table
  const lastApprovedRates: Record<string, number> = {}
  try {
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('task_type, platform, payment_amount, created_at')
      .not('payment_amount', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (recentTasks) {
      for (const t of recentTasks) {
        const plat = (t.platform || '').toLowerCase().trim()
        const type = (t.task_type || '').toLowerCase().trim()
        const amt = Number(t.payment_amount)
        if (!isNaN(amt) && amt > 0) {
          if (plat && type && lastApprovedRates[`${plat}_${type}`] === undefined) {
            lastApprovedRates[`${plat}_${type}`] = amt
          }
          if (type && lastApprovedRates[type] === undefined) {
            lastApprovedRates[type] = amt
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching recent task rates:', err)
  }

  return { campaigns: campaignsList, lastApprovedRates }
}

// ============================================================================
// ADMIN: Approve campaign and split into individual tasks
// ============================================================================
export async function approveCampaignAndCreateTasks(
  campaignId: string,
  paymentPerTask: number,
  adminNotes?: string
) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // 1. Fetch the campaign
  const { data: campaign, error: fetchError } = await supabase
    .from('client_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (fetchError || !campaign) return { error: 'Campaign not found' }
  if (campaign.status === 'approved') return { error: 'Campaign already approved' }

  // 2. Map client task_type to actual task_type values used in the tasks table
  const taskTypeMap: Record<string, string> = {
    'post': 'post',
    'comment': 'comment',
    'upvote': 'upvote',
    'like': 'like',
    'subscribe': 'subscribe',
    'comment_reply': 'comment_reply',
    'reshare': 'crosspost',
    'crosspost': 'crosspost',
    'repost': 'repost',
    'quote_post': 'quote_post',
    'bookmark': 'bookmark',
    'follow': 'follow',
    'answer': 'answer',
    'follow_topic': 'follow_topic',
    'share': 'share',
    'save': 'save',
    'reel_view': 'reel_view',
    'story_view': 'story_view',
    'connect': 'connect',
  }
  const mappedTaskType = taskTypeMap[campaign.task_type] || campaign.task_type

  // Determine content mode for post tasks if specified in instructions
  let postContentMode = 'original'
  const instLower = (campaign.instructions || '').toLowerCase()
  if (instLower.includes('[post type: text]')) postContentMode = 'text'
  else if (instLower.includes('[post type: image]')) postContentMode = 'image'
  else if (instLower.includes('[post type: video]')) postContentMode = 'video'

  // 3. Get the next task_seq_id
  let nextSeqId = 3731
  try {
    const { data: maxTask } = await supabase
      .from('tasks')
      .select('task_seq_id')
      .not('task_seq_id', 'is', null)
      .order('task_seq_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    nextSeqId = (maxTask?.task_seq_id ? Number(maxTask.task_seq_id) : 3730) + 1
  } catch (err) {
    console.warn('Could not compute next task_seq_id:', err)
  }

  // 4. Create tasks (single task with max_claims = slots for like/follow/share/etc., or individual tasks for posts)
  const isSlotBased = [
    'like', 'follow', 'follow_topic', 'share', 'upvote', 'subscribe',
    'repost', 'quote_post', 'bookmark', 'save', 'reel_view', 'story_view', 'connect'
  ].includes(mappedTaskType);

  const taskInserts = []
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 7)

  // Extract media URL from instructions if present
  let extractedMedia: string | null = null;
  const mediaMatch = campaign.instructions?.match(/\[(?:Attached Media|Image URL|Media):\s*([^\]]+)\]/i);
  if (mediaMatch && mediaMatch[1]) {
    extractedMedia = mediaMatch[1].trim();
  }

  // Look up campaign tag / client assigned tag
  let taskSubredditId: string | null = campaign.subreddit_id || null
  if (!taskSubredditId && campaign.client_id) {
    try {
      const { data: clientUser } = await supabase
        .from('users')
        .select('assigned_tag_id, task_rates')
        .eq('id', campaign.client_id)
        .maybeSingle()
      taskSubredditId = clientUser?.assigned_tag_id || clientUser?.task_rates?.assigned_tag_id || null
    } catch {}
  }

  if (isSlotBased) {
    // Action tasks (like, follow, share, etc.) operate with multiple worker slots on one target post/profile
    taskInserts.push({
      title: campaign.name,
      task_type: mappedTaskType,
      task_category: 'standard',
      content_mode: 'provided',
      platform: campaign.platform,
      subreddit_id: taskSubredditId,
      post_link: campaign.target_url || null,
      instructions: campaign.instructions || `Complete this ${campaign.task_type} task for "${campaign.name}"`,
      image_url: extractedMedia || null,
      payment_amount: paymentPerTask,
      max_claims: campaign.task_count,
      due_date: defaultDueDate.toISOString(),
      status: 'available',
      task_seq_id: nextSeqId,
    });
  } else {
    // Independent post tasks (each worker publishes a distinct post)
    for (let i = 0; i < campaign.task_count; i++) {
      taskInserts.push({
        title: `${campaign.name} (#${i + 1})`,
        task_type: mappedTaskType,
        task_category: 'standard',
        content_mode: mappedTaskType === 'post' ? postContentMode : 'provided',
        platform: campaign.platform,
        subreddit_id: taskSubredditId,
        post_link: campaign.target_url || null,
        instructions: campaign.instructions || `Complete this ${campaign.task_type} task for the campaign "${campaign.name}"`,
        image_url: extractedMedia || null,
        payment_amount: paymentPerTask,
        max_claims: 1,
        due_date: defaultDueDate.toISOString(),
        status: 'available',
        task_seq_id: nextSeqId + i,
      })
    }
  }

  // 5. Insert all tasks
  let { error: insertError } = await supabase
    .from('tasks')
    .insert(taskInserts)

  if (insertError && taskSubredditId) {
    // If FK constraint fails on subreddit_id, retry without subreddit_id
    console.warn('Task insert failed with subreddit_id, retrying without it:', insertError.message)
    const fallbackInserts = taskInserts.map(t => {
      const copy: any = { ...t }
      delete copy.subreddit_id
      return copy
    })
    const retryRes = await supabase.from('tasks').insert(fallbackInserts)
    insertError = retryRes.error
  }

  if (insertError) return { error: `Failed to create tasks: ${insertError.message}` }

  // 6. Update campaign status
  const { error: updateError } = await supabase
    .from('client_campaigns')
    .update({
      status: 'approved',
      tasks_created: campaign.task_count,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', campaignId)

  if (updateError) return { error: `Tasks created but campaign update failed: ${updateError.message}` }

  // 7. Revalidate all relevant paths
  revalidatePath('/admin/campaign-moderation')
  revalidatePath('/admin/tasks')
  revalidatePath('/admin/youtube-tasks')
  revalidatePath('/admin/linkedin-tasks')
  revalidatePath('/admin/instagram-tasks')
  revalidatePath('/admin/x-tasks')
  revalidatePath('/admin/quora-tasks')
  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/youtube-tasks')
  revalidatePath('/worker/linkedin-tasks')
  revalidatePath('/worker/instagram-tasks')
  revalidatePath('/worker/x-tasks')
  revalidatePath('/worker/quora-tasks')
  revalidatePath('/client/home')
  revalidatePath('/client/campaigns')

  return { success: true, tasksCreated: campaign.task_count, approvedRate: paymentPerTask }
}

// ============================================================================
// ADMIN: Reject a campaign
// ============================================================================
export async function rejectCampaign(campaignId: string, reason?: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('client_campaigns')
    .update({
      status: 'rejected',
      admin_notes: reason || 'Campaign does not meet platform guidelines.',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', campaignId)

  if (error) return { error: error.message }

  revalidatePath('/admin/campaign-moderation')
  revalidatePath('/client/home')
  revalidatePath('/client/campaigns')
  return { success: true }
}
