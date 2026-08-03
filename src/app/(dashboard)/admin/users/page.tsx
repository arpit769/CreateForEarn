import { getAllUsers, getSubreddits, getCurrentUserProfile } from '@/actions/users';
import UsersTable from '@/components/dashboard/UsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Users | CreateForEarn',
};

export default async function AdminUsersPage() {
  const profile = await getCurrentUserProfile();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [usersRes, subredditsRes] = await Promise.all([
    getAllUsers(),
    getSubreddits()
  ]);

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading users: {usersRes.error}</div>;
  }

  return (
    <UsersTable 
      initialUsers={usersRes.users || []} 
      initialSubreddits={subredditsRes.subreddits || []} 
    />
  );
}
