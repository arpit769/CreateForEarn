import { getAvailableTasks } from '@/actions/tasks';
import WorkerYoutubeTasks from '@/components/dashboard/WorkerYoutubeTasks';

import { getCurrentUserProfileSlim } from '@/actions/users';
import YoutubeLockWrapper from '@/components/dashboard/YoutubeLockWrapper';
import { redirect } from 'next/navigation';

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { tasks, postNextAvailableAt, commentNextAvailableAt, crosspostNextAvailableAt, upvoteNextAvailableAt, error } = await getAvailableTasks();
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load tasks: {error}</p>
      </div>
    );
  }
  
  return (
    <YoutubeLockWrapper profile={profile}>
      <WorkerYoutubeTasks 
        initialTasks={(tasks || []).filter((t: any) => t.platform === 'youtube')} 
      />
    </YoutubeLockWrapper>
  );
}
