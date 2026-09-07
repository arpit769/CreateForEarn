import FullLeaderboard from '@/components/dashboard/FullLeaderboard';

export const metadata = {
  title: 'Leaderboard - Admin Dashboard'
};

export default async function AdminLeaderboardPage(props: { searchParams: Promise<{ platform?: string }> }) {
  const searchParams = await props.searchParams;
  const platform = searchParams.platform === 'youtube' ? 'youtube' : 'reddit';

  return <FullLeaderboard initialPlatform={platform} />;
}
