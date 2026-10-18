import { getAvailableTasks } from '@/actions/tasks';
import WorkerFacebookTasks from '@/components/dashboard/WorkerFacebookTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import FacebookLockWrapper from '@/components/dashboard/FacebookLockWrapper';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Facebook Tasks | CreateForEarn',
};

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { 
    tasks, 
    error 
  } = await getAvailableTasks();
  
  return (
    <FacebookLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerFacebookTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform === 'facebook')} 
        />
      )}
    </FacebookLockWrapper>
  );
}
