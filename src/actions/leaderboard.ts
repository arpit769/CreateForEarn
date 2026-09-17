'use server'

import { createClient } from '@/utils/supabase/server'

export type LeaderboardUser = {
  user_id: string;
  full_name: string;
  total_earnings: number;
  total_tasks: number;
  rank: number;
};

export type LeaderboardPlatform = 'all' | 'reddit' | 'youtube' | 'x' | 'quora';

export async function getLeaderboard(
  platform: LeaderboardPlatform = 'all', 
  days: 1 | 7 | 30 = 30, 
  limit: number = 50
): Promise<{ users: LeaderboardUser[], error?: string }> {
  const supabase = await createClient()

  // First try calling the RPC
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_platform: platform,
      p_days: days,
      p_limit: limit
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return { users: data as LeaderboardUser[] };
    }
  } catch (rpcErr) {
    console.warn('Leaderboard RPC call failed, falling back to direct query:', rpcErr);
  }

  // Fallback direct query in case RPC does not support 'all' or new platforms
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from('task_claims')
      .select('id, user_id, bonus_amount, reviewed_at, submitted_at, claimed_at, users(id, full_name), tasks!inner(id, platform, payment_amount)')
      .eq('status', 'approved');

    if (platform !== 'all') {
      query = query.eq('tasks.platform', platform);
    }

    const { data: claims, error: claimsError } = await query;

    if (claimsError || !claims) {
      return { users: [], error: claimsError?.message };
    }

    // Aggregate user totals
    const userMap = new Map<string, { full_name: string, total_earnings: number, total_tasks: number }>();

    for (const claim of claims) {
      const claimDate = new Date(claim.reviewed_at || claim.submitted_at || claim.claimed_at || 0);
      if (claimDate < cutoffDate) continue;

      const taskPlatform = (claim as any).tasks?.platform;
      if (platform !== 'all' && taskPlatform !== platform) continue;

      const userId = claim.user_id || (claim as any).users?.id;
      if (!userId) continue;

      const fullName = (claim as any).users?.full_name || 'Anonymous User';
      const basePay = Number((claim as any).tasks?.payment_amount) || 0;
      const bonusPay = Number(claim.bonus_amount) || 0;
      const totalEarned = basePay + bonusPay;

      const existing = userMap.get(userId) || { full_name: fullName, total_earnings: 0, total_tasks: 0 };
      existing.total_earnings += totalEarned;
      existing.total_tasks += 1;
      userMap.set(userId, existing);
    }

    const sorted: LeaderboardUser[] = Array.from(userMap.entries())
      .map(([user_id, data]) => ({
        user_id,
        full_name: data.full_name,
        total_earnings: Math.round(data.total_earnings * 100) / 100,
        total_tasks: data.total_tasks,
        rank: 0
      }))
      .sort((a, b) => {
        if (b.total_earnings !== a.total_earnings) {
          return b.total_earnings - a.total_earnings;
        }
        return b.total_tasks - a.total_tasks;
      })
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return { users: sorted };
  } catch (err: any) {
    console.error('Error in fallback leaderboard:', err);
    return { users: [], error: err?.message || 'Failed to fetch leaderboard data' };
  }
}

