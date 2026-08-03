'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile } from './users'

// ADMIN: CREATE TASK
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const task_type = formData.get('task_type') as string
  const content_mode = formData.get('content_mode') as string
  const subreddit_id = formData.get('subreddit_id') as string
  const instructions = formData.get('instructions') as string
  const content_body = formData.get('content_body') as string | null
  const payment_amount = parseFloat(formData.get('payment_amount') as string)
  const max_claims = parseInt(formData.get('max_claims') as string)
  const due_date = formData.get('due_date') as string

  const { error } = await supabase
    .from('tasks')
    .insert([{
      title,
      task_type,
      content_mode,
      subreddit_id,
      instructions,
      content_body,
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
  
  // Verify Admin
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('tasks')
    .select('*, subreddits(name)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { tasks: data }
}

// WORKER: FETCH AVAILABLE TASKS (Filtered by Tags)
export async function getAvailableTasks() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()
  if (!profile || profile.status !== 'verified') return { error: 'Unauthorized' }

  // 1. Get the worker's assigned subreddit tags
  const { data: userTags } = await supabase
    .from('user_subreddits')
    .select('subreddit_id')
    .eq('user_id', profile.id)

  const tagIds = userTags?.map(t => t.subreddit_id) || []

  if (tagIds.length === 0) return { tasks: [] }

  // 2. Fetch tasks for those tags that are available
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subreddits(name)')
    .in('subreddit_id', tagIds)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { tasks: data }
}

// WORKER: CLAIM TASK
export async function claimTask(taskId: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()
  if (!profile || profile.status !== 'verified') return { error: 'Unauthorized' }

  // Check if task is available and not over max claims (simplified logic)
  const { error } = await supabase
    .from('task_claims')
    .insert([{
      task_id: taskId,
      user_id: profile.id,
      status: 'claimed'
    }])

  if (error) return { error: error.message }

  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/my-tasks')
  return { success: true }
}

// WORKER: SUBMIT TASK WORK
export async function submitTaskWork(formData: FormData) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()
  if (!profile) return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const reddit_url = formData.get('reddit_url') as string
  const screenshot_url = formData.get('screenshot_url') as string | null // We'll add file upload later

  if (!reddit_url) return { error: 'Reddit URL is required' }

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
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const claimId = formData.get('claim_id') as string
  const action = formData.get('action') as 'approved' | 'rejected'
  const admin_notes = formData.get('admin_notes') as string | null

  const { error } = await supabase
    .from('task_claims')
    .update({
      status: action,
      admin_notes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', claimId)

  if (error) return { error: error.message }

  revalidatePath('/admin/submissions')
  return { success: true }
}
