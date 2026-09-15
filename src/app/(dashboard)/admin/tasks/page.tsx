import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getSubreddits, getCurrentUserProfileSlim } from '@/actions/users';
import TasksTable from '@/components/dashboard/TasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Tasks | CreateForEarn',
};

export default async function AdminTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, subredditsRes, statsRes] = await Promise.all([
    getAllTasks('reddit'),
    getSubreddits(),
    getAdminTaskStats('reddit')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading tasks: {tasksRes.error}</div>;
  }

  return (
    <TasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'reddit' || !t.platform)} 
      subreddits={subredditsRes.subreddits || []} 
      taskCategory="standard"
      initialStats={statsRes?.stats}
    />
  );
}
