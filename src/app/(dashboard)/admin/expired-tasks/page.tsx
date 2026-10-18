import { getExpiredTasksForLookup } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import ExpiredTasksLookup from '@/components/dashboard/ExpiredTasksLookup';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Expired Tasks Lookup | Admin | CreateForEarn',
  description: 'Review expired task claims and decide whether tasks should reflect to users again or stay hidden.',
};

export default async function AdminExpiredTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { tasks, counts, error } = await getExpiredTasksForLookup('all');

  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'red' }}>
        <p>Failed to load expired tasks: {error}</p>
      </div>
    );
  }

  return <ExpiredTasksLookup initialTasks={tasks || []} initialCounts={counts} />;
}
