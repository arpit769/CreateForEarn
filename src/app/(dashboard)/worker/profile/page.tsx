// Server Component — profile data fetched server-side.
// Only account-switching, removal, and delete modal are client islands (ProfileActions).
import { getCurrentUserProfile } from '@/actions/users';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { User as UserIcon, Calendar, Clock, Mail, Activity, Link as LinkIcon } from 'lucide-react';
import ProfileActions from './_components/ProfileActions';

export const metadata = {
  title: 'My Profile | CreateForEarn',
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'pending_approval': return { text: 'Pending Verification', color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
    case 'verified': return { text: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    case 'banned': return { text: 'Banned', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case 'rejected': return { text: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case 'pending_details': return { text: 'Onboarding', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    default: return { text: status || 'Pending', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
  }
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
  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id) || profile.reddit_accounts?.[0];
  const displayUsername = profile.email?.split('@')[0] || 'Worker';

  let earnings = 0, approvals = 0, submissions = 0, rejections = 0;
  if (activeAccount?.task_claims) {
    activeAccount.task_claims.forEach((c: any) => {
      if (c.status === 'submitted' || c.status === 'approved' || c.status === 'rejected') submissions++;
      if (c.status === 'approved') { approvals++; earnings += c.tasks?.payment_amount || 0; }
      if (c.status === 'rejected') rejections++;
    });
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>User Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage your Reddit accounts and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
        {/* Left: Static profile info */}
        <div>
          {activeAccount ? (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '32px', marginBottom: '32px' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-purple)', color: 'var(--btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700 }}>
                  {profile.email?.[0].toUpperCase() || <UserIcon size={32} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{displayUsername}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {profile.email}
                  </p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '24px', background: getStatusDisplay(activeAccount.status).bg, color: getStatusDisplay(activeAccount.status).color, fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusDisplay(activeAccount.status).color }} />
                  {getStatusDisplay(activeAccount.status).text}
                </span>
              </div>

              {/* Account info grid */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Active Account Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {[
                    { icon: <LinkIcon size={18} />, label: 'Reddit Link', value: activeAccount.reddit_profile_link || 'N/A' },
                    { icon: <Calendar size={18} />, label: 'Join Date', value: new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: <Clock size={18} />, label: 'Last Login', value: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A' },
                    { icon: <Activity size={18} />, label: 'Reddit Karma', value: activeAccount.reddit_karma || 'N/A' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{icon}</div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '4px', wordBreak: 'break-all' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Account Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  {[
                    { label: 'Total Earnings', value: `$${earnings.toFixed(2)}`, color: '#10b981' },
                    { label: 'Submissions', value: submissions, color: 'var(--text-primary)' },
                    { label: 'Approvals', value: approvals, color: '#10b981' },
                    { label: 'Rejections', value: rejections, color: '#ef4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</p>
                      <p style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
              <p style={{ color: 'var(--text-muted)' }}>You don&apos;t have any Reddit accounts yet.</p>
            </div>
          )}
        </div>

        {/* Right: Client island handles account switch / add / delete */}
        <ProfileActions profile={profile} />
      </div>
    </div>
  );
}
