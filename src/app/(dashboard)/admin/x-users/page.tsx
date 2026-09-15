import { getAllXAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import XUsersTable from '@/components/dashboard/XUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage X Users | CreateForEarn',
};

export default async function AdminXUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const usersRes = await getAllXAccounts();

  if (usersRes.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading accounts: {usersRes.error}</div>;
  }

  return (
    <XUsersTable 
      initialUsers={usersRes.xAccounts || []} 
    />
  );
}
