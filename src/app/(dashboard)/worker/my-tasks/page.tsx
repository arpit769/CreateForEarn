import { getMyTasks } from '@/actions/tasks';
import WorkerMyTasks from '@/components/dashboard/WorkerMyTasks';

export default async function Page() {
  const { claims, error } = await getMyTasks();
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load tasks: {error}</p>
      </div>
    );
  }
  
  return <WorkerMyTasks initialClaims={claims || []} />;
}
