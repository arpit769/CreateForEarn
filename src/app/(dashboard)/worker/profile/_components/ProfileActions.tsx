'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle, PlusCircle } from 'lucide-react';
import { deleteUserAccount, setActiveRedditAccount, removeRedditAccount } from '@/actions/users';
import OnboardingScreen from '@/components/dashboard/OnboardingScreen';

interface ProfileActionsProps {
  profile: any;
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

export default function ProfileActions({ profile: initialProfile }: ProfileActionsProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchAccount = async (id: string) => {
    if (profile.active_reddit_account_id === id || isSwitching) return;
    setIsSwitching(true);
    const res = await setActiveRedditAccount(id);
    if (!res.error) {
      // Optimistically update UI
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

  if (showAddAccount) {
    return (
      <div>
        <button onClick={() => setShowAddAccount(false)} style={{ marginBottom: '16px', background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}>
          ← Back to Profile
        </button>
        <OnboardingScreen />
      </div>
    );
  }

  return (
    <>
      {/* Linked Accounts Panel */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Linked Accounts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profile.reddit_accounts?.map((acc: any) => {
            const isActive = profile.active_reddit_account_id === acc.id;
            const redditName = acc.reddit_profile_link ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() : 'Account';
            return (
              <div key={acc.id} onClick={() => handleSwitchAccount(acc.id)} style={{ padding: '16px', borderRadius: '12px', cursor: isSwitching ? 'wait' : 'pointer', border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, background: isActive ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png" alt="Reddit" style={{ width: '18px', height: '18px', opacity: 0.8 }} />
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
        <button onClick={() => setShowAddAccount(true)} style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border-medium)', background: 'transparent', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
          <PlusCircle size={18} /> Add Reddit Account
        </button>
      </div>

      {/* Danger Zone trigger */}
      <div style={{ marginTop: '32px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--accent-red)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(239,68,68,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-red)' }}>Danger Zone</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Delete Global Account</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Permanently delete your CreateForEarn account. This will remove all your linked Reddit accounts and wallet balance.</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    </>
  );
}
