import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import InstagramTasksTable from '@/components/dashboard/InstagramTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Instagram Tasks | CreateForEarn',
};

export default async function AdminInstagramTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, statsRes] = await Promise.all([
    getAllTasks('instagram'),
    getAdminTaskStats('instagram')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Instagram tasks: {tasksRes.error}</div>;
  }

  return (
    <InstagramTasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'instagram')} 
      initialStats={statsRes?.stats}
    />
  );
}
