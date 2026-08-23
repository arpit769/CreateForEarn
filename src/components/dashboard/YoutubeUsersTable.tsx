'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ShieldCheck, Trash2, AlertTriangle, Ban, X, Loader2, PlaySquare, ExternalLink } from 'lucide-react';
import { verifyYoutubeAccount, rejectYoutubeAccount, banYoutubeAccount, deleteUserAccount, banEntireUser, unbanYoutubeAccount, adminRemoveYoutubeAccount } from '@/actions/users';

type YoutubeUser = {
  id: string;
  user_id: string;
  status: string;
  channel_name: string;
  email_id: string;
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
  youtube_accounts: YoutubeUser[];
};

export default function YoutubeUsersTable({ initialUsers }: { initialUsers: YoutubeUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<YoutubeUser | null>(null);
  
  // Modal states
  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);

  // Reject State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your channel does not meet our current requirements.');
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
          youtube_accounts: []
        });
      }
      map.get(u.user_id)!.youtube_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredGroupedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(g => {
      const matchesEmail = g.email.toLowerCase().includes(q);
      const matchesName = (g.full_name || '').toLowerCase().includes(q);
      const matchesYoutube = g.youtube_accounts.some(a => 
        a.channel_name.toLowerCase().includes(q) || a.email_id.toLowerCase().includes(q)
      );
      return matchesEmail || matchesName || matchesYoutube;
    });
  }, [groupedUsers, userSearchQuery]);

  const getGroupedStatus = (g: GroupedUser) => {
    const statuses = g.youtube_accounts.map(a => a.status);
    if (statuses.includes('pending_approval')) return 'pending_approval';
    if (statuses.includes('verified')) return 'verified';
    if (statuses.every(s => s === 'banned')) return 'banned';
    if (statuses.includes('rejected')) return 'rejected';
    return 'pending_details';
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setIsApproving(true);
    
    const res = await verifyYoutubeAccount(selectedUser.id);
    if (res.error) {
      alert("Approval failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified' } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          youtube_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
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
    
    const res = await rejectYoutubeAccount(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected', rejection_reason: finalReason } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          youtube_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
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
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <PlaySquare size={28} color="#FF0000" /> YouTube Users
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Verify and manage worker YouTube accounts.</p>
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
          placeholder="Search users by name, email, or channel name..."
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
            {filteredGroupedUsers.map((gUser) => {
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
                      fontWeight: 700, color: 'var(--btn-text)', fontSize: '16px',
                      flexShrink: 0
                    }}>
                      {displayInitial}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {gUser.full_name || gUser.email}
                      </p>
                      {gUser.full_name && (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {gUser.email}
                        </p>
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Joined {new Date(gUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {summaryStatus === 'pending_approval' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></span> Pending Review
                    </span>
                  )}
                  {summaryStatus === 'rejected' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span> Rejected
                    </span>
                  )}
                  {summaryStatus === 'verified' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span> Verified
                    </span>
                  )}
                  {summaryStatus === 'banned' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span> Banned
                    </span>
                  )}
                  {summaryStatus === 'pending_details' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></span> Onboarding
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Worker ({gUser.youtube_accounts.length} Accounts)</span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button 
                      onClick={() => setActionMenuOpenFor(actionMenuOpenFor === gUser.user_id ? null : gUser.user_id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {actionMenuOpenFor === gUser.user_id && (
                      <div style={{
                        position: 'absolute', right: '0', top: '100%', marginTop: '8px', zIndex: 10,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '160px', overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => {
                            setSelectedGroupUser(gUser);
                            if (gUser.youtube_accounts.length > 0) {
                              setSelectedUser(gUser.youtube_accounts[0]);
                            } else {
                              setSelectedUser(null);
                            }
                            setActionMenuOpenFor(null);
                          }}
                          style={{
                            width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-default)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <ShieldCheck size={16} /> View Profiles
                        </button>
                        
                        <button
                          onClick={() => {
                            setUserToBan(gUser);
                            setActionMenuOpenFor(null);
                          }}
                          style={{
                            width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Ban size={16} /> Ban Entire User
                        </button>
                        
                        <button
                          onClick={() => {
                            setUserToDelete(gUser);
                            setActionMenuOpenFor(null);
                          }}
                          style={{
                            width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={16} /> Delete Entire User
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card System */}
      <div className="admin-mobile-cards">
        {groupedUsers.map((gUser) => {
          const summaryStatus = getGroupedStatus(gUser);
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
                    fontWeight: 700, color: 'var(--btn-text)', fontSize: '15px',
                    flexShrink: 0
                  }}>
                    {displayInitial}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                      {gUser.full_name || gUser.email}
                    </p>
                    {gUser.full_name && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all', lineHeight: '1.3' }}>
                        {gUser.email}
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Joined {new Date(gUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div>
                  {summaryStatus === 'pending_approval' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#eab308' }}></span> Pending
                    </span>
                  )}
                  {summaryStatus === 'rejected' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444' }}></span> Rejected
                    </span>
                  )}
                  {summaryStatus === 'verified' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }}></span> Verified
                    </span>
                  )}
                  {summaryStatus === 'banned' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }}></span> Banned
                    </span>
                  )}
                  {summaryStatus === 'pending_details' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)' }}></span> Onboarding
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  👤 {gUser.youtube_accounts.length} {gUser.youtube_accounts.length === 1 ? 'Account' : 'Accounts'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSelectedGroupUser(gUser);
                      if (gUser.youtube_accounts.length > 0) {
                        setSelectedUser(gUser.youtube_accounts[0]);
                      } else {
                        setSelectedUser(null);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'var(--text-primary)',
                      color: 'var(--bg-primary)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldCheck size={14} /> View
                  </button>

                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button 
                      onClick={() => setActionMenuOpenFor(actionMenuOpenFor === gUser.user_id ? null : gUser.user_id)}
                      style={{ background: 'var(--hero-glow-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {actionMenuOpenFor === gUser.user_id && (
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
                            width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}
                        >
                          <Ban size={14} /> Ban User
                        </button>
                        
                        <button
                          onClick={() => {
                            setUserToDelete(gUser);
                            setActionMenuOpenFor(null);
                          }}
                          style={{
                            width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                          }}
                        >
                          <Trash2 size={14} /> Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedUser && selectedGroupUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="admin-modal-box"
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                User Profiles for {selectedGroupUser.full_name ? `${selectedGroupUser.full_name} (${selectedGroupUser.email})` : selectedGroupUser.email}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>Select an account below to view its details.</p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {selectedGroupUser.youtube_accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedUser(acc);
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: selectedUser.id === acc.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                      background: selectedUser.id === acc.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-elevated)',
                      color: selectedUser.id === acc.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: selectedUser.id === acc.id ? 600 : 500
                    }}
                  >
                    {acc.channel_name} 
                    <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '12px', textTransform: 'capitalize' }}>({acc.status.replace('_', ' ')})</span>
                  </button>
                ))}
              </div>
              
              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Channel Name</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.channel_name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Associated Email</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.email_id}</p>
                  </div>
                  {selectedUser.rejection_reason && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Rejection Reason</p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>{selectedUser.rejection_reason}</p>
                    </div>
                  )}
                  {selectedUser.ban_reason && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ban Reason</p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>{selectedUser.ban_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedUser.status === 'pending_approval' ? (
                <>
                  {isRejectingMode ? (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>Select Rejection Reason <span style={{color: '#ef4444'}}>*</span></label>
                      <select 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ 
                          width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                          borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '12px'
                        }}
                      >
                        <option value="Your channel does not meet our current requirements.">Your channel does not meet our current requirements.</option>
                        <option value="Account is banned.">Account is banned.</option>
                        <option value="custom">Custom Reason...</option>
                      </select>

                      {rejectReason === 'custom' && (
                        <textarea 
                          placeholder="Type custom reason here..."
                          value={customRejectReason}
                          onChange={(e) => setCustomRejectReason(e.target.value)}
                          style={{ 
                            width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical'
                          }}
                        />
                      )}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                    {!isRejectingMode ? (
                      <button 
                        onClick={() => setIsRejectingMode(true)}
                        style={{ padding: '10px 18px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsRejectingMode(false)}
                        style={{ padding: '10px 18px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Back to Approve
                      </button>
                    )}

                    <button 
                      onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); }}
                      style={{ padding: '10px 18px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    
                    {isRejectingMode ? (
                      <button 
                        onClick={handleReject}
                        disabled={isRejecting || (rejectReason === 'custom' && !customRejectReason.trim())}
                        style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (isRejecting || (rejectReason === 'custom' && !customRejectReason.trim())) ? 0.5 : 1 }}
                      >
                        {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    ) : (
                      <button 
                        onClick={handleApprove}
                        disabled={isApproving}
                        style={{ padding: '10px 20px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isApproving ? 0.5 : 1 }}
                      >
                        {isApproving ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); }}
                      style={{ padding: '10px 18px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Close
                    </button>
                    
                    {selectedUser.status === 'verified' && (
                      <button 
                        onClick={async () => {
                          const reason = prompt('Enter reason to ban this specific account:');
                          if (reason) {
                            const res = await banYoutubeAccount(selectedUser.id, reason);
                            if (!res.error) {
                              const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'banned', ban_reason: reason } : u);
                              setUsers(updatedUsers);
                              if (selectedGroupUser) {
                                setSelectedGroupUser({
                                  ...selectedGroupUser,
                                  youtube_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
                                });
                                setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
                              }
                            }
                          }
                        }}
                        style={{ padding: '10px 18px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Ban Account
                      </button>
                    )}
                    
                    {selectedUser.status === 'banned' && (
                      <button 
                        onClick={async () => {
                          const res = await unbanYoutubeAccount(selectedUser.id);
                          if (!res.error) {
                            const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified', ban_reason: undefined } : u);
                            setUsers(updatedUsers);
                            if (selectedGroupUser) {
                              setSelectedGroupUser({
                                ...selectedGroupUser,
                                youtube_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
                              });
                              setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
                            }
                          }
                        }}
                        style={{ padding: '10px 18px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Unban Account
                      </button>
                    )}
                    
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this specific YouTube account?')) {
                          const res = await adminRemoveYoutubeAccount(selectedUser.id);
                          if (!res.error) {
                            const updatedUsers = users.filter(u => u.id !== selectedUser.id);
                            setUsers(updatedUsers);
                            if (selectedGroupUser) {
                              const remainingAccounts = updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id);
                              setSelectedGroupUser({
                                ...selectedGroupUser,
                                youtube_accounts: remainingAccounts
                              });
                              if (remainingAccounts.length > 0) {
                                setSelectedUser(remainingAccounts[0]);
                              } else {
                                setSelectedUser(null);
                                setSelectedGroupUser(null);
                              }
                            }
                          } else {
                            alert("Failed to delete account: " + res.error);
                          }
                        }
                      }}
                      style={{ padding: '10px 18px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="admin-modal-box"
              style={{ maxWidth: '440px', textAlign: 'center' }}
            >
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
              }}>
                <AlertTriangle size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete User Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Are you sure you want to delete the account for <strong style={{ color: 'var(--text-primary)' }}>{userToDelete.full_name ? `${userToDelete.full_name} (${userToDelete.email})` : userToDelete.email || 'Unknown User'}</strong>? This action cannot be undone and all data will be permanently removed.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  style={{ padding: '12px 20px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  style={{ padding: '12px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', flex: 1, opacity: isDeleting ? 0.7 : 1 }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ban User Modal */}
      <AnimatePresence>
        {userToBan && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUserToBan(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="admin-modal-box"
              style={{ maxWidth: '440px' }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Ban User</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                You are about to ban <strong>{userToBan.full_name ? `${userToBan.full_name} (${userToBan.email})` : userToBan.email || 'Unknown User'}</strong>. They will lose access to all tasks.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Reason for Ban
                </label>
                <textarea 
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned..."
                  rows={4}
                  style={{ 
                    width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setUserToBan(null)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBanEntireUser}
                  disabled={isBanning || !banReason.trim()}
                  style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (isBanning || !banReason.trim()) ? 0.5 : 1 }}
                >
                  {isBanning ? 'Banning...' : 'Ban User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
