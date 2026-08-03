import { getAvailableTasks } from '@/actions/tasks';
import WorkerAvailableTasks from '@/components/dashboard/WorkerAvailableTasks';

export default async function Page() {
  const { tasks, error } = await getAvailableTasks();
  
  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Failed to load tasks: {error}</p>
      </div>
    );
  }
  
  return <WorkerAvailableTasks initialTasks={tasks || []} />;
}
