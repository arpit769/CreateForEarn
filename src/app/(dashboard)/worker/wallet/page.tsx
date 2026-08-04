// Server Component — data is fetched server-side in parallel before HTML is sent.
// Only the interactive withdrawal form is a client island (WalletActions).
import { getCurrentUserProfile } from '@/actions/users';
import { getWalletBalances } from '@/actions/wallet';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  Wallet, Clock, CheckCircle, AlertCircle, ShieldCheck, UserCheck, TrendingUp
} from 'lucide-react';
import WalletActions from './_components/WalletActions';

export const metadata = {
  title: 'My Wallet | CreateForEarn',
};

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signup');

  // Fetch all data in parallel — profile, balances, withdrawals
  const [profile, balances, withdrawalsRes] = await Promise.all([
    getCurrentUserProfile(),
    getWalletBalances(),
    supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (!profile) redirect('/signup');

  const withdrawals = withdrawalsRes.data || [];

  // Calculate per-account earnings
  const redditAccountsList = profile?.reddit_accounts || [];
  const accountsEarnings = redditAccountsList.map((acc: any) => {
    let earned = 0, pending = 0, approvedCount = 0, submittedCount = 0;
    acc.task_claims?.forEach((claim: any) => {
      const val = Number(claim.tasks?.payment_amount) || 0;
      if (claim.status === 'approved') { earned += val; approvedCount++; }
      else if (claim.status === 'submitted') { pending += val; submittedCount++; }
    });
    const redditUsername = acc.reddit_profile_link
      ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop()
      : 'Reddit Account';
    return {
      id: acc.id, username: redditUsername, status: acc.status,
      earned, pending, approvedCount, submittedCount,
      isActive: profile.active_reddit_account_id === acc.id
    };
  });

  const activeAccountData = accountsEarnings.find((a: any) => a.isActive) || accountsEarnings[0];

  const bal = {
    available: balances?.availableBalance ?? 0,
    pending: balances?.pendingBalance ?? 0,
    paid: balances?.paidBalance ?? 0,
    rejected: balances?.rejectedBalance ?? 0,
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Responsive stylesheet block */}
      <style>{`
        .wallet-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 32px;
          align-items: start;
          margin-bottom: 40px;
        }
        @media (max-width: 768px) {
          .wallet-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>My Wallet</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Monitor aggregate earnings, view individual profile balances, and request payouts.</p>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Available Balance', value: bal.available, color: '#22c55e', icon: <Wallet size={18} />, bg: 'rgba(34, 197, 94, 0.1)', sub: 'Combined across all profiles' },
          { label: 'Pending Review', value: bal.pending, color: '#eab308', icon: <Clock size={18} />, bg: 'rgba(234, 179, 8, 0.1)', sub: 'Awaiting admin approval' },
          { label: 'Total Paid Out', value: bal.paid, color: '#3b82f6', icon: <CheckCircle size={18} />, bg: 'rgba(59, 130, 246, 0.1)', sub: 'Successfully transferred' },
          { label: 'Total Rejected', value: bal.rejected, color: '#ef4444', icon: <AlertCircle size={18} />, bg: 'rgba(239, 68, 68, 0.1)', sub: 'Disapproved submissions' },
        ].map(({ label, value, color, icon, bg, sub }) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color }}>${value.toFixed(2)}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="wallet-grid">
        {/* Left: Account Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Reddit Profile Earnings Breakdowns</h3>
            {accountsEarnings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No linked Reddit profiles detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {accountsEarnings.map((acc: any) => (
                  <div key={acc.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: `1px solid ${acc.isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ minWidth: '180px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>u/{acc.username}</span>
                        {acc.isActive && (
                          <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <UserCheck size={12} /> Active Profile
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span>Approved: <strong>{acc.approvedCount} claims</strong></span>
                        <span>Pending: <strong>{acc.submittedCount} claims</strong></span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earned</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>${acc.earned.toFixed(2)}</p>
                      {acc.pending > 0 && <p style={{ fontSize: '11px', color: '#eab308', marginTop: '2px' }}>+${acc.pending.toFixed(2)} pending</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeAccountData && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', borderLeft: '4px solid var(--accent-blue)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-blue)" /> Active Wallet Session
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                You are currently earning on <strong>u/{activeAccountData.username}</strong>. Submissions completed with this profile will credit its individual ledger.
              </p>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile Earning</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${activeAccountData.earned.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Clearance</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#eab308', marginTop: '4px' }}>${activeAccountData.pending.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive client island */}
        <WalletActions profile={profile} availableBalance={bal.available} />
      </div>

      {/* Withdrawal History */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No withdrawal requests found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  {['Date', 'Method', 'Amount', 'Status', 'Details / Tx Hash'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {w.method === 'upi' ? 'UPI' : w.method === 'crypto_polygon' ? 'Polygon USDT' : w.method === 'crypto_bep20' ? 'Cozy Wallet' : w.method}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>${Number(w.amount).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: w.status === 'paid' ? 'rgba(34,197,94,0.1)' : w.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: w.status === 'paid' ? '#22c55e' : w.status === 'rejected' ? '#ef4444' : '#eab308' }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '250px', wordBreak: 'break-all' }}>{w.transaction_hash || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
