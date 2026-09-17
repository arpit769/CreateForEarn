import { getAllQuoraAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import QuoraUsersTable from '@/components/dashboard/QuoraUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Quora Users | CreateForEarn',
};

export default async function AdminQuoraUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const usersRes = await getAllQuoraAccounts();

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Quora accounts: {usersRes.error}</div>;
  }

  return (
    <QuoraUsersTable 
      initialUsers={usersRes.quoraAccounts || []} 
    />
  );
}
