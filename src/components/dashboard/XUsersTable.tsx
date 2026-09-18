'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ShieldCheck, Trash2, AlertTriangle, Ban, X, Loader2, ExternalLink } from 'lucide-react';
import { verifyXAccount, rejectXAccount, banXAccount, deleteUserAccount, banEntireUser, unbanXAccount, adminRemoveXAccount } from '@/actions/users';

type XUser = {
  id: string;
  user_id: string;
  status: string;
  username?: string;
  x_handle?: string;
  profile_url: string;
  followers_count?: number | null;
  account_created_date?: string | null;
  profile_pic_url?: string | null;
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
  x_accounts: XUser[];
};

export default function XUsersTable({ initialUsers }: { initialUsers: XUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<XUser | null>(null);
  
  // Modal states
  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);

  // Reject State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your X account does not meet our current verification standards.');
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
          x_accounts: []
        });
      }
      map.get(u.user_id)!.x_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredGroupedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(g => {
      const matchesEmail = g.email.toLowerCase().includes(q);
      const matchesName = (g.full_name || '').toLowerCase().includes(q);
      const matchesX = g.x_accounts.some(a => 
        (a.username || a.x_handle || '').toLowerCase().includes(q) || (a.profile_url || '').toLowerCase().includes(q)
      );
      return matchesEmail || matchesName || matchesX;
    });
  }, [groupedUsers, userSearchQuery]);

  const getGroupedStatus = (g: GroupedUser) => {
    const statuses = g.x_accounts.map(a => a.status);
    if (statuses.includes('pending_approval')) return 'pending_approval';
    if (statuses.includes('verified')) return 'verified';
    if (statuses.every(s => s === 'banned')) return 'banned';
    if (statuses.includes('rejected')) return 'rejected';
    return 'pending_details';
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setIsApproving(true);
    
    const res = await verifyXAccount(selectedUser.id);
    if (res.error) {
      alert("Approval failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified' } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          x_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
    setIsApproving(false);
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    setIsRejecting(true);
    
    const finalReason = rejectReason === 'custom' ? customRejectReason : rejectReason;
    
    const res = await rejectXAccount(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected', rejection_reason: finalReason } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          x_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
      setIsRejectingMode(false);
    }
    setIsRejecting(false);
  };

  const handleBanEntireUser = async () => {
    if (!userToBan || !banReason.trim()) return;
    setIsBanning(true);
    const res = await banEntireUser(userToBan.user_id, banReason);
    if (res.error) {
      alert("Failed to ban user: " + res.error);
    } else {
      setUsers(users.map(u => u.user_id === userToBan.user_id ? { ...u, status: 'banned' } : u));
      setUserToBan(null);
      setBanReason('');
    }
    setIsBanning(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(userToDelete.user_id);
    if (res.error) {
      alert("Failed to delete user: " + res.error);
    } else {
      setUsers(users.filter(u => u.user_id !== userToDelete.user_id));
      setUserToDelete(null);
    }
    setIsDeleting(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#000000', color: '#fff', border: '1px solid #333'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            X Users
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Verify and manage worker X (Twitter) accounts.</p>
        </div>
        <div className="admin-stats-box">
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Workers</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{groupedUsers.length}</p>
          </div>
          <div className="admin-stats-divider"></div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-amber)' }}>{users.filter(u => u.status === 'pending_approval').length}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search users by name, email, or @handle..."
          value={userSearchQuery}
          onChange={(e) => setUserSearchQuery(e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', padding: '12px 16px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      {/* Desktop Table View */}
      <div className="admin-desktop-table" style={{ 
        background: 'var(--bg-elevated)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-subtle)',
        overflow: 'visible'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
              <th style={{ borderTopRightRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroupedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No X workers found.
                </td>
              </tr>
            ) : (
              filteredGroupedUsers.map((gUser) => {
                const summaryStatus = getGroupedStatus(gUser);
                const displayInitial = (gUser.full_name ? gUser.full_name.trim().charAt(0) : gUser.email?.charAt(0) || 'U').toUpperCase();
                return (
                <tr key={gUser.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', 
                        borderRadius: '50%', 
                        background: 'var(--gradient-purple)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#fff', fontWeight: 600, fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {displayInitial}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                            {gUser.full_name || 'Worker'}
                          </span>
                          {gUser.x_accounts.length > 1 && (
                            <span style={{ 
                              fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.08)',
                              color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
                              padding: '1px 6px', borderRadius: '10px'
                            }}>
                              {gUser.x_accounts.length} Handles
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>{gUser.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: summaryStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' :
                                  summaryStatus === 'pending_approval' ? 'rgba(245, 158, 11, 0.1)' :
                                  summaryStatus === 'banned' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: summaryStatus === 'verified' ? '#10b981' :
                             summaryStatus === 'pending_approval' ? '#f59e0b' :
                             summaryStatus === 'banned' ? '#ef4444' : '#6b7280',
                      border: `1px solid ${
                        summaryStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' :
                        summaryStatus === 'pending_approval' ? 'rgba(245, 158, 11, 0.2)' :
                        summaryStatus === 'banned' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'
                      }`
                    }}>
                      {summaryStatus === 'verified' && <CheckCircle2 size={12} />}
                      {summaryStatus === 'pending_approval' && <ShieldCheck size={12} />}
                      {summaryStatus === 'banned' && <Ban size={12} />}
                      {summaryStatus === 'verified' ? 'Verified' :
                       summaryStatus === 'pending_approval' ? 'Pending Approval' :
                       summaryStatus === 'banned' ? 'Banned' :
                       summaryStatus === 'rejected' ? 'Rejected' : 'Onboarding'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Worker
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
                      <button
                        onClick={() => {
                          setSelectedGroupUser(gUser);
                          setSelectedUser(gUser.x_accounts[0] || null);
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View Handles ({gUser.x_accounts.length})
                      </button>

                      <button
                        onClick={() => setActionMenuOpenFor(actionMenuOpenFor === gUser.user_id ? null : gUser.user_id)}
                        style={{
                          padding: '6px', borderRadius: '8px',
                          background: 'transparent', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {actionMenuOpenFor === gUser.user_id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', zIndex: 10,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                          borderRadius: '12px', padding: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                          minWidth: '160px', textAlign: 'left'
                        }}>
                          <button
                            onClick={() => {
                              setUserToBan(gUser);
                              setActionMenuOpenFor(null);
                            }}
                            style={{
                              width: '100%', padding: '8px 12px', border: 'none', background: 'transparent',
                              color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px'
                            }}
                          >
                            <Ban size={14} /> Ban Worker
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(gUser);
                              setActionMenuOpenFor(null);
                            }}
                            style={{
                              width: '100%', padding: '8px 12px', border: 'none', background: 'transparent',
                              color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px'
                            }}
                          >
                            <Trash2 size={14} /> Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card System */}
      <div className="admin-mobile-cards">
        {filteredGroupedUsers.length === 0 ? (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            No X workers found.
          </div>
        ) : (
          filteredGroupedUsers.map((gUser) => {
            const summaryStatus = getGroupedStatus(gUser);
            const isPending = summaryStatus === 'pending_approval';
            const displayInitial = (gUser.full_name ? gUser.full_name.trim().charAt(0) : gUser.email?.charAt(0) || 'U').toUpperCase();
            return (
              <div key={gUser.user_id} className="admin-card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      width: '38px', height: '38px', 
                      borderRadius: '50%', 
                      background: 'var(--gradient-purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: '#fff', fontWeight: 600, fontSize: '15px',
                      flexShrink: 0
                    }}>
                      {displayInitial}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {gUser.full_name || 'Worker'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all', lineHeight: '1.3' }}>
                        {gUser.email}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Joined {new Date(gUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: summaryStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' :
                                  summaryStatus === 'pending_approval' ? 'rgba(245, 158, 11, 0.1)' :
                                  summaryStatus === 'banned' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: summaryStatus === 'verified' ? '#10b981' :
                             summaryStatus === 'pending_approval' ? '#f59e0b' :
                             summaryStatus === 'banned' ? '#ef4444' : '#6b7280',
                      border: `1px solid ${
                        summaryStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' :
                        summaryStatus === 'pending_approval' ? 'rgba(245, 158, 11, 0.2)' :
                        summaryStatus === 'banned' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'
                      }`,
                      whiteSpace: 'nowrap'
                    }}>
                      {summaryStatus === 'verified' && <CheckCircle2 size={11} />}
                      {summaryStatus === 'pending_approval' && <ShieldCheck size={11} />}
                      {summaryStatus === 'banned' && <Ban size={11} />}
                      {summaryStatus === 'verified' ? 'Verified' :
                       summaryStatus === 'pending_approval' ? 'Pending' :
                       summaryStatus === 'banned' ? 'Banned' :
                       summaryStatus === 'rejected' ? 'Rejected' : 'Onboarding'}
                    </span>
                  </div>
                </div>

                {/* Handles preview if available */}
                {gUser.x_accounts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {gUser.x_accounts.map(acc => (
                      <span key={acc.id} style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}>
                        @{acc.username || acc.x_handle || 'user'}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    𝕏 {gUser.x_accounts.length} {gUser.x_accounts.length === 1 ? 'Handle' : 'Handles'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedGroupUser(gUser);
                        setSelectedUser(gUser.x_accounts[0] || null);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: isPending ? 'var(--text-primary)' : 'var(--bg-card)',
                        color: isPending ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ShieldCheck size={14} /> {isPending ? 'Review' : 'View'}
                    </button>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        onClick={() => setActionMenuOpenFor(actionMenuOpenFor === `mobile-${gUser.user_id}` ? null : `mobile-${gUser.user_id}`)}
                        style={{ background: 'var(--hero-glow-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {actionMenuOpenFor === `mobile-${gUser.user_id}` && (
                        <div style={{
                          position: 'absolute', right: '0', bottom: '100%', marginBottom: '8px', zIndex: 20,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '150px', overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => {
                              setUserToBan(gUser);
                              setActionMenuOpenFor(null);
                            }}
                            style={{
                              width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                              color: '#f59e0b', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                              borderBottom: '1px solid var(--border-subtle)'
                            }}
                          >
                            <Ban size={14} /> Ban Worker
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(gUser);
                              setActionMenuOpenFor(null);
                            }}
                            style={{
                              width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                              color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left'
                            }}
                          >
                            <Trash2 size={14} /> Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedGroupUser && selectedUser && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '640px',
                maxHeight: '90vh', overflowY: 'auto', padding: '32px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative'
              }}
            >
              <button
                onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); }}
                style={{
                  position: 'absolute', top: '24px', right: '24px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 700 }}>
                  {(selectedGroupUser.full_name?.charAt(0) || selectedGroupUser.email.charAt(0)).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedGroupUser.full_name || 'Worker'}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedGroupUser.email}</p>
                </div>
              </div>

              {/* Handles Switcher */}
              {selectedGroupUser.x_accounts.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
                  {selectedGroupUser.x_accounts.map(acc => {
                    const handle = acc.username || acc.x_handle || 'user';
                    return (
                      <button
                        key={acc.id}
                        onClick={() => { setSelectedUser(acc); setIsRejectingMode(false); }}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                          border: selectedUser.id === acc.id ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                          background: selectedUser.id === acc.id ? 'var(--text-primary)' : 'var(--bg-card)',
                          color: selectedUser.id === acc.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                          cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                      >
                        @{handle}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Current Account Details */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>X Handle</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      @{selectedUser.username || selectedUser.x_handle || 'N/A'}
                    </h4>
                  </div>
                  <a
                    href={selectedUser.profile_url || `https://x.com/${selectedUser.username || selectedUser.x_handle || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      background: 'var(--text-primary)', color: 'var(--bg-card)',
                      fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    Open Profile <ExternalLink size={13} />
                  </a>
                </div>

                {/* Account URL Display */}
                <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>Account URL</span>
                  <a
                    href={selectedUser.profile_url || `https://x.com/${selectedUser.username || selectedUser.x_handle || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '13px', fontWeight: 600, color: 'var(--accent-blue)',
                      wordBreak: 'break-all', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {selectedUser.profile_url || `https://x.com/${selectedUser.username || selectedUser.x_handle || ''}`}
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</span>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: selectedUser.status === 'verified' ? '#10b981' : selectedUser.status === 'pending_approval' ? '#f59e0b' : '#ef4444', marginTop: '2px' }}>
                      {selectedUser.status}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Submitted On</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser.followers_count !== undefined && selectedUser.followers_count !== null && (
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Followers</span>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedUser.followers_count}
                      </p>
                    </div>
                  )}
                  {selectedUser.account_created_date && (
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>X Join Date</span>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedUser.account_created_date}
                      </p>
                    </div>
                  )}
                </div>

                {selectedUser.rejection_reason && (
                  <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>Rejection Reason:</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>{selectedUser.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Rejection Mode View */}
              {isRejectingMode ? (
                <div style={{ background: 'var(--bg-default)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-medium)', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Select Rejection Reason</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      'Your X account does not meet our current verification standards.',
                      'X profile appears inactive, brand new, or suspended.',
                      'Account does not meet minimum activity requirements.',
                      'custom'
                    ].map(r => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="rejectReason"
                          checked={rejectReason === r}
                          onChange={() => setRejectReason(r)}
                        />
                        {r === 'custom' ? 'Custom Reason...' : r}
                      </label>
                    ))}
                  </div>

                  {rejectReason === 'custom' && (
                    <textarea
                      placeholder="Write custom reason..."
                      value={customRejectReason}
                      onChange={e => setCustomRejectReason(e.target.value)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '13px', marginBottom: '16px'
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setIsRejectingMode(false)}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejecting}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {selectedUser.status !== 'verified' && (
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: '#10b981', color: '#fff', border: 'none',
                        fontSize: '14px', fontWeight: 600, cursor: isApproving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} /> {isApproving ? 'Approving...' : 'Approve Account'}
                    </button>
                  )}

                  {selectedUser.status !== 'rejected' && (
                    <button
                      onClick={() => setIsRejectingMode(true)}
                      style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Reject Account
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BAN USER MODAL */}
      <AnimatePresence>
        {userToBan && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Ban size={28} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Ban Worker</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Are you sure you want to ban {userToBan.full_name || userToBan.email}? They will lose access to all tasks and withdrawals.
              </p>

              <textarea
                placeholder="Reason for banning this worker..."
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)', fontSize: '14px', marginBottom: '20px', outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setUserToBan(null); setBanReason(''); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanEntireUser}
                  disabled={!banReason.trim() || isBanning}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: !banReason.trim() || isBanning ? 'not-allowed' : 'pointer', opacity: !banReason.trim() ? 0.6 : 1 }}
                >
                  {isBanning ? 'Banning...' : 'Confirm Ban'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE USER MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '28px',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete User Account</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                This will permanently delete {userToDelete.email} and all their linked accounts, claims, and history.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setUserToDelete(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
