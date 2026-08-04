// Server Component — profile data fetched server-side.
import { getCurrentUserProfile } from '@/actions/users';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import WorkerProfileClient from './_components/WorkerProfileClient';

export const metadata = {
  title: 'My Profile | CreateForEarn',
};

export default async function ProfilePage() {
  // Fetch profile and auth user in parallel
  const supabase = await createClient();
  const [profile, authRes] = await Promise.all([
    getCurrentUserProfile(),
    supabase.auth.getUser(),
  ]);

  if (!profile) redirect('/signup');

  const authUser = authRes.data.user;

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>User Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage your Reddit accounts and preferences.</p>
      </div>

      <WorkerProfileClient profile={profile} authUser={authUser} />
    </div>
  );
}
