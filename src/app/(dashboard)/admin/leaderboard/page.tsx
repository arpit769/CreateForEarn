import FullLeaderboard from '@/components/dashboard/FullLeaderboard';

export const metadata = {
  title: 'Leaderboard - Admin Dashboard'
};

export default async function AdminLeaderboardPage(props: { searchParams: Promise<{ platform?: string }> }) {
  const searchParams = await props.searchParams;
  const valid = ['all', 'reddit', 'youtube', 'x', 'quora'];
  const platform = valid.includes(searchParams.platform || '') ? (searchParams.platform as any) : 'all';

  return <FullLeaderboard initialPlatform={platform} />;
}
