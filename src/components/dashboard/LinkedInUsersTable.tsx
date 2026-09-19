'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ShieldCheck, Trash2, AlertTriangle, Ban, X, Loader2, ExternalLink } from 'lucide-react';
import { verifyLinkedInAccount, rejectLinkedInAccount, banLinkedInAccount, deleteUserAccount, banEntireUser, unbanLinkedInAccount, adminRemoveLinkedInAccount } from '@/actions/users';
import { LinkedInIcon } from '@/utils/linkedin';

type LinkedInUser = {
  id: string;
  user_id: string;
  status: string;
  username: string;
  profile_url: string;
  headline?: string | null;
  connections_count?: number;
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
  linkedin_accounts: LinkedInUser[];
};

export default function LinkedInUsersTable({ initialUsers }: { initialUsers: LinkedInUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<LinkedInUser | null>(null);
  
  // Modal states
  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);

  // Reject State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your LinkedIn profile does not meet our current verification standards.');
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
          linkedin_accounts: []
        });
      }
      map.get(u.user_id)!.linkedin_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredGroupedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(g => {
      const matchesEmail = g.email.toLowerCase().includes(q);
      const matchesName = (g.full_name || '').toLowerCase().includes(q);
      const matchesLinkedIn = g.linkedin_accounts.some(a => 
        (a.username || '').toLowerCase().includes(q) || 
        (a.profile_url || '').toLowerCase().includes(q) ||
        (a.headline || '').toLowerCase().includes(q)
      );
      return matchesEmail || matchesName || matchesLinkedIn;
    });
  }, [groupedUsers, userSearchQuery]);

  const getGroupedStatus = (g: GroupedUser) => {
    const statuses = g.linkedin_accounts.map(a => a.status);
    if (statuses.includes('pending_approval')) return 'pending_approval';
    if (statuses.includes('verified')) return 'verified';
    if (statuses.every(s => s === 'banned')) return 'banned';
    if (statuses.includes('rejected')) return 'rejected';
    return 'pending_details';
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setIsApproving(true);
    
    const res = await verifyLinkedInAccount(selectedUser.id);
    if (res.error) {
      alert("Approval failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified', rejection_reason: undefined, ban_reason: undefined } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          linkedin_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
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
    
    const res = await rejectLinkedInAccount(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected', rejection_reason: finalReason } : u);
      setUsers(updatedUsers);
      setIsRejectingMode(false);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          linkedin_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
    setIsRejecting(false);
  };

  const handleBanAccount = async () => {
    if (!selectedUser) return;
    const reason = prompt("Enter ban reason for this LinkedIn profile:");
    if (reason === null) return;

    const res = await banLinkedInAccount(selectedUser.id, reason || 'Banned for policy violation');
    if (res.error) {
      alert("Ban failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'banned', ban_reason: reason } : u);
      setUsers(updatedUsers);
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          linkedin_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
  };

  const handleUnbanAccount = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to unban and verify this LinkedIn profile?")) return;

    const res = await unbanLinkedInAccount(selectedUser.id);
    if (res.error) {
      alert("Unban failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified', ban_reason: undefined } : u);
      setUsers(updatedUsers);
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          linkedin_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
  };

  const handleRemoveAccount = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to permanently delete this LinkedIn profile?")) return;

    const res = await adminRemoveLinkedInAccount(selectedUser.id);
    if (res.error) {
      alert("Removal failed: " + res.error);
    } else {
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      setUsers(updatedUsers);
      if (selectedGroupUser) {
        const remaining = updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id);
        if (remaining.length === 0) {
          setSelectedGroupUser(null);
          setSelectedUser(null);
        } else {
          setSelectedGroupUser({ ...selectedGroupUser, linkedin_accounts: remaining });
          setSelectedUser(remaining[0] || null);
        }
      }
    }
  };

  const handleDeleteUserEntirely = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    const res = await deleteUserAccount(userToDelete.user_id);
    if (res.error) {
      alert("Deletion failed: " + res.error);
    } else {
      setUsers(users.filter(u => u.user_id !== userToDelete.user_id));
      setUserToDelete(null);
      if (selectedGroupUser?.user_id === userToDelete.user_id) {
        setSelectedGroupUser(null);
        setSelectedUser(null);
      }
    }
    setIsDeleting(false);
  };

  const handleBanUserEntirely = async () => {
    if (!userToBan) return;
    setIsBanning(true);

    const res = await banEntireUser(userToBan.user_id, banReason || 'Violated terms of service');
    if (res.error) {
      alert("Ban failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.user_id === userToBan.user_id ? { ...u, status: 'banned', ban_reason: banReason } : u);
      setUsers(updatedUsers);
      setUserToBan(null);
      if (selectedGroupUser?.user_id === userToBan.user_id) {
        setSelectedGroupUser(null);
        setSelectedUser(null);
      }
    }
    setIsBanning(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #0A66C2, #0077B5)', color: '#fff' 
            }}>
              <LinkedInIcon size={18} color="#ffffff" />
            </span>
            LinkedIn Users
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Verify, reject, or manage worker LinkedIn profiles.</p>
        </div>

        <div className="admin-stats-box">
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Workers</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{groupedUsers.length}</p>
          </div>
          <div className="admin-stats-divider"></div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Verified Accounts</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
              {users.filter(u => u.status === 'verified').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search users by name, email, or LinkedIn username..."
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
      <div className="admin-desktop-table" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '760px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Worker / Email</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>LinkedIn Profiles</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Registered</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroupedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No LinkedIn workers found.
                </td>
              </tr>
            ) : (
              filteredGroupedUsers.map((gUser) => {
                const status = getGroupedStatus(gUser);
                const isPending = status === 'pending_approval';
                const displayName = gUser.full_name?.trim() || gUser.linkedin_accounts[0]?.username || gUser.email.split('@')[0];
                const displayInitial = (displayName.charAt(0) || 'L').toUpperCase();

                return (
                  <tr key={gUser.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '38px', height: '38px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #0A66C2, #0077B5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          color: '#fff', fontWeight: 700, fontSize: '15px',
                          flexShrink: 0
                        }}>
                          {displayInitial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {gUser.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {gUser.linkedin_accounts.map(acc => (
                          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <a
                              href={acc.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#0A66C2', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              in/{acc.username} <ExternalLink size={11} />
                            </a>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                              background: acc.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : acc.status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: acc.status === 'verified' ? '#22c55e' : acc.status === 'pending_approval' ? '#eab308' : '#ef4444'
                            }}>
                              {acc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: status === 'verified' ? '#22c55e' : status === 'pending_approval' ? '#eab308' : '#ef4444'
                      }}>
                        {status === 'pending_approval' ? 'Needs Review' : status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(gUser.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
                        <button
                          onClick={() => {
                            setSelectedGroupUser(gUser);
                            setSelectedUser(gUser.linkedin_accounts[0] || null);
                            setIsRejectingMode(false);
                          }}
                          style={{
                            padding: '6px 14px', borderRadius: '8px',
                            background: isPending ? 'linear-gradient(135deg, #0A66C2, #0077B5)' : 'var(--bg-elevated)',
                            color: isPending ? '#fff' : 'var(--text-primary)',
                            border: '1px solid var(--border-medium)',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {isPending ? 'Review Accounts' : 'Manage'}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card System */}
      <div className="admin-mobile-cards">
        {filteredGroupedUsers.length === 0 ? (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            No LinkedIn workers found.
          </div>
        ) : (
          filteredGroupedUsers.map((gUser) => {
            const status = getGroupedStatus(gUser);
            const isPending = status === 'pending_approval';
            const displayName = gUser.full_name?.trim() || gUser.linkedin_accounts[0]?.username || gUser.email.split('@')[0];
            const displayInitial = (displayName.charAt(0) || 'L').toUpperCase();
            return (
              <div key={gUser.user_id} className="admin-card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      width: '38px', height: '38px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #0A66C2, #0077B5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: '#fff', fontWeight: 700, fontSize: '15px',
                      flexShrink: 0
                    }}>
                      {displayInitial}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {displayName}
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
                      background: status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: status === 'verified' ? '#22c55e' : status === 'pending_approval' ? '#eab308' : '#ef4444',
                      border: `1px solid ${
                        status === 'verified' ? 'rgba(34, 197, 94, 0.2)' :
                        status === 'pending_approval' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                      }`,
                      whiteSpace: 'nowrap'
                    }}>
                      {status === 'pending_approval' ? 'Needs Review' : status === 'verified' ? 'Verified' : status === 'banned' ? 'Banned' : status === 'rejected' ? 'Rejected' : 'Onboarding'}
                    </span>
                  </div>
                </div>

                {/* LinkedIn Accounts Preview */}
                {gUser.linkedin_accounts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    {gUser.linkedin_accounts.map(acc => (
                      <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <a
                          href={acc.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#0A66C2', fontWeight: 600, fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          in/{acc.username} <ExternalLink size={11} />
                        </a>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                          background: acc.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : acc.status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: acc.status === 'verified' ? '#22c55e' : acc.status === 'pending_approval' ? '#eab308' : '#ef4444'
                        }}>
                          {acc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    💼 {gUser.linkedin_accounts.length} {gUser.linkedin_accounts.length === 1 ? 'Profile' : 'Profiles'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedGroupUser(gUser);
                        setSelectedUser(gUser.linkedin_accounts[0] || null);
                        setIsRejectingMode(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: isPending ? 'linear-gradient(135deg, #0A66C2, #0077B5)' : 'var(--bg-elevated)',
                        color: isPending ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ShieldCheck size={14} /> {isPending ? 'Review' : 'Manage'}
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

      {/* REVIEW & MANAGEMENT MODAL */}
      <AnimatePresence>
        {selectedGroupUser && selectedUser && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: '20px', width: '100%', maxWidth: '580px',
                padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative'
              }}
            >
              <button
                onClick={() => {
                  setSelectedGroupUser(null);
                  setSelectedUser(null);
                }}
                style={{
                  position: 'absolute', top: '20px', right: '20px',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                  width: '26px', height: '26px', borderRadius: '6px', 
                  background: 'linear-gradient(135deg, #0A66C2, #0077B5)', color: '#fff' 
                }}>
                  <LinkedInIcon size={15} color="#ffffff" />
                </span>
                LinkedIn Profile Review
              </h2>

              {/* Account Switcher if user has multiple handles */}
              {selectedGroupUser.linkedin_accounts.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
                  {selectedGroupUser.linkedin_accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedUser(acc);
                        setIsRejectingMode(false);
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        border: selectedUser.id === acc.id ? '1px solid #0A66C2' : '1px solid var(--border-subtle)',
                        background: selectedUser.id === acc.id ? 'rgba(10, 102, 194, 0.15)' : 'var(--bg-card)',
                        color: selectedUser.id === acc.id ? '#0A66C2' : 'var(--text-secondary)',
                        cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      in/{acc.username}
                    </button>
                  ))}
                </div>
              )}

              {/* User Info Card */}
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedGroupUser.full_name || selectedUser.username}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedGroupUser.email}</p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: selectedUser.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : selectedUser.status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedUser.status === 'verified' ? '#22c55e' : selectedUser.status === 'pending_approval' ? '#eab308' : '#ef4444'
                  }}>
                    {selectedUser.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>LinkedIn Profile:</span>
                    <a
                      href={selectedUser.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0A66C2', fontWeight: 600, fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                    >
                      in/{selectedUser.username} <ExternalLink size={13} />
                    </a>
                    {selectedUser.headline && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {selectedUser.headline}
                      </p>
                    )}
                    {typeof selectedUser.connections_count === 'number' && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {selectedUser.connections_count}+ connections
                      </p>
                    )}
                  </div>

                  <a
                    href={selectedUser.profile_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '8px',
                      background: 'rgba(10, 102, 194, 0.1)', color: '#0A66C2',
                      border: '1px solid rgba(10, 102, 194, 0.2)',
                      fontSize: '12px', fontWeight: 600, textDecoration: 'none'
                    }}
                  >
                    Open Profile <ExternalLink size={12} />
                  </a>
                </div>

                {selectedUser.rejection_reason && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Rejection Reason:</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedUser.rejection_reason}</p>
                  </div>
                )}
                {selectedUser.ban_reason && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Ban Reason:</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedUser.ban_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isRejectingMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Reason:</label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="Your LinkedIn profile does not meet our current verification standards.">Standards not met</option>
                      <option value="LinkedIn profile URL is invalid, private, or inaccessible.">Invalid, Private, or Inaccessible URL</option>
                      <option value="Account appears inactive or lacks sufficient activity/connections.">Inactive Account / Low Connections</option>
                      <option value="Duplicate or suspicious LinkedIn profile.">Duplicate / Suspicious</option>
                      <option value="custom">Custom Reason...</option>
                    </select>
                  </div>

                  {rejectReason === 'custom' && (
                    <textarea
                      placeholder="Write custom reason for rejection..."
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '13px', minHeight: '80px' }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      onClick={() => setIsRejectingMode(false)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejecting}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: '#ef4444', color: '#fff', border: 'none',
                        fontSize: '13px', fontWeight: 600, cursor: isRejecting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || selectedUser.status === 'verified'}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px',
                        background: selectedUser.status === 'verified' ? 'rgba(34, 197, 94, 0.2)' : '#22c55e',
                        color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600,
                        cursor: selectedUser.status === 'verified' || isApproving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} /> {selectedUser.status === 'verified' ? 'Already Verified' : 'Approve Profile'}
                    </button>

                    <button
                      onClick={() => setIsRejectingMode(true)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {selectedUser.status === 'banned' ? (
                      <button
                        onClick={handleUnbanAccount}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px',
                          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                          color: '#22c55e', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Unban Profile
                      </button>
                    ) : (
                      <button
                        onClick={handleBanAccount}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px',
                          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                          color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Ban Profile
                      </button>
                    )}

                    <button
                      onClick={handleRemoveAccount}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                        color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Delete Profile
                    </button>
                  </div>
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
                  onClick={handleBanUserEntirely}
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
                  onClick={handleDeleteUserEntirely}
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
