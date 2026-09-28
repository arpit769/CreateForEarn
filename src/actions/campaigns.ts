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

  const { error } = await supabase
    .from('client_campaigns')
    .insert([{
      client_id: user.id,
      name: data.name,
      platform: data.platform,
      task_type: data.taskType,
      task_count: data.taskCount,
      unit_rate: data.unitRate,
      total_budget: data.totalBudget,
      target_url: data.targetUrl || null,
      instructions: data.instructions || null,
      status: 'pending_review'
    }])

  if (error) return { error: error.message }

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

  if (error) {
    // Fallback: try without the join if FK name doesn't match
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('client_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallbackError) return { campaigns: [], error: fallbackError.message }
    return { campaigns: fallbackData || [] }
  }

  return { campaigns: data || [] }
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
    'reshare': 'crosspost',
    'follow': 'follow',
  }
  const mappedTaskType = taskTypeMap[campaign.task_type] || campaign.task_type

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

  // 4. Create individual tasks (one per task_count)
  const taskInserts = []
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 7)

  for (let i = 0; i < campaign.task_count; i++) {
    taskInserts.push({
      title: `${campaign.name} (#${i + 1})`,
      task_type: mappedTaskType,
      task_category: 'standard',
      content_mode: 'original',
      platform: campaign.platform,
      post_link: campaign.target_url || null,
      instructions: campaign.instructions || `Complete this ${campaign.task_type} task for the campaign "${campaign.name}"`,
      payment_amount: paymentPerTask,
      max_claims: 1,
      due_date: defaultDueDate.toISOString(),
      status: 'available',
      task_seq_id: nextSeqId + i,
    })
  }

  // 5. Insert all tasks
  const { error: insertError } = await supabase
    .from('tasks')
    .insert(taskInserts)

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

  return { success: true, tasksCreated: campaign.task_count }
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
