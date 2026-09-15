import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getSubreddits, getCurrentUserProfileSlim } from '@/actions/users';
import YoutubeTasksTable from '@/components/dashboard/YoutubeTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage YouTube Tasks | CreateForEarn',
};

export default async function AdminYoutubeTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, subredditsRes, statsRes] = await Promise.all([
    getAllTasks('youtube'),
    getSubreddits(),
    getAdminTaskStats('youtube')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading tasks: {tasksRes.error}</div>;
  }

  return (
    <YoutubeTasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'youtube')} 
      taskCategory="standard"
      initialStats={statsRes?.stats}
    />
  );
}
