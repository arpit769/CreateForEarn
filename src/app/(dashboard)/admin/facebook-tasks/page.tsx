import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import FacebookTasksTable from '@/components/dashboard/FacebookTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Facebook Tasks | CreateForEarn',
};

export default async function AdminFacebookTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, statsRes] = await Promise.all([
    getAllTasks('facebook'),
    getAdminTaskStats('facebook')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Facebook tasks: {tasksRes.error}</div>;
  }

  return (
    <FacebookTasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'facebook')} 
      initialStats={statsRes?.stats}
    />
  );
}
