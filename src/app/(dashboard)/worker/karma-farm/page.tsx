import { getAvailableKarmaTasks, getMyKarmaTasks } from '@/actions/tasks';
import WorkerAvailableTasks from '@/components/dashboard/WorkerAvailableTasks';
import WorkerMyTasks from '@/components/dashboard/WorkerMyTasks';

export default async function Page() {
  const [availableRes, myRes] = await Promise.all([
    getAvailableKarmaTasks(),
    getMyKarmaTasks()
  ]);

  const { tasks, postNextAvailableAt, commentNextAvailableAt, error: availableError } = availableRes;
  const { claims, error: myError } = myRes;
  
  if (availableError || myError) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load karma tasks: {availableError || myError}</p>
      </div>
    );
  }
  
  return (
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
  );
}
