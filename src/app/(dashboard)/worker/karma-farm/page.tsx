import { getAvailableKarmaTasks, getMyKarmaTasks } from '@/actions/tasks';
import WorkerAvailableTasks from '@/components/dashboard/WorkerAvailableTasks';
import WorkerMyTasks from '@/components/dashboard/WorkerMyTasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import RedditLockWrapper from '@/components/dashboard/RedditLockWrapper';
import { redirect } from 'next/navigation';

export default async function Page() {
  const profile = await getCurrentUserProfileSlim();
  if (!profile) redirect('/login');

  const [availableRes, myRes] = await Promise.all([
    getAvailableKarmaTasks(),
    getMyKarmaTasks()
  ]);

  const { tasks, postNextAvailableAt, commentNextAvailableAt, error: availableError } = availableRes;
  const { claims, error: myError } = myRes;
  
  return (
    <RedditLockWrapper profile={profile}>
      {availableError || myError ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Failed to load karma tasks: {availableError || myError}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <WorkerAvailableTasks 
            initialTasks={tasks || []} 
            postNextAvailableAt={postNextAvailableAt || null} 
            commentNextAvailableAt={commentNextAvailableAt || null}
            crosspostNextAvailableAt={null}
            upvoteNextAvailableAt={null}
            isKarmaFarm={true}
          />
          <WorkerMyTasks 
            initialClaims={claims || []} 
            isKarmaFarm={true} 
          />
        </div>
      )}
    </RedditLockWrapper>
  );
}
