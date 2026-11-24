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
// CLIENT: Fetch own campaigns with submission & completion counts
// ============================================================================
export async function getClientCampaigns() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { campaigns: [], error: 'Not authenticated' }

  const { data: campaigns, error } = await supabase
    .from('client_campaigns')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { campaigns: [], error: error.message }
  if (!campaigns || campaigns.length === 0) return { campaigns: [] }

  try {
    const campIds = campaigns.map(c => c.id);
    const { data: tasksByCamp } = await supabase
      .from('tasks')
      .select('id, title, campaign_id, client_id, max_claims, task_claims(id, status)')
      .in('campaign_id', campIds);

    const { data: tasksByClient } = await supabase
      .from('tasks')
      .select('id, title, campaign_id, client_id, max_claims, task_claims(id, status)')
      .eq('client_id', user.id);

    const taskMap = new Map<string, any>();
    if (tasksByCamp) for (const t of tasksByCamp) taskMap.set(t.id, t);
    if (tasksByClient) for (const t of tasksByClient) taskMap.set(t.id, t);

    const tasks = Array.from(taskMap.values());

    const countsMap = new Map<string, { totalClaims: number; approvedClaims: number; submittedClaims: number }>();
    if (tasks) {
      for (const t of tasks) {
        let targetCampId = t.campaign_id;
        if (!targetCampId && t.title) {
          const matchCamp = campaigns.find(c => t.title.toLowerCase().startsWith(c.name.toLowerCase()));
          if (matchCamp) targetCampId = matchCamp.id;
        }
        if (!targetCampId && campaigns.length === 1) {
          targetCampId = campaigns[0].id;
        }
        if (!targetCampId) continue;
        const current = countsMap.get(targetCampId) || { totalClaims: 0, approvedClaims: 0, submittedClaims: 0 };
        const claims = t.task_claims || [];
        current.totalClaims += claims.length;
        current.approvedClaims += claims.filter((c: any) => c.status === 'approved').length;
        current.submittedClaims += claims.filter((c: any) => c.status === 'submitted').length;
        countsMap.set(targetCampId, current);
      }
    }

    const enriched = campaigns.map(c => ({
      ...c,
      completed_submissions_count: countsMap.get(c.id)?.approvedClaims || 0,
      pending_submissions_count: countsMap.get(c.id)?.submittedClaims || 0,
      total_submissions_count: countsMap.get(c.id)?.totalClaims || 0,
    }));

    return { campaigns: enriched }
  } catch {
    return { campaigns }
  }
}

