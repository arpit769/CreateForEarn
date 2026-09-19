import React from 'react';
import { getAllTasks, getAdminTaskStats } from '@/actions/tasks';
import { getCurrentUserProfileSlim } from '@/actions/users';
import LinkedInTasksTable from '@/components/dashboard/LinkedInTasksTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage LinkedIn Tasks | CreateForEarn',
};

export default async function AdminLinkedInTasksPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [tasksRes, statsRes] = await Promise.all([
    getAllTasks('linkedin'),
    getAdminTaskStats('linkedin')
  ]);

  if ('error' in tasksRes && tasksRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading tasks: {tasksRes.error}</div>;
  }

  const tasks = 'tasks' in tasksRes ? tasksRes.tasks || [] : [];

  return (
    <LinkedInTasksTable 
      initialTasks={(tasks || []).filter((t: any) => t.platform === 'linkedin')} 
      initialStats={statsRes?.stats} 
    />
  );
}

