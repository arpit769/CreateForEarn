import { getAllYoutubeAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import YoutubeUsersTable from '@/components/dashboard/YoutubeUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Users | CreateForEarn',
};

export default async function AdminUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const usersRes = await getAllYoutubeAccounts();

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading accounts: {usersRes.error}</div>;
  }

  return (
    <YoutubeUsersTable 
      initialUsers={usersRes.youtubeAccounts || []} 
    />
  );
}
