'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfileSlim } from './users';
import { getRedditUsername } from '@/utils/reddit';
import { PremiumTierKey, PremiumTaggedAccount, PremiumTaggedResponse } from '@/types/premium-tags';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all registered Reddit accounts with their user details, assigned
 * subreddit tags, historical post metrics, and current premium tag status.
 */
export async function getPremiumTaggedAccounts(): Promise<PremiumTaggedResponse> {
  try {
    const profile = await getCurrentUserProfileSlim();
    if (profile?.role !== 'admin') {
      return {
        accounts: [],
        tierCounts: { elite: 0, high: 0, moderate: 0, low: 0, none: 0 },
        totalAccounts: 0,
        allSubredditTags: [],
        error: 'Unauthorized'
      };
    }

    const supabase = await createClient();

    // 1. Fetch all subreddit niche tags
    const { data: subredditsData } = await supabase
      .from('subreddits')
      .select('id, name')
      .order('name', { ascending: true });

    const allSubredditTags = (subredditsData || []).map((s: any) => ({
      id: s.id,
      name: s.name
    }));

    // 2. Fetch assigned subreddit tags per reddit account
    const { data: accTagsData } = await supabase
      .from('reddit_account_subreddits')
      .select('reddit_account_id, subreddits(id, name)');

    const accountTagsMap = new Map<string, { id: string; name: string }[]>();
    (accTagsData || []).forEach((row: any) => {
      const accId = row.reddit_account_id;
      if (!accId) return;
      if (!accountTagsMap.has(accId)) {
        accountTagsMap.set(accId, []);
      }
      if (row.subreddits?.id && row.subreddits?.name) {
        accountTagsMap.get(accId)!.push({
          id: row.subreddits.id,
          name: row.subreddits.name
        });
      }
    });

    // 3. Fetch Reddit accounts (Defensive against missing premium_tag column before SQL migration)
    let accountsData: any[] = [];
    const { data: accountsWithTag, error: tagColError } = await supabase
      .from('reddit_accounts')
      .select(`
        id,
        user_id,
        reddit_profile_link,
        reddit_karma,
        status,
        premium_tag,
        custom_bonus_rate,
        created_at,
        users:user_id(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (tagColError && tagColError.message?.toLowerCase().includes('premium_tag')) {
      // Fallback: column doesn't exist yet in DB
      const { data: fallbackAccounts, error: fallbackError } = await supabase
        .from('reddit_accounts')
        .select(`
          id,
          user_id,
          reddit_profile_link,
          reddit_karma,
          status,
          created_at,
          users:user_id(
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }
      accountsData = fallbackAccounts || [];
    } else if (tagColError) {
      throw new Error(tagColError.message);
    } else {
      accountsData = accountsWithTag || [];
    }

    // 4. Fetch claim stats for each reddit account
    const { data: claimsData } = await supabase
      .from('task_claims')
      .select(`
        id,
        reddit_account_id,
        status,
        bonus_amount,
        claimed_at,
        submitted_at,
        tasks:task_id(
          payment_amount,
          platform
        )
      `)
      .not('reddit_account_id', 'is', null);

    // Group claims by reddit_account_id
    const statsMap = new Map<string, { total: number; approved: number; earned: number; lastActivity: string | null }>();
    (claimsData || []).forEach((c: any) => {
      const accId = c.reddit_account_id;
      if (!accId) return;

      const current = statsMap.get(accId) || { total: 0, approved: 0, earned: 0, lastActivity: null };
      current.total += 1;

      const payment = Number(c.tasks?.payment_amount) || 0;
      const bonus = Number(c.bonus_amount) || 0;

      if (c.status === 'approved') {
        current.approved += 1;
        current.earned += payment + bonus;
      }

      const dateStr = c.submitted_at || c.claimed_at;
      if (dateStr) {
        if (!current.lastActivity || new Date(dateStr) > new Date(current.lastActivity)) {
          current.lastActivity = dateStr;
        }
      }

      statsMap.set(accId, current);
    });

    // 5. Construct response items and calculate tier counts
    const tierCounts: Record<PremiumTierKey, number> = {
      elite: 0,
      high: 0,
      moderate: 0,
      low: 0,
      none: 0
    };

    const accounts: PremiumTaggedAccount[] = accountsData.map((ra: any) => {
      const u = ra.users || {};
      const username = ra.reddit_profile_link
        ? getRedditUsername(ra.reddit_profile_link)
        : 'u/' + (ra.id ? ra.id.slice(0, 6) : 'anon');

      const assigned = ra.id ? (accountTagsMap.get(ra.id) || []) : [];
      const stats = ra.id ? statsMap.get(ra.id) || { total: 0, approved: 0, earned: 0, lastActivity: null } : { total: 0, approved: 0, earned: 0, lastActivity: null };

      const rawTag = (ra.premium_tag || 'none').toLowerCase() as PremiumTierKey;
      const validTag: PremiumTierKey = ['elite', 'high', 'moderate', 'low'].includes(rawTag) ? rawTag : 'none';

      tierCounts[validTag] = (tierCounts[validTag] || 0) + 1;

      return {
        id: ra.id,
        user_id: ra.user_id || u.id || '',
        reddit_username: username,
        reddit_profile_link: ra.reddit_profile_link || null,
        reddit_karma: ra.reddit_karma ?? null,
        status: ra.status || null,
        premium_tag: validTag,
        custom_bonus_rate: typeof ra.custom_bonus_rate === 'number' ? ra.custom_bonus_rate : null,
        created_at: ra.created_at,
        user_name: u.full_name || 'N/A',
        user_email: u.email || 'N/A',
        assigned_tags: assigned,
        total_posts: stats.total,
        approved_posts: stats.approved,
        total_earned: Math.round(stats.earned * 100) / 100,
        last_activity: stats.lastActivity
      };
    });

    return {
      accounts,
      tierCounts,
      totalAccounts: accounts.length,
      allSubredditTags
    };
  } catch (err: any) {
    console.error('getPremiumTaggedAccounts error:', err);
    return {
      accounts: [],
      tierCounts: { elite: 0, high: 0, moderate: 0, low: 0, none: 0 },
      totalAccounts: 0,
      allSubredditTags: [],
      error: err?.message || 'Failed to load premium tagged accounts'
    };
  }
}

