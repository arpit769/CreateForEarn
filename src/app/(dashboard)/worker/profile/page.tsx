'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, User as UserIcon, Calendar, Clock, Mail, Shield, Activity, Link as LinkIcon, PlusCircle, CheckCircle } from 'lucide-react';
import { deleteUserAccount, getCurrentUserProfile, setActiveRedditAccount, removeRedditAccount } from '@/actions/users';
import { createClient } from '@/utils/supabase/client';
import OnboardingScreen from '@/components/dashboard/OnboardingScreen';

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);

      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    }
    loadUser();
  }, []);

  const handleDeleteAccount = async () => {
    if (!profile) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(profile.id);
    if (res.error) {
      alert("Failed to delete account: " + res.error);
    }
    setIsDeleting(false);
  };

  const handleSwitchAccount = async (id: string) => {
    if (profile.active_reddit_account_id === id) return;
    setIsSwitching(true);
    const res = await setActiveRedditAccount(id);
    if (!res.error) {
      // Reload profile to reflect new active state
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    } else {
      alert("Error switching account: " + res.error);
    }
    setIsSwitching(false);
  };

  const handleRemoveAccount = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent triggering handleSwitchAccount
    if (!confirm('Are you sure you want to remove this Reddit account?')) return;
    
    setIsSwitching(true);
    const res = await removeRedditAccount(id);
    if (!res.error) {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    } else {
      alert("Error removing account: " + res.error);
    }
    setIsSwitching(false);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_approval': return { text: 'Pending Verification', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };
      case 'verified': return { text: 'Verified', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'banned': return { text: 'Banned', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'rejected': return { text: 'Suspended', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'pending_details': return { text: 'Onboarding', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
      default: return { text: status || 'Pending', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    }
  };

  if (!profile || !authUser) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>;

  if (showAddAccount) {
    return (
      <div>
        <button 
          onClick={() => setShowAddAccount(false)}
          style={{ marginBottom: '16px', background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
        >
          ← Back to Profile
        </button>
        <OnboardingScreen />
      </div>
    );
  }

  const activeAccount = profile.reddit_accounts?.find((a: any) => a.id === profile.active_reddit_account_id) || profile.reddit_accounts?.[0];
  const displayUsername = profile.email?.split('@')[0] || 'Worker';

  let earnings = 0, approvals = 0, submissions = 0, rejections = 0;
  if (activeAccount && activeAccount.task_claims) {
    activeAccount.task_claims.forEach((c: any) => {
      if (c.status === 'submitted' || c.status === 'approved' || c.status === 'rejected') submissions++;
      if (c.status === 'approved') {
        approvals++;
        earnings += c.tasks?.payment_amount || 0;
      }
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
        
        {/* Left Side: Active Account Details */}
        <div>
          {activeAccount ? (
            <div style={{ 
              background: 'var(--bg-elevated)', 
              borderRadius: '16px', 
              border: '1px solid var(--border-subtle)',
              padding: '32px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'var(--gradient-purple)', color: 'var(--btn-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700
                }}>
                  {profile.email?.[0].toUpperCase() || <UserIcon size={32} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{displayUsername}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {profile.email}
                  </p>
                </div>
                <div>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    padding: '8px 16px', borderRadius: '24px', 
                    background: getStatusDisplay(activeAccount.status).bg, color: getStatusDisplay(activeAccount.status).color, 
                    fontSize: '13px', fontWeight: 600 
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusDisplay(activeAccount.status).color }}></span> 
                    {getStatusDisplay(activeAccount.status).text}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Active Account Info</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}><LinkIcon size={18} /></div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reddit Link</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '4px', wordBreak: 'break-all' }}>
                        {activeAccount.reddit_profile_link || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}><Calendar size={18} /></div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Join Date</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '4px' }}>
                        {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}><Clock size={18} /></div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Login</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '4px' }}>
                        {authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}><Activity size={18} /></div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reddit Karma</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '4px' }}>
                        {activeAccount.reddit_karma || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Account Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  <div style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Earnings</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>${earnings.toFixed(2)}</p>
                  </div>
                  <div style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Submissions</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{submissions}</p>
                  </div>
                  <div style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Approvals</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{approvals}</p>
                  </div>
                  <div style={{ background: 'var(--bg-default)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Rejections</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{rejections}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-muted)' }}>You don't have any Reddit accounts yet.</p>
              <button onClick={() => setShowAddAccount(true)} style={{ marginTop: '16px', padding: '10px 20px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Add Reddit Account
              </button>
            </div>
          )}

          {/* Danger Zone */}
          <div style={{ 
            background: 'var(--bg-elevated)', 
            borderRadius: '16px', 
            border: '1px solid var(--accent-red)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-red)' }}>Danger Zone</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Delete Global Account</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Permanently delete your CreateForEarn account. This will remove all your linked Reddit accounts and wallet balance.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  style={{ 
                    padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '14px', 
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Linked Accounts Panel */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Linked Accounts</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.reddit_accounts?.map((acc: any) => {
              const isActive = profile.active_reddit_account_id === acc.id;
              const redditName = acc.reddit_profile_link ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() : 'Account';
              
              return (
                <div key={acc.id} onClick={() => handleSwitchAccount(acc.id)} style={{
                  padding: '16px', borderRadius: '12px', cursor: isSwitching ? 'wait' : 'pointer',
                  border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: isActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png" alt="Reddit" style={{ width: '18px', height: '18px', opacity: 0.8 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>u/{redditName}</p>
                        <p style={{ fontSize: '12px', color: getStatusDisplay(acc.status).color, marginTop: '2px', fontWeight: 500 }}>
                          {getStatusDisplay(acc.status).text}
                        </p>
                        {acc.reddit_account_subreddits && acc.reddit_account_subreddits.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {acc.reddit_account_subreddits.map((ts: any, i: number) => (
                              <span key={i} style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                background: 'var(--bg-elevated)', 
                                border: '1px solid var(--border-medium)', 
                                borderRadius: '4px', 
                                color: 'var(--text-secondary)' 
                              }}>
                                r/{ts.subreddits?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isActive && <CheckCircle size={20} color="var(--accent-blue)" />}
                      <button 
                        onClick={(e) => handleRemoveAccount(e, acc.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Remove Account"
                      >
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
              width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px',
              border: '1px dashed var(--border-medium)', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle size={18} /> Add Reddit Account
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-card)', 
                borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)', textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
              }}>
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>
                Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all access to your tasks and wallet.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', flex: 1, opacity: isDeleting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
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
