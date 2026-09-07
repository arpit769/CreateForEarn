'use server'

import { createClient } from '@/utils/supabase/server'

export type LeaderboardUser = {
  user_id: string;
  full_name: string;
  total_earnings: number;
  total_tasks: number;
  rank: number;
};

export async function getLeaderboard(platform: 'reddit' | 'youtube', days: 1 | 7 | 30, limit: number = 5): Promise<{ users: LeaderboardUser[], error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_platform: platform,
    p_days: days,
    p_limit: limit
  });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return { users: [], error: error.message };
  }

  return { users: data as LeaderboardUser[] };
}
