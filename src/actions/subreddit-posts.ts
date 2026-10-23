'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfileSlim, updateUserTags, createSubreddit } from './users';
import { extractSubredditName, getRedditUsername } from '@/utils/reddit';

export interface SubredditPostClaim {
  id: string;
  status: 'claimed' | 'submitted' | 'approved' | 'rejected' | 'expired';
  reddit_url: string | null;
  screenshot_url: string | null;
  claimed_at: string;
  submitted_at: string | null;
  bonus_amount: number;
  admin_notes?: string | null;
  reddit_account_id: string | null;
  user_id: string;
  task_id: string;
  task_title: string;
  task_type: string;
  task_platform: string;
  payment_amount: number;
  assigned_subreddit_id: string | null;
  assigned_subreddit_name: string | null;
  effective_subreddit: string; // The resolved subreddit name (e.g. "AskAiApply")
  reddit_username: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  reddit_account_status: string | null;
  user_name: string;
  user_email: string;
}

export interface SubredditAccountStat {
  reddit_account_id: string;
  reddit_username: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  reddit_account_status: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  total_posts: number;
  approved_posts: number;
  submitted_posts: number;
  rejected_posts: number;
  total_earned: number;
  last_post_date: string | null;
  assigned_tags: { id: string; name: string }[];
  claims: SubredditPostClaim[];
}

export interface SubredditAggregatedStat {
  subreddit_name: string;
  is_custom_tag: boolean;
  total_posts: number;
  approved_posts: number;
  submitted_posts: number;
  rejected_posts: number;
  unique_accounts_count: number;
  accounts: SubredditAccountStat[];
}

export interface RegisteredAccountItem {
  reddit_account_id: string;
  reddit_username: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  reddit_account_status: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  assigned_tags: { id: string; name: string }[];
}

export interface SubredditPostStatsResponse {
  aggregatedSubreddits: SubredditAggregatedStat[];
  allClaims: SubredditPostClaim[];
  allKnownSubreddits: { id: string; name: string }[];
  allAccounts: RegisteredAccountItem[];
  totalStats: {
    totalPosts: number;
    approvedPosts: number;
    submittedPosts: number;
    rejectedPosts: number;
    uniqueSubreddits: number;
    uniqueRedditAccounts: number;
    totalEarnings: number;
  };
  error?: string;
}

/**
 * Resolves the effective subreddit for a Reddit task claim:
 * 1. Assigned subreddit tag on task (if present)
 * 2. Subreddit extracted from submitted proof URL
 * 3. Subreddit extracted from task post_link
 * 4. Fallback to "Open / Unassigned"
 */
