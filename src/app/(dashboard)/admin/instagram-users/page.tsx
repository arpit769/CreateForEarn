import { getAllInstagramAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import InstagramUsersTable from '@/components/dashboard/InstagramUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Instagram Users | CreateForEarn',
};

export default async function AdminInstagramUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const usersRes = await getAllInstagramAccounts();

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Instagram accounts: {usersRes.error}</div>;
  }

  return (
    <InstagramUsersTable 
      initialUsers={usersRes.instagramAccounts || []} 
    />
  );
}
