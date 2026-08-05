import { getReferralData } from '@/actions/referral';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  Gift, Users, CheckCircle, DollarSign, Copy, TrendingUp
} from 'lucide-react';
import ReferralCodeCopy from './_components/ReferralCodeCopy';

export const metadata = {
  title: 'Referral Program | CreateForEarn',
};

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signup');

  const data = await getReferralData();
  if (!data) redirect('/signup');

  const { referralCode, referralBalance, totalReferred, successfulReferrals, pendingReferrals, referrals } = data;

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Gift size={28} color="#a855f7" />
          Referral Program
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Invite friends and earn <strong style={{ color: '#22c55e' }}>$2.00</strong> for each referral who completes 5 successful tasks.
        </p>
      </div>

      {/* Referral Code Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(124, 58, 237, 0.12) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background circles */}
        <div style={{
          position: 'absolute', right: '-30px', top: '-30px',
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.06)',
        }} />
        <div style={{
          position: 'absolute', right: '60px', bottom: '-20px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.05)',
        }} />

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '12px' }}>
          Your Unique Referral Code
        </p>
        <ReferralCodeCopy code={referralCode || 'N/A'} />
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: 1.5 }}>
          Share this code with friends. When they sign up and complete <strong>5 successful tasks</strong>, you earn <strong style={{ color: '#22c55e' }}>$2.00</strong> per referral.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Referred', value: totalReferred, icon: <Users size={18} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', sub: 'People who used your code' },
          { label: 'Successful Referrals', value: successfulReferrals, icon: <CheckCircle size={18} />, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', sub: 'Completed 5 tasks each' },
          { label: 'In Progress', value: pendingReferrals, icon: <TrendingUp size={18} />, color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', sub: 'Working towards 5 tasks' },
          { label: 'Total Earnings', value: `$${referralBalance.toFixed(2)}`, icon: <DollarSign size={18} />, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', sub: 'From successful referrals' },
        ].map(({ label, value, icon, color, bg, sub }) => (
          <div key={label} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>How It Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { step: '1', title: 'Share Your Code', desc: 'Give your unique referral code to a friend' },
            { step: '2', title: 'They Sign Up', desc: 'Your friend creates an account using your code' },
            { step: '3', title: 'They Complete Tasks', desc: 'Their approved tasks are tracked (need 5)' },
            { step: '4', title: 'You Earn $2', desc: 'Once they hit 5 approved tasks, you get paid' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                minWidth: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700,
                flexShrink: 0,
              }}>{step}</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Users Table */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Your Referrals</h3>
        {referrals.length === 0 ? (
          <div style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
          }}>
            <Gift size={40} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>No referrals yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Share your code to start earning!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  {['Referred User', 'Date Joined', 'Tasks Completed', 'Progress', 'Status', 'Reward'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r: any) => {
                  const email = r.referred_user?.email || 'Unknown';
                  // Mask email for privacy: show first 3 chars + ***@domain
                  const atIndex = email.indexOf('@');
                  const maskedEmail = atIndex > 3
                    ? email.substring(0, 3) + '***' + email.substring(atIndex)
                    : email;
                  const tasksCompleted = r.successful_tasks_count || 0;
                  const progressPercent = Math.min((tasksCompleted / 5) * 100, 100);
                  const isCompleted = r.reward_paid;

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{maskedEmail}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {r.referred_user?.created_at ? new Date(r.referred_user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {tasksCompleted} / 5
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          width: '80px', height: '6px', borderRadius: '3px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: isCompleted
                              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                              : 'linear-gradient(90deg, #a855f7, #7c3aed)',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: isCompleted ? '#22c55e' : '#eab308',
                        }}>
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: isCompleted ? '#22c55e' : 'var(--text-muted)' }}>
                        {isCompleted ? '$2.00' : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
