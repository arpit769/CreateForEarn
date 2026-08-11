import { getAllTasks } from '@/actions/tasks';
import { getSubreddits, getCurrentUserProfileSlim } from '@/actions/users';
import TasksTable from '@/components/dashboard/TasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Karma Farm Tasks | CreateForEarn',
};

export default async function AdminKarmaFarmTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, subredditsRes] = await Promise.all([
    getAllTasks(),
    getSubreddits()
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading tasks: {tasksRes.error}</div>;
  }

  return (
    <TasksTable 
      initialTasks={tasksRes.tasks || []} 
      subreddits={subredditsRes.subreddits || []} 
      taskCategory="karma_farm"
    />
  );
}
