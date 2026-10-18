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

  if (usersRes.error && !usersRes.isNotSetup) {
    return <div style={{ padding: '32px', color: 'red' }}>Error loading Facebook accounts: {usersRes.error}</div>;
  }

  return (
    <>
      {usersRes.isNotSetup && (
        <div style={{
          margin: '20px 24px 0',
          padding: '16px 20px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '14px',
          color: 'var(--text-primary)',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: '2px' }}>Database Table Setup Required</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              The <code>facebook_accounts</code> table hasn't been created in Supabase yet. Please run <code>facebook_platform_setup.sql</code> in your <strong>Supabase Dashboard &rarr; SQL Editor</strong> to enable Facebook worker applications.
            </div>
          </div>
        </div>
      )}
      <FacebookUsersTable 
        initialUsers={usersRes.facebookAccounts || []} 
      />
    </>
  );
}
