import React from 'react';
import { getAllLinkedInAccounts } from '@/actions/users';
import LinkedInUsersTable from '@/components/dashboard/LinkedInUsersTable';
import { LinkedInIcon } from '@/utils/linkedin';

export const metadata = {
  title: 'LinkedIn Users Management | CreateForEarn',
};

export default async function AdminLinkedInUsersPage() {
  const res = await getAllLinkedInAccounts();
  const users = res.linkedinAccounts || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LinkedInIcon size={28} /> LinkedIn Workers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Review, verify, and manage worker LinkedIn accounts.
          </p>
        </div>
      </div>

      <LinkedInUsersTable initialUsers={users as any} />
    </div>
  );
}
