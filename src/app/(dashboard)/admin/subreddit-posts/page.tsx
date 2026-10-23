import { Metadata } from 'next';
import { getSubredditPostStats } from '@/actions/subreddit-posts';
import SubredditPostStats from '@/components/dashboard/SubredditPostStats';

export const metadata: Metadata = {
  title: 'Subreddit Post Tracker - Admin Dashboard',
  description: 'Check which Reddit accounts have posted in specific subreddits and monitor their post volumes.',
};

export default async function SubredditPostsPage() {
  const data = await getSubredditPostStats();

  if (data.error && data.error.includes('Unauthorized')) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Unauthorized Access</h2>
        <p>You must be an admin to view Subreddit Post Tracker.</p>
      </div>
    );
  }

  return <SubredditPostStats initialData={data} />;
}
