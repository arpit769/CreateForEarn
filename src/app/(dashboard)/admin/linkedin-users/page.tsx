import React from 'react';
import { getAllLinkedInAccounts, getCurrentUserProfileSlim } from '@/actions/users';
import LinkedInUsersTable from '@/components/dashboard/LinkedInUsersTable';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage LinkedIn Users | CreateForEarn',
};

export default async function AdminLinkedInUsersPage() {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const res = await getAllLinkedInAccounts();
  if (res.error) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading LinkedIn accounts: {res.error}</div>;
  }

  return (
    <LinkedInUsersTable initialUsers={res.linkedinAccounts || []} />
  );
}
