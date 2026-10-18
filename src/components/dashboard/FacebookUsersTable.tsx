'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ShieldCheck, Trash2, AlertTriangle, Ban, X, Loader2, ExternalLink } from 'lucide-react';
import { 
  verifyFacebookAccount, 
  rejectFacebookAccount, 
  banFacebookAccount, 
  deleteUserAccount, 
  banEntireUser, 
  unbanFacebookAccount, 
  adminRemoveFacebookAccount 
} from '@/actions/users';
import { FacebookIcon } from '@/utils/facebook';

type FacebookUser = {
  id: string;
  user_id: string;
  status: string;
  username: string;
  profile_url: string;
  created_at: string;
  rejection_reason?: string;
  ban_reason?: string;
  users: {
    email: string;
    full_name?: string | null;
    created_at: string;
  };
  task_claims?: {
    status: string;
    tasks: {
      payment_amount: number;
    } | null;
  }[];
};

type GroupedUser = {
  user_id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
  facebook_accounts: FacebookUser[];
};

export default function FacebookUsersTable({ initialUsers }: { initialUsers: FacebookUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<FacebookUser | null>(null);
  
  // Modal states
  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);

  // Reject State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your Facebook account does not meet our current verification standards.');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Delete State
  const [userToDelete, setUserToDelete] = useState<GroupedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ban State
  const [userToBan, setUserToBan] = useState<GroupedUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  // Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setUserSearchQuery(query);
    }
  }, [searchParams]);

  const groupedUsers = useMemo(() => {
    const map = new Map<string, GroupedUser>();
    users.forEach(u => {
      if (!map.has(u.user_id)) {
        map.set(u.user_id, {
          user_id: u.user_id,
          email: u.users?.email || 'Unknown',
          full_name: u.users?.full_name || null,
          created_at: u.users?.created_at || u.created_at,
          facebook_accounts: []
        });
      }
      map.get(u.user_id)!.facebook_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredGroupedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(g => {
      const matchesEmail = g.email.toLowerCase().includes(q);
      const matchesName = (g.full_name || '').toLowerCase().includes(q);
      const matchesFacebook = g.facebook_accounts.some(a => 
        (a.username || '').toLowerCase().includes(q) || (a.profile_url || '').toLowerCase().includes(q)
      );
      return matchesEmail || matchesName || matchesFacebook;
    });
  }, [groupedUsers, userSearchQuery]);

  const handleVerify = async (accountId: string) => {
    setIsApproving(true);
    const res = await verifyFacebookAccount(accountId);
    if (!res.error) {
      setUsers(users.map(u => u.id === accountId ? { ...u, status: 'verified', rejection_reason: undefined, ban_reason: undefined } : u));
      if (selectedUser?.id === accountId) {
        setSelectedUser({ ...selectedUser, status: 'verified', rejection_reason: undefined, ban_reason: undefined });
      }
    } else {
      alert('Error verifying account: ' + res.error);
    }
    setIsApproving(false);
  };

  const handleReject = async (accountId: string) => {
    setIsRejecting(true);
    const finalReason = rejectReason === 'custom' ? customRejectReason : rejectReason;
    const res = await rejectFacebookAccount(accountId, finalReason);
    if (!res.error) {
      setUsers(users.map(u => u.id === accountId ? { ...u, status: 'rejected', rejection_reason: finalReason } : u));
      if (selectedUser?.id === accountId) {
        setSelectedUser({ ...selectedUser, status: 'rejected', rejection_reason: finalReason });
      }
      setIsRejectingMode(false);
      setCustomRejectReason('');
    } else {
      alert('Error rejecting account: ' + res.error);
    }
    setIsRejecting(false);
  };

  const handleBanAccount = async (accountId: string) => {
    const reason = prompt('Enter ban reason for this Facebook account:');
    if (!reason) return;
    const res = await banFacebookAccount(accountId, reason);
    if (!res.error) {
      setUsers(users.map(u => u.id === accountId ? { ...u, status: 'banned', ban_reason: reason } : u));
      if (selectedUser?.id === accountId) {
        setSelectedUser({ ...selectedUser, status: 'banned', ban_reason: reason });
      }
    } else {
      alert('Error banning account: ' + res.error);
    }
  };

  const handleUnbanAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to unban this Facebook account?')) return;
    const res = await unbanFacebookAccount(accountId);
    if (!res.error) {
      setUsers(users.map(u => u.id === accountId ? { ...u, status: 'verified', ban_reason: undefined } : u));
      if (selectedUser?.id === accountId) {
        setSelectedUser({ ...selectedUser, status: 'verified', ban_reason: undefined });
      }
    } else {
      alert('Error unbanning account: ' + res.error);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this Facebook account?')) return;
    const res = await adminRemoveFacebookAccount(accountId);
    if (!res.error) {
      setUsers(users.filter(u => u.id !== accountId));
      if (selectedUser?.id === accountId) setSelectedUser(null);
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          facebook_accounts: selectedGroupUser.facebook_accounts.filter(a => a.id !== accountId)
        });
      }
    } else {
      alert('Error removing account: ' + res.error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(userToDelete.user_id);
    if (!res.error) {
      setUsers(users.filter(u => u.user_id !== userToDelete.user_id));
      setUserToDelete(null);
      if (selectedUser?.user_id === userToDelete.user_id) setSelectedUser(null);
      if (selectedGroupUser?.user_id === userToDelete.user_id) setSelectedGroupUser(null);
    } else {
      alert('Error deleting user: ' + res.error);
    }
    setIsDeleting(false);
  };

  const handleBanUser = async () => {
    if (!userToBan) return;
    setIsBanning(true);
    const res = await banEntireUser(userToBan.user_id, banReason || 'Violated terms of service');
    if (!res.error) {
      setUsers(users.map(u => u.user_id === userToBan.user_id ? { ...u, status: 'banned', ban_reason: banReason } : u));
      setUserToBan(null);
      setBanReason('');
    } else {
      alert('Error banning user: ' + res.error);
    }
    setIsBanning(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#1877F2', 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
            }}>
              <FacebookIcon size={18} color="#ffffff" />
            </span>
            Manage Facebook Users
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Review, verify, and moderate workers linking their Facebook accounts.
          </p>
        </div>

        {/* Global Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Search email, name, or username..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          {userSearchQuery && (
            <button
              onClick={() => setUserSearchQuery('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>USER</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>LINKED ACCOUNTS</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>PRIMARY STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>JOINED</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroupedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No Facebook users found.
                  </td>
                </tr>
              ) : (
                filteredGroupedUsers.map((group) => {
                  const pendingCount = group.facebook_accounts.filter(a => a.status === 'pending_approval').length;
                  const verifiedCount = group.facebook_accounts.filter(a => a.status === 'verified').length;
                  const primaryStatus = pendingCount > 0 ? 'pending_approval' : verifiedCount > 0 ? 'verified' : group.facebook_accounts[0]?.status || 'pending_approval';

                  return (
                    <tr 
                      key={group.user_id} 
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {group.full_name || 'No Name'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {group.email}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {group.facebook_accounts.map(acc => (
                            <button
                              key={acc.id}
                              onClick={() => setSelectedUser(acc)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                background: acc.status === 'verified' ? 'rgba(34, 197, 94, 0.08)' : acc.status === 'banned' || acc.status === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                                color: acc.status === 'verified' ? '#22c55e' : acc.status === 'banned' || acc.status === 'rejected' ? '#ef4444' : '#eab308',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <FacebookIcon size={12} color="currentColor" />
                              <span>@{acc.username}</span>
                            </button>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          background: primaryStatus === 'verified' ? 'rgba(34, 197, 94, 0.1)' : primaryStatus === 'rejected' || primaryStatus === 'banned' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: primaryStatus === 'verified' ? '#22c55e' : primaryStatus === 'rejected' || primaryStatus === 'banned' ? '#ef4444' : '#eab308'
                        }}>
                          {primaryStatus === 'verified' ? 'Verified' : primaryStatus === 'rejected' ? 'Rejected' : primaryStatus === 'banned' ? 'Banned' : 'Pending Verification'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {new Date(group.created_at).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedGroupUser(group)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            View All ({group.facebook_accounts.length})
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                width: '100%',
                maxWidth: '500px',
                padding: '24px',
                position: 'relative',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
              }}
            >
              <button
                onClick={() => { setSelectedUser(null); setIsRejectingMode(false); }}
                style={{
                  position: 'absolute', right: '16px', top: '16px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FacebookIcon size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    @{selectedUser.username}
                  </h3>
                  <a 
                    href={selectedUser.profile_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '12px', color: '#1877F2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Facebook Profile <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-elevated)', borderRadius: '10px',
                padding: '14px', marginBottom: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{selectedUser.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>User Email:</span>
                  <span style={{ fontWeight: 600 }}>{selectedUser.users?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Linked Date:</span>
                  <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
                </div>
                {selectedUser.rejection_reason && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', color: '#ef4444' }}>
                    <strong>Rejection Reason:</strong> {selectedUser.rejection_reason}
                  </div>
                )}
                {selectedUser.ban_reason && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', color: '#ef4444' }}>
                    <strong>Ban Reason:</strong> {selectedUser.ban_reason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isRejectingMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedUser.status !== 'verified' && (
                    <button
                      onClick={() => handleVerify(selectedUser.id)}
                      disabled={isApproving}
                      style={{
                        padding: '12px', borderRadius: '8px',
                        background: '#22c55e', color: '#fff', border: 'none',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} /> Verify Facebook Account
                    </button>
                  )}

                  {selectedUser.status !== 'rejected' && (
                    <button
                      onClick={() => setIsRejectingMode(true)}
                      style={{
                        padding: '12px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <XCircle size={16} /> Reject Account
                    </button>
                  )}

                  {selectedUser.status === 'banned' ? (
                    <button
                      onClick={() => handleUnbanAccount(selectedUser.id)}
                      style={{
                        padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
                        fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Unban Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBanAccount(selectedUser.id)}
                      style={{
                        padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', color: '#ef4444', border: '1px solid var(--border-subtle)',
                        fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Ban Account
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveAccount(selectedUser.id)}
                    style={{
                      padding: '8px', borderRadius: '8px',
                      background: 'none', color: 'var(--text-muted)', border: 'none',
                      fontSize: '11px', cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    Delete / Remove Account Record
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Select Rejection Reason:
                  </label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{
                      padding: '10px', borderRadius: '8px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', fontSize: '13px'
                    }}
                  >
                    <option value="Your Facebook account does not meet our current verification standards.">Standards not met</option>
                    <option value="Profile appears to be inactive, brand new, or a bot account.">Inactive / Bot profile</option>
                    <option value="Facebook profile link could not be verified or is set to private.">Profile inaccessible / Private</option>
                    <option value="Duplicate account linked by another user.">Duplicate account</option>
                    <option value="custom">Custom reason...</option>
                  </select>

                  {rejectReason === 'custom' && (
                    <textarea
                      placeholder="Enter custom rejection reason..."
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      rows={3}
                      style={{
                        padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)', fontSize: '13px'
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsRejectingMode(false)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedUser.id)}
                      disabled={isRejecting}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: '#ef4444', color: '#fff', border: 'none',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group View Modal (All accounts for a user) */}
      <AnimatePresence>
        {selectedGroupUser && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '24px',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setSelectedGroupUser(null)}
                style={{
                  position: 'absolute', right: '16px', top: '16px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {selectedGroupUser.full_name || 'Worker Accounts'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {selectedGroupUser.email} • {selectedGroupUser.facebook_accounts.length} linked Facebook accounts
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedGroupUser.facebook_accounts.map(acc => (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FacebookIcon size={18} color="#1877F2" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{acc.username}</div>
                        <a href={acc.profile_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#1877F2', textDecoration: 'none' }}>
                          View Profile ↗
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        background: acc.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: acc.status === 'verified' ? '#22c55e' : '#eab308'
                      }}>
                        {acc.status}
                      </span>
                      <button
                        onClick={() => { setSelectedGroupUser(null); setSelectedUser(acc); }}
                        style={{
                          padding: '5px 10px', borderRadius: '6px',
                          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                          fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)'
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
