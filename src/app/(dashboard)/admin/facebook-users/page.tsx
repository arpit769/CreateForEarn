import { getAllFacebookAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import FacebookUsersTable from '@/components/dashboard/FacebookUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Facebook Users | CreateForEarn',
};

export default async function AdminFacebookUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const usersRes = await getAllFacebookAccounts();

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Facebook accounts: {usersRes.error}</div>;
  }

  return (
    <FacebookUsersTable 
      initialUsers={usersRes.facebookAccounts || []} 
    />
  );
}
