import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import QuoraTasksTable from '@/components/dashboard/QuoraTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Quora Tasks | CreateForEarn',
};

export default async function AdminQuoraTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, statsRes] = await Promise.all([
    getAllTasks('quora'),
    getAdminTaskStats('quora')
  ]);

  if (tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Quora tasks: {tasksRes.error}</div>;
  }

  return (
    <QuoraTasksTable 
      initialTasks={(tasksRes.tasks || []).filter((t: any) => t.platform === 'quora')} 
      initialStats={statsRes?.stats}
    />
  );
}
