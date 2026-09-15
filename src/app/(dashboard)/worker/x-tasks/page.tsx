import { getAvailableTasks } from '@/actions/tasks';
import WorkerXTasks from '@/components/dashboard/WorkerXTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import XLockWrapper from '@/components/dashboard/XLockWrapper';
import { redirect } from 'next/navigation';

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { 
    tasks, 
    xPostNextAvailableAt, 
    xOtherNextAvailableAt, 
    error 
  } = await getAvailableTasks();
  
  return (
    <XLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerXTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform === 'x')} 
          postNextAvailableAt={xPostNextAvailableAt}
          otherNextAvailableAt={xOtherNextAvailableAt}
        />
      )}
    </XLockWrapper>
  );
}
