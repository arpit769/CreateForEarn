import { getAvailableTasks } from '@/actions/tasks';
import WorkerQuoraTasks from '@/components/dashboard/WorkerQuoraTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import QuoraLockWrapper from '@/components/dashboard/QuoraLockWrapper';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Quora Tasks | CreateForEarn',
};

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { 
    tasks, 
    error 
  } = await getAvailableTasks();
  
  return (
    <QuoraLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerQuoraTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform === 'quora')} 
        />
      )}
    </QuoraLockWrapper>
  );
}
