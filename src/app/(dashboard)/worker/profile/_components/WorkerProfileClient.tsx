'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Mail, Calendar, Clock, Activity, Link as LinkIcon, 
  Trash2, CheckCircle, PlusCircle, AlertTriangle, X, Eye, ShieldAlert 
} from 'lucide-react';
import { deleteUserAccount, setActiveRedditAccount, removeRedditAccount } from '@/actions/users';
import OnboardingScreen from '@/components/dashboard/OnboardingScreen';

interface WorkerProfileClientProps {
  profile: any;
  authUser: any;
}

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

export default function WorkerProfileClient({ profile: initialProfile, authUser }: WorkerProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Modal display states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id) || profile.reddit_accounts?.[0];
  const displayUsername = profile.email?.split('@')[0] || 'Worker';

  // Stats calculation
  let earnings = 0, approvals = 0, submissions = 0, rejections = 0;
  if (activeAccount?.task_claims) {
    activeAccount.task_claims.forEach((c: any) => {
      if (c.status === 'submitted' || c.status === 'approved' || c.status === 'rejected') submissions++;
      if (c.status === 'approved') { approvals++; earnings += c.tasks?.payment_amount || 0; }
      if (c.status === 'rejected') rejections++;
    });
  }

  const handleSwitchAccount = async (id: string) => {
    if (profile.active_reddit_account_id === id || isSwitching) return;
    setIsSwitching(true);
    const res = await setActiveRedditAccount(id);
    if (!res.error) {
      setProfile({ ...profile, active_reddit_account_id: id });
    } else {
      alert('Error switching account: ' + res.error);
    }
    setIsSwitching(false);
  };

  const handleRemoveAccount = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this Reddit account?')) return;
    setIsSwitching(true);
    const res = await removeRedditAccount(id);
    if (!res.error) {
      setProfile({ ...profile, reddit_accounts: profile.reddit_accounts?.filter((a: any) => a.id !== id) });
    } else {
      alert('Error removing account: ' + res.error);
    }
    setIsSwitching(false);
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(profile.id);
    if (res.error) alert('Failed to delete account: ' + res.error);
    setIsDeleting(false);
  };

  return (
    <div style={{ maxWidth: '900px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
        
        {/* CARD 1: USER PROFILE SUMMARY */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-subtle)',
          padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: '260px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '50%', background: 'var(--gradient-purple)', 
                color: 'var(--btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '22px', fontWeight: 700, flexShrink: 0
              }}>
                {profile.email?.[0].toUpperCase() || <UserIcon size={22} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{displayUsername}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', wordBreak: 'break-all' }}>
                  <Mail size={12} style={{ flexShrink: 0 }} /> {profile.email}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Account</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {activeAccount ? `u/${activeAccount.reddit_profile_link?.replace(/\/$/, '').split('/').pop()}` : 'None Linked'}
                </p>
                {activeAccount && (
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', 
                    borderRadius: '20px', background: getStatusDisplay(activeAccount.status).bg, 
                    color: getStatusDisplay(activeAccount.status).color, fontSize: '11px', fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusDisplay(activeAccount.status).text}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px',
              background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-default)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Eye size={16} /> View Full Profile
          </button>
        </div>

        {/* CARD 2: LINKED ACCOUNTS SUMMARY */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-subtle)',
          padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: '260px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', 
                color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <LinkIcon size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Reddit Accounts</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  {profile.reddit_accounts?.length || 0} Account(s) Linked
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Status</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {profile.reddit_accounts?.map((acc: any, i: number) => {
                  const redditName = acc.reddit_profile_link ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() : 'Account';
                  const isVerified = acc.status === 'verified';
                  return (
                    <span key={i} style={{ 
                      fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                      background: isVerified ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
                      border: `1px solid ${isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}`,
                      color: isVerified ? '#22c55e' : '#eab308', fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      u/{redditName}
                    </span>
                  );
                })}
                {(!profile.reddit_accounts || profile.reddit_accounts.length === 0) && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No accounts linked</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAccountsModal(true)}
            style={{
              width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px',
              background: 'var(--text-primary)', color: 'var(--bg-primary)',
              border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Eye size={16} /> View Linked Accounts
          </button>
        </div>

      </div>

      {/* Danger Zone */}
      <div style={{ 
        marginTop: '32px', background: 'var(--bg-elevated)', borderRadius: '20px', 
        border: '1px solid var(--accent-red)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(239,68,68,0.05)'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(239,68,68,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={20} color="var(--accent-red)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>Danger Zone</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Delete Global Account</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Permanently delete your CreateForEarn account. This will remove all your linked Reddit accounts and wallet balance.</p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              style={{ 
                padding: '12px 20px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', 
                border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', fontSize: '14px', 
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>


      {/* FULL PROFILE DETAIL MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                background: 'var(--bg-elevated)', borderRadius: '24px', border: '1px solid var(--border-medium)',
                width: '100%', maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden',
                boxShadow: '0 24px 50px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Full User Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
                
                {/* Header profile display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--gradient-purple)', color: 'var(--btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700 }}>
                    {profile.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{displayUsername}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>{profile.email}</p>
                  </div>
                </div>

                {/* Active Account Info Panel */}
                {activeAccount ? (
                  <>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Account Info</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                          { icon: <LinkIcon size={16} />, label: 'Reddit Link', value: activeAccount.reddit_profile_link || 'N/A' },
                          { icon: <Calendar size={16} />, label: 'Join Date', value: new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                          { icon: <Clock size={16} />, label: 'Last Login', value: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A' },
                          { icon: <Activity size={16} />, label: 'Reddit Karma', value: activeAccount.reddit_karma || 'N/A' },
                        ].map(({ icon, label, value }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{icon}</div>
                            <div>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                              <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }}>{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance metrics */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Performance</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {[
                          { label: 'Total Earnings', value: `$${earnings.toFixed(2)}`, color: '#10b981' },
                          { label: 'Submissions', value: submissions, color: 'var(--text-primary)' },
                          { label: 'Approvals', value: approvals, color: '#10b981' },
                          { label: 'Rejections', value: rejections, color: '#ef4444' },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-default)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No active Reddit account currently selected.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '20px 32px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
                    border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL LINKED ACCOUNTS MODAL */}
      <AnimatePresence>
        {showAccountsModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                background: 'var(--bg-elevated)', borderRadius: '24px', border: '1px solid var(--border-medium)',
                width: '100%', maxWidth: '580px', maxHeight: '85vh', overflow: 'hidden',
                boxShadow: '0 24px 50px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Linked Reddit Accounts</h2>
                <button
                  onClick={() => {
                    setShowAccountsModal(false);
                    setShowAddAccount(false);
                  }}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                
                {showAddAccount ? (
                  <div>
                    <button 
                      onClick={() => setShowAddAccount(false)} 
                      style={{ 
                        marginBottom: '16px', background: 'none', border: 'none', 
                        color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' 
                      }}
                    >
                      ← Back to Account List
                    </button>
                    <OnboardingScreen />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {profile.reddit_accounts?.map((acc: any) => {
                        const isActive = profile.active_reddit_account_id === acc.id;
                        const redditName = acc.reddit_profile_link ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() : 'Account';
                        return (
                          <div 
                            key={acc.id} 
                            onClick={() => handleSwitchAccount(acc.id)} 
                            style={{ 
                              padding: '16px', borderRadius: '14px', cursor: isSwitching ? 'wait' : 'pointer', 
                              border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, 
                              background: isActive ? 'rgba(59,130,246,0.04)' : 'var(--bg-card)', 
                              transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.05)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png" alt="Reddit" style={{ width: '20px', height: '20px', opacity: 0.8 }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>u/{redditName}</p>
                                  <p style={{ fontSize: '12px', color: getStatusDisplay(acc.status).color, marginTop: '2px', fontWeight: 500 }}>{getStatusDisplay(acc.status).text}</p>
                                  {acc.reddit_account_subreddits?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                      {acc.reddit_account_subreddits.map((ts: any, i: number) => (
                                        <span key={i} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                          r/{ts.subreddits?.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isActive && <CheckCircle size={20} color="var(--accent-blue)" />}
                                <button onClick={(e) => handleRemoveAccount(e, acc.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Remove Account">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => setShowAddAccount(true)} 
                      style={{ 
                        width: '100%', padding: '12px', borderRadius: '12px', 
                        border: '1px dashed var(--border-medium)', background: 'transparent', 
                        color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', gap: '8px', transition: 'all 0.2s' 
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
                    >
                      <PlusCircle size={18} /> Add Reddit Account
                    </button>

                  </>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '20px 32px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAccountsModal(false);
                    setShowAddAccount(false);
                  }}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
                    border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>Are you absolutely sure? This action cannot be undone and you will lose all access to your tasks and wallet.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', flex: 1, opacity: isDeleting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isDeleting ? 'Deleting...' : <><Trash2 size={16} /> Delete</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