// ============================================================================
// CLIENT: Fetch submissions (completed tasks & proof) for client campaigns
// ============================================================================
export async function getClientSubmissions(campaignId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { submissions: [], error: 'Not authenticated' }

  const profile = await getCurrentUserProfileSlim()
  if (!profile || (profile.role !== 'client' && profile.role !== 'admin')) {
    return { submissions: [], error: 'Unauthorized' }
  }

  try {
    // 1. Fetch campaigns for this client
    let campQuery = supabase
      .from('client_campaigns')
      .select('id, name, platform, task_type, unit_rate, status')
      .eq('client_id', user.id);

    if (campaignId) {
      campQuery = campQuery.eq('id', campaignId);
    }

    const { data: campaigns, error: campErr } = await campQuery;
    if (campErr) return { submissions: [], error: campErr.message };
    if (!campaigns || campaigns.length === 0) return { submissions: [] };

    const campMap = new Map(campaigns.map(c => [c.id, c]));
    const campIds = campaigns.map(c => c.id);

    // 2. Fetch tasks with embedded task_claims directly (the exact proven pattern from getClientCampaigns)
    let tasks: any[] = [];
    
    // Primary query with rich claim data & account joins
    const { data: richTasks, error: richErr } = await supabase
      .from('tasks')
      .select(`
        id, title, task_type, task_category, platform, custom_id, campaign_id, client_id, instructions, payment_amount,
        task_claims (
          id, task_id, user_id, status, proof_url, reddit_url, screenshot_url, bonus_amount, admin_notes, submitted_at, reviewed_at, created_at,
          reddit_account_id, youtube_account_id, x_account_id,
          reddit_accounts (reddit_profile_link),
          youtube_accounts (channel_name, channel_id),
          x_accounts (username, profile_url)
        )
      `)
      .in('campaign_id', campIds);

    if (!richErr && richTasks && richTasks.length > 0) {
      tasks = richTasks;
    } else {
      // Resilient fallback: basic task_claims(*) without nested account joins
      const { data: basicTasks } = await supabase
        .from('tasks')
        .select(`
          id, title, task_type, task_category, platform, custom_id, campaign_id, client_id, instructions, payment_amount,
          task_claims (*)
        `)
        .in('campaign_id', campIds);

      tasks = basicTasks || [];
    }

    // Also check if tasks were attached by client_id instead of campaign_id
    if (tasks.length === 0) {
      const { data: clientTasks } = await supabase
        .from('tasks')
        .select(`
          id, title, task_type, task_category, platform, custom_id, campaign_id, client_id, instructions, payment_amount,
          task_claims (*)
        `)
        .eq('client_id', user.id);

      if (clientTasks) {
        tasks = clientTasks;
      }
    }

    // Flatten all claims from all matching tasks
    const allClaims: any[] = [];
    for (const t of tasks) {
      const claims = t.task_claims || [];
      for (const c of claims) {
        allClaims.push({ ...c, parent_task: t });
      }
    }

    if (allClaims.length === 0) {
      return { submissions: [] };
    }

    // Fetch reddit accounts if not already populated from join
    const unpopulatedRedditIds = allClaims
      .filter(c => c.reddit_account_id && !c.reddit_accounts)
      .map(c => c.reddit_account_id);

    const redditMap = new Map<string, string>();
    if (unpopulatedRedditIds.length > 0) {
      try {
        const { data: rAccs } = await supabase
          .from('reddit_accounts')
          .select('id, reddit_profile_link')
          .in('id', unpopulatedRedditIds);

        if (rAccs) {
          for (const ra of rAccs) {
            redditMap.set(ra.id, ra.reddit_profile_link);
          }
        }
      } catch (raErr) {
        console.warn('Could not fetch reddit accounts directly:', raErr);
      }
    }

    // Format deliverables cleanly
    const formatted = allClaims.map((c: any) => {
      const task = c.parent_task;
      const campaign = task?.campaign_id ? campMap.get(task.campaign_id) : (campaigns[0] || null);
      const platform = (task?.platform || campaign?.platform || 'reddit').toLowerCase();

      let workerHandle = 'Creator';
      let profileUrl: string | null = null;

      const redditLink = c.reddit_accounts?.reddit_profile_link || (c.reddit_account_id ? redditMap.get(c.reddit_account_id) : null);
      if (platform === 'reddit' && redditLink) {
        const usernameMatch = redditLink.match(/(?:reddit\.com\/user\/|reddit\.com\/u\/)([^/?#]+)/i);
        workerHandle = usernameMatch ? `u/${usernameMatch[1]}` : redditLink;
        profileUrl = redditLink.startsWith('http') ? redditLink : `https://${redditLink}`;
      } else if (platform === 'youtube' && c.youtube_accounts?.channel_name) {
        workerHandle = c.youtube_accounts.channel_name;
        profileUrl = c.youtube_accounts.channel_id ? `https://youtube.com/channel/${c.youtube_accounts.channel_id}` : null;
      } else if ((platform === 'x' || platform === 'twitter') && c.x_accounts?.username) {
        workerHandle = `@${c.x_accounts.username.replace('@', '')}`;
        profileUrl = c.x_accounts.profile_url || `https://x.com/${c.x_accounts.username.replace('@', '')}`;
      }

      const clientCustomId = task?.custom_id || task?.instructions?.match(/\[Client Task ID:\s*([A-Za-z0-9_-]+)\]/i)?.[1] || 'C1';

      return {
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        status: c.status,
        proof_url: c.proof_url,
        reddit_url: c.reddit_url,
        live_proof_url: c.proof_url || c.reddit_url || null,
        screenshot_url: c.screenshot_url,
        bonus_amount: c.bonus_amount ? Number(c.bonus_amount) : 0,
        admin_notes: c.admin_notes,
        submitted_at: c.submitted_at,
        reviewed_at: c.reviewed_at,
        created_at: c.created_at,
        worker_handle: workerHandle,
        worker_profile_url: profileUrl,
        campaign: campaign ? {
          id: campaign.id,
          name: campaign.name,
          platform: campaign.platform,
          task_type: campaign.task_type,
          unit_rate: campaign.unit_rate,
          status: campaign.status,
        } : null,
        task: task ? {
          id: task.id,
          title: task.title,
          task_type: task.task_type,
          platform: task.platform,
          custom_id: clientCustomId,
          instructions: task.instructions,
          payment_amount: task.payment_amount ? Number(task.payment_amount) : 0,
        } : null,
      };
    });

    return { submissions: formatted };
  } catch (err: any) {
    console.error('Error in getClientSubmissions:', err);
    return { submissions: [], error: err?.message || 'Failed to fetch submissions' };
  }
}

// ============================================================================
// ADMIN: Fetch all pending campaigns (for moderation page)
// ============================================================================
export async function getNextClientTaskSeq(): Promise<number> {
  const supabase = await createClient()
  let nextClientSeq = 1
  try {
    const { data: existingClientTasks } = await supabase
      .from('tasks')
      .select('instructions')
      .ilike('instructions', '%[Client Task ID: C%')
      .order('created_at', { ascending: false })
      .limit(300)

    let maxNum = 0
    if (existingClientTasks) {
      for (const t of existingClientTasks) {
        const match = t.instructions?.match(/\[Client Task ID:\s*C(\d+)\]/i)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) maxNum = num
        }
      }
    }

    try {
      const { data: customIdTasks } = await supabase
        .from('tasks')
        .select('custom_id')
        .not('custom_id', 'is', null)
        .ilike('custom_id', 'C%')
        .limit(300)

      if (customIdTasks) {
        for (const t of customIdTasks) {
          const match = (t as any).custom_id?.match(/^C(\d+)$/i)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNum) maxNum = num
          }
        }
      }
    } catch {}

    nextClientSeq = maxNum + 1
  } catch (err) {
    console.warn('Error determining next client task seq:', err)
  }
  return nextClientSeq
}