function resolveSubreddit(claim: any): { name: string; isTag: boolean } {
  const task = claim.tasks;
  const tag = task?.subreddits?.name;
  if (tag && typeof tag === 'string' && tag.trim()) {
    return { name: tag.trim().replace(/^r\//i, ''), isTag: true };
  }

  const fromUrl = extractSubredditName(claim.reddit_url);
  if (fromUrl) {
    return { name: fromUrl, isTag: false };
  }

  const fromPostLink = extractSubredditName(task?.post_link);
  if (fromPostLink) {
    return { name: fromPostLink, isTag: false };
  }

  return { name: 'Open / Unassigned', isTag: false };
}

export async function getSubredditPostStats(): Promise<SubredditPostStatsResponse> {
  const supabase = await createClient();

  // Verify Admin
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    return {
      aggregatedSubreddits: [],
      allClaims: [],
      allKnownSubreddits: [],
      allAccounts: [],
      totalStats: {
        totalPosts: 0,
        approvedPosts: 0,
        submittedPosts: 0,
        rejectedPosts: 0,
        uniqueSubreddits: 0,
        uniqueRedditAccounts: 0,
        totalEarnings: 0,
      },
      error: 'Unauthorized. Admin access required.',
    };
  }

  try {
    // 1. Fetch all registered subreddit tags
    const { data: subredditsData } = await supabase
      .from('subreddits')
      .select('id, name')
      .order('name', { ascending: true });

    const allKnownSubreddits = (subredditsData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));

    // 2. Fetch all Reddit task claims with associated task, user, and reddit account data
    const { data: claimsData, error: claimsError } = await supabase
      .from('task_claims')
      .select(`
        id,
        status,
        reddit_url,
        screenshot_url,
        claimed_at,
        submitted_at,
        bonus_amount,
        admin_notes,
        reddit_account_id,
        user_id,
        tasks!inner(
          id,
          title,
          platform,
          task_type,
          payment_amount,
          subreddit_id,
          post_link,
          subreddits:subreddit_id(id, name)
        ),
        reddit_accounts:reddit_account_id(
          id,
          reddit_profile_link,
          reddit_karma,
          status
        ),
        users:user_id(
          id,
          full_name,
          email
        )
      `)
      .or('platform.eq.reddit,platform.is.null', { foreignTable: 'tasks' })
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(5000);

    // 2b. Fetch all assigned account tags from reddit_account_subreddits
    const { data: accTagsData } = await supabase
      .from('reddit_account_subreddits')
      .select('reddit_account_id, subreddit_id, subreddits(id, name)');

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
          name: row.subreddits.name,
        });
      }
    });

    // 2c. Fetch all registered Reddit accounts and their users
    const { data: allAccountsData } = await supabase
      .from('reddit_accounts')
      .select(`
        id,
        reddit_profile_link,
        reddit_karma,
        status,
        user_id,
        users:user_id(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    const allAccounts: RegisteredAccountItem[] = (allAccountsData || []).map((ra: any) => {
      const u = ra.users || {};
      const username = ra.reddit_profile_link
        ? getRedditUsername(ra.reddit_profile_link)
        : 'u/' + (ra.id ? ra.id.slice(0, 6) : 'anon');
      const assigned = ra.id ? (accountTagsMap.get(ra.id) || []) : [];

      return {
        reddit_account_id: ra.id,
        reddit_username: username,
        reddit_profile_link: ra.reddit_profile_link || null,
        reddit_karma: ra.reddit_karma ?? null,
        reddit_account_status: ra.status || null,
        user_id: ra.user_id || u.id || '',
        user_name: u.full_name || 'N/A',
        user_email: u.email || 'N/A',
        assigned_tags: assigned,
      };
    });

    if (claimsError) {
      console.error('Error fetching subreddit post claims:', claimsError);
      return {
        aggregatedSubreddits: [],
        allClaims: [],
        allKnownSubreddits,
        allAccounts,
        totalStats: {
          totalPosts: 0,
          approvedPosts: 0,
          submittedPosts: 0,
          rejectedPosts: 0,
          uniqueSubreddits: 0,
          uniqueRedditAccounts: 0,
          totalEarnings: 0,
        },
        error: claimsError.message,
      };
    }

    // 3. Transform claims into typed items
    const parsedClaims: SubredditPostClaim[] = (claimsData || []).map((item: any) => {
      const task = item.tasks || {};
      const ra = item.reddit_accounts || {};
      const u = item.users || {};
      const resolved = resolveSubreddit(item);

      const username = ra.reddit_profile_link
        ? getRedditUsername(ra.reddit_profile_link)
        : 'Unknown u/' + (item.reddit_account_id ? item.reddit_account_id.slice(0, 6) : 'anon');

      const payment = Number(task.payment_amount) || 0;
      const bonus = Number(item.bonus_amount) || 0;

      return {
        id: item.id,
        status: item.status,
        reddit_url: item.reddit_url,
        screenshot_url: item.screenshot_url,
        claimed_at: item.claimed_at,
        submitted_at: item.submitted_at,
        bonus_amount: bonus,
        admin_notes: item.admin_notes,
        reddit_account_id: item.reddit_account_id,
        user_id: item.user_id,
        task_id: task.id,
        task_title: task.title || 'Untitled Task',
        task_type: task.task_type || 'post',
        task_platform: task.platform || 'reddit',
        payment_amount: payment,
        assigned_subreddit_id: task.subreddit_id,
        assigned_subreddit_name: task.subreddits?.name || null,
        effective_subreddit: resolved.name,
        reddit_username: username,
        reddit_profile_link: ra.reddit_profile_link || null,
        reddit_karma: ra.reddit_karma ?? null,
        reddit_account_status: ra.status || null,
        user_name: u.full_name || 'N/A',
        user_email: u.email || 'N/A',
      };
    });

    // 4. Aggregate by Subreddit -> Reddit Account
    const subredditMap = new Map<string, { isTag: boolean; accountMap: Map<string, SubredditAccountStat> }>();

    for (const claim of parsedClaims) {
      const subName = claim.effective_subreddit;
      if (!subredditMap.has(subName)) {
        const isKnownTag = allKnownSubreddits.some(
          (k) => k.name.toLowerCase() === subName.toLowerCase()
        );
        subredditMap.set(subName, {
          isTag: isKnownTag,
          accountMap: new Map(),
        });
      }

      const subEntry = subredditMap.get(subName)!;
      // Account key: use reddit_account_id if present, fallback to username
      const accKey = claim.reddit_account_id || claim.reddit_username || 'unknown';

      if (!subEntry.accountMap.has(accKey)) {
        const assigned = claim.reddit_account_id ? (accountTagsMap.get(claim.reddit_account_id) || []) : [];

        subEntry.accountMap.set(accKey, {
          reddit_account_id: claim.reddit_account_id || accKey,
          reddit_username: claim.reddit_username,
          reddit_profile_link: claim.reddit_profile_link,
          reddit_karma: claim.reddit_karma,
          reddit_account_status: claim.reddit_account_status,
          user_id: claim.user_id,
          user_name: claim.user_name,
          user_email: claim.user_email,
          total_posts: 0,
          approved_posts: 0,
          submitted_posts: 0,
          rejected_posts: 0,
          total_earned: 0,
          last_post_date: null,
          assigned_tags: assigned,
          claims: [],
        });
      }

      const accStat = subEntry.accountMap.get(accKey)!;
      accStat.total_posts += 1;
      if (claim.status === 'approved') {
        accStat.approved_posts += 1;
        accStat.total_earned += claim.payment_amount + claim.bonus_amount;
      } else if (claim.status === 'submitted') {
        accStat.submitted_posts += 1;
      } else if (claim.status === 'rejected') {
        accStat.rejected_posts += 1;
      }

      const postDate = claim.submitted_at || claim.claimed_at;
      if (postDate) {
        if (!accStat.last_post_date || new Date(postDate) > new Date(accStat.last_post_date)) {
          accStat.last_post_date = postDate;
        }
      }

      accStat.claims.push(claim);
    }

    // Convert map to array
    const aggregatedSubreddits: SubredditAggregatedStat[] = [];
    const uniqueAccountIds = new Set<string>();
    let totalApproved = 0;
    let totalSubmitted = 0;
    let totalRejected = 0;
    let totalEarnings = 0;

    for (const [subName, entry] of subredditMap.entries()) {
      const accountsList = Array.from(entry.accountMap.values());
      // Sort accounts by total posts descending
      accountsList.sort((a, b) => b.total_posts - a.total_posts);

      let subTotal = 0;
      let subApproved = 0;
      let subSubmitted = 0;
      let subRejected = 0;

      for (const acc of accountsList) {
        subTotal += acc.total_posts;
        subApproved += acc.approved_posts;
        subSubmitted += acc.submitted_posts;
        subRejected += acc.rejected_posts;
        uniqueAccountIds.add(acc.reddit_account_id);
      }

      aggregatedSubreddits.push({
        subreddit_name: subName,
        is_custom_tag: entry.isTag,
        total_posts: subTotal,
        approved_posts: subApproved,
        submitted_posts: subSubmitted,
        rejected_posts: subRejected,
        unique_accounts_count: accountsList.length,
        accounts: accountsList,
      });
    }

    // Sort subreddits by total posts descending
    aggregatedSubreddits.sort((a, b) => b.total_posts - a.total_posts);

    for (const c of parsedClaims) {
      if (c.status === 'approved') {
        totalApproved++;
        totalEarnings += c.payment_amount + c.bonus_amount;
      } else if (c.status === 'submitted') {
        totalSubmitted++;
      } else if (c.status === 'rejected') {
        totalRejected++;
      }
    }

    return {
      aggregatedSubreddits,
      allClaims: parsedClaims,
      allKnownSubreddits,
      allAccounts,
      totalStats: {
        totalPosts: parsedClaims.length,
        approvedPosts: totalApproved,
        submittedPosts: totalSubmitted,
        rejectedPosts: totalRejected,
        uniqueSubreddits: aggregatedSubreddits.length,
        uniqueRedditAccounts: uniqueAccountIds.size,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      },
    };
  } catch (err: any) {
    console.error('Failed to getSubredditPostStats:', err);
    return {
      aggregatedSubreddits: [],
      allClaims: [],
      allKnownSubreddits: [],
      allAccounts: [],
      totalStats: {
        totalPosts: 0,
        approvedPosts: 0,
        submittedPosts: 0,
        rejectedPosts: 0,
        uniqueSubreddits: 0,
        uniqueRedditAccounts: 0,
        totalEarnings: 0,
      },
      error: err?.message || 'Unexpected server error while fetching post stats.',
    };
  }
}

/**
 * Updates assigned subreddit tags for a specific Reddit account.
 */
export async function updateAccountTags(redditAccountId: string, subredditIds: string[]) {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  return updateUserTags(redditAccountId, subredditIds);
}

/**
 * Creates a new subreddit tag.
 */
export async function createSubredditTag(name: string) {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  return createSubreddit(name);
}

