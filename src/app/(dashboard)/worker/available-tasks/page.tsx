import { getAvailableTasks } from '@/actions/tasks';
import WorkerAvailableTasks from '@/components/dashboard/WorkerAvailableTasks';

import { getCurrentUserProfileSlim } from '@/actions/users';
import RedditLockWrapper from '@/components/dashboard/RedditLockWrapper';
import { redirect } from 'next/navigation';

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const { tasks, postNextAvailableAt, commentNextAvailableAt, crosspostNextAvailableAt, upvoteNextAvailableAt, error } = await getAvailableTasks();
  
  return (
    <RedditLockWrapper profile={profile}>
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load tasks: {error}</p>
        </div>
      ) : (
        <WorkerAvailableTasks 
          initialTasks={(tasks || []).filter((t: any) => t.platform !== 'youtube')} 
          postNextAvailableAt={postNextAvailableAt || null} 
          commentNextAvailableAt={commentNextAvailableAt || null}
          crosspostNextAvailableAt={crosspostNextAvailableAt || null}
          upvoteNextAvailableAt={upvoteNextAvailableAt || null}
        />
      )}
    </RedditLockWrapper>
  );
}