export async function getAllCampaignsForAdmin(statusFilter?: string) {
  const supabase = await createClient()
  const profile = await getCurrentUserProfileSlim()
  if (profile?.role !== 'admin') return { campaigns: [], nextClientSeq: 1, error: 'Unauthorized' }

  let query = supabase
    .from('client_campaigns')
    .select('*, users!client_campaigns_client_id_fkey(full_name, email, assigned_tag_id, assigned_tag_name)')
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

    if (fallbackError) return { campaigns: [], lastApprovedRates: {}, nextClientSeq: 1, error: fallbackError.message }
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

  const nextClientSeq = await getNextClientTaskSeq()

  return { campaigns: campaignsList, lastApprovedRates, nextClientSeq }
}

// ============================================================================
// ADMIN: Approve campaign and split into individual tasks
// ============================================================================
export async function approveCampaignAndCreateTasks(
  campaignId: string,
  paymentPerTask: number,
  adminNotes?: string,
  overrideTagId?: string
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

  // Determine content mode for post tasks if specified in instructions (default to valid enum 'text')
  let postContentMode = 'text'
  const instLower = (campaign.instructions || '').toLowerCase()
  if (instLower.includes('[post type: text]')) postContentMode = 'text'
  else if (instLower.includes('[post type: image]') || instLower.includes('[attached media:') || instLower.includes('[image url:')) postContentMode = 'image'
  else if (instLower.includes('[post type: video]')) postContentMode = 'video'

  // 3. Get next client task sequence (C1, C2, C3, ...)
  const nextClientSeq = await getNextClientTaskSeq()

  // 4. Platform-specific task_seq_id (Reddit continues existing sequence, other platforms start at 1, 2, 3...)
  const campaignPlatform = (campaign.platform || 'reddit').toLowerCase().trim()
  let nextSeqId = campaignPlatform === 'reddit' ? 3731 : 1
  try {
    let query = supabase
      .from('tasks')
      .select('task_seq_id')
      .not('task_seq_id', 'is', null)

    if (campaignPlatform === 'reddit') {
      query = query.or('platform.eq.reddit,platform.is.null')
    } else if (campaignPlatform === 'x' || campaignPlatform === 'twitter') {
      query = query.in('platform', ['x', 'twitter'])
    } else {
      query = query.eq('platform', campaignPlatform)
    }

    const { data: maxTask } = await query
      .order('task_seq_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxTask?.task_seq_id) {
      nextSeqId = Number(maxTask.task_seq_id) + 1
    }
  } catch (err) {
    console.warn('Could not compute next task_seq_id:', err)
  }

  // 5. Look up campaign tag / client assigned tag ONLY for Reddit tasks
  const isReddit = (campaign.platform || '').toLowerCase().trim() === 'reddit'
  let taskSubredditId: string | null = null

  if (isReddit) {
    taskSubredditId = overrideTagId || campaign.subreddit_id || null
    if (!taskSubredditId && campaign.client_id) {
      try {
        const { data: clientUser } = await supabase
          .from('users')
          .select('assigned_tag_id, assigned_tag_name, task_rates')
          .eq('id', campaign.client_id)
          .maybeSingle()
        taskSubredditId = clientUser?.assigned_tag_id || clientUser?.task_rates?.assigned_tag_id || null
      } catch {}
    }
  } else {
    // For all other platforms (YouTube, X, Instagram, LinkedIn, Quora, Facebook),
    // tasks must be completely open to all workers and NOT restricted by subreddit tag!
    taskSubredditId = null
  }

  // 6. Create tasks (single task with max_claims = slots for like/follow/share/etc., or individual tasks for posts)
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

  // Clean instructions for workers: remove raw [Attached Media: ...] tag since image_url is already populated
  const cleanInstructions = campaign.instructions
    ? campaign.instructions.replace(/\[(?:Attached Media|Image URL|Media):\s*[^\]]+\]/gi, '').trim()
    : null;

  if (isSlotBased) {
    // Action tasks (like, follow, share, etc.) operate with multiple worker slots on one target post/profile
    const clientCustomId = `C${nextClientSeq}`
    const workerInstructions = cleanInstructions 
      ? `${cleanInstructions}\n[Client Task ID: ${clientCustomId}]`
      : `Complete this ${campaign.task_type} task for "${campaign.name}"\n[Client Task ID: ${clientCustomId}]`;

    taskInserts.push({
      title: campaign.name,
      task_type: mappedTaskType,
      task_category: 'standard',
      content_mode: 'provided',
      platform: campaign.platform,
      subreddit_id: taskSubredditId,
      post_link: campaign.target_url || null,
      instructions: workerInstructions,
      image_url: extractedMedia || null,
      payment_amount: paymentPerTask,
      max_claims: campaign.task_count,
      due_date: defaultDueDate.toISOString(),
      status: 'available',
      task_seq_id: nextSeqId,
      custom_id: clientCustomId,
      client_id: campaign.client_id,
      campaign_id: campaign.id,
    });
  } else {
    // Independent post tasks (each worker publishes a distinct post)
    for (let i = 0; i < campaign.task_count; i++) {
      const clientCustomId = `C${nextClientSeq + i}`
      const workerInstructions = cleanInstructions 
        ? `${cleanInstructions}\n[Client Task ID: ${clientCustomId}]`
        : `Complete this ${campaign.task_type} task for the campaign "${campaign.name}"\n[Client Task ID: ${clientCustomId}]`;

      taskInserts.push({
        title: `${campaign.name} (#${i + 1})`,
        task_type: mappedTaskType,
        task_category: 'standard',
        content_mode: mappedTaskType === 'post' ? postContentMode : 'provided',
        platform: campaign.platform,
        subreddit_id: taskSubredditId,
        post_link: campaign.target_url || null,
        instructions: workerInstructions,
        image_url: extractedMedia || null,
        payment_amount: paymentPerTask,
        max_claims: 1,
        due_date: defaultDueDate.toISOString(),
        status: 'available',
        task_seq_id: nextSeqId + i,
        custom_id: clientCustomId,
        client_id: campaign.client_id,
        campaign_id: campaign.id,
      })
    }
  }

  // 7. Insert all tasks
  let { error: insertError } = await supabase
    .from('tasks')
    .insert(taskInserts)

  // Resilient fallback if content_mode enum causes an issue
  if (insertError && insertError.message.includes('content_mode_enum')) {
    console.warn('Task insert failed with content_mode_enum, retrying with text/provided:', insertError.message)
    const fallbackInserts = taskInserts.map(t => {
      const copy: any = { ...t }
      copy.content_mode = 'text'
      return copy
    })
    const retryRes = await supabase.from('tasks').insert(fallbackInserts)
    insertError = retryRes.error
  }

  // Resilient fallback if custom_id, client_id, or campaign_id columns don't exist in DB yet
  if (insertError && (
    insertError.message.includes('custom_id') ||
    insertError.message.includes('client_id') ||
    insertError.message.includes('campaign_id')
  )) {
    console.warn('Insert with custom_id/client_id failed, falling back:', insertError.message)
    const fallbackInserts = taskInserts.map(t => {
      const copy: any = { ...t }
      delete copy.custom_id
      delete copy.client_id
      delete copy.campaign_id
      return copy
    })
    const retryRes = await supabase.from('tasks').insert(fallbackInserts)
    insertError = retryRes.error
  }

  if (insertError && taskSubredditId) {
    // If FK constraint fails on subreddit_id, retry without subreddit_id
    console.warn('Task insert failed with subreddit_id, retrying without it:', insertError.message)
    const fallbackInserts = taskInserts.map(t => {
      const copy: any = { ...t }
      delete copy.subreddit_id
      delete copy.custom_id
      delete copy.client_id
      delete copy.campaign_id
      return copy
    })
    const retryRes = await supabase.from('tasks').insert(fallbackInserts)
    insertError = retryRes.error
  }

  if (insertError) return { error: `Failed to create tasks: ${insertError.message}` }

  // 8. Update campaign status
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

  // 9. Revalidate all relevant paths
  revalidatePath('/admin/campaign-moderation')
  revalidatePath('/admin/tasks')
  revalidatePath('/admin/youtube-tasks')
  revalidatePath('/admin/linkedin-tasks')
  revalidatePath('/admin/instagram-tasks')
  revalidatePath('/admin/facebook-tasks')
  revalidatePath('/admin/x-tasks')
  revalidatePath('/admin/quora-tasks')
  revalidatePath('/worker/available-tasks')
  revalidatePath('/worker/youtube-tasks')
  revalidatePath('/worker/linkedin-tasks')
  revalidatePath('/worker/instagram-tasks')
  revalidatePath('/worker/facebook-tasks')
  revalidatePath('/worker/x-tasks')
  revalidatePath('/worker/quora-tasks')
  revalidatePath('/client/home')
  revalidatePath('/client/campaigns')

  const startCustomId = `C${nextClientSeq}`
  const endCustomId = `C${nextClientSeq + (isSlotBased ? 0 : campaign.task_count - 1)}`

  return { 
    success: true, 
    tasksCreated: campaign.task_count, 
    approvedRate: paymentPerTask,
    startCustomId,
    endCustomId
  }
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
