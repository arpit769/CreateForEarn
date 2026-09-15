import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import XTasksTable from '@/components/dashboard/XTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage X Tasks | CreateForEarn',
};

export default async function AdminXTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, statsRes] = await Promise.all([
    getAllTasks('x'),
    getAdminTaskStats('x')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading tasks: {tasksRes.error}</div>;
  }

  return (
    <XTasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'x')} 
      initialStats={statsRes?.stats}
    />
  );
}