/**
 * Updates the premium tag for a specific Reddit account.
 */
export async function updateAccountPremiumTag(
  redditAccountId: string,
  premiumTag: PremiumTierKey,
  customBonusRate?: number | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    const profile = await getCurrentUserProfileSlim();
    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required.' };
    }

    const supabase = await createClient();

    const updatePayload: any = {
      premium_tag: premiumTag
    };

    if (customBonusRate !== undefined) {
      updatePayload.custom_bonus_rate = customBonusRate;
    }

    const { error } = await supabase
      .from('reddit_accounts')
      .update(updatePayload)
      .eq('id', redditAccountId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/premium-tagged');
    revalidatePath('/admin/subreddit-posts');
    revalidatePath('/admin/submissions');
    revalidatePath('/admin/withdrawals');

    return { success: true };
  } catch (err: any) {
    console.error('updateAccountPremiumTag error:', err);
    return { error: err?.message || 'Failed to update premium tag' };
  }
}

/**
 * Bulk updates premium tag for multiple Reddit accounts.
 */
export async function bulkUpdateAccountPremiumTags(
  accountIds: string[],
  premiumTag: PremiumTierKey
): Promise<{ success?: boolean; updatedCount?: number; error?: string }> {
  try {
    const profile = await getCurrentUserProfileSlim();
    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required.' };
    }

    if (!accountIds || accountIds.length === 0) {
      return { error: 'No accounts selected.' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('reddit_accounts')
      .update({ premium_tag: premiumTag })
      .in('id', accountIds);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/premium-tagged');
    revalidatePath('/admin/subreddit-posts');
    revalidatePath('/admin/submissions');
    revalidatePath('/admin/withdrawals');

    return { success: true, updatedCount: accountIds.length };
  } catch (err: any) {
    console.error('bulkUpdateAccountPremiumTags error:', err);
    return { error: err?.message || 'Failed to bulk update premium tags' };
  }
}

