import { getAvailableTasks } from '@/actions/tasks';
import WorkerInstagramTasks from '@/components/dashboard/WorkerInstagramTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import InstagramLockWrapper from '@/components/dashboard/InstagramLockWrapper';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Instagram Tasks | CreateForEarn',
};

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { 
    tasks, 
    error 
  } = await getAvailableTasks();
  
  return (
    <InstagramLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerInstagramTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform === 'instagram')} 
        />
      )}
    </InstagramLockWrapper>
  );
}
