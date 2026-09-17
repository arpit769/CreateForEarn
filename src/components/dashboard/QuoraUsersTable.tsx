'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ShieldCheck, Trash2, AlertTriangle, Ban, X, Loader2, ExternalLink } from 'lucide-react';
import { verifyQuoraAccount, rejectQuoraAccount, banQuoraAccount, deleteUserAccount, banEntireUser, unbanQuoraAccount, adminRemoveQuoraAccount } from '@/actions/users';

type QuoraUser = {
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
  quora_accounts: QuoraUser[];
};

export default function QuoraUsersTable({ initialUsers }: { initialUsers: QuoraUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<QuoraUser | null>(null);
  
  // Modal states
  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);

  // Reject State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your Quora account does not meet our current verification standards.');
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
          quora_accounts: []
        });
      }
      map.get(u.user_id)!.quora_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredGroupedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(g => {
      const matchesEmail = g.email.toLowerCase().includes(q);
      const matchesName = (g.full_name || '').toLowerCase().includes(q);
      const matchesQuora = g.quora_accounts.some(a => 
        (a.username || '').toLowerCase().includes(q) || (a.profile_url || '').toLowerCase().includes(q)
      );
      return matchesEmail || matchesName || matchesQuora;
    });
  }, [groupedUsers, userSearchQuery]);

  const getGroupedStatus = (g: GroupedUser) => {
    const statuses = g.quora_accounts.map(a => a.status);
    if (statuses.includes('pending_approval')) return 'pending_approval';
    if (statuses.includes('verified')) return 'verified';
    if (statuses.every(s => s === 'banned')) return 'banned';
    if (statuses.includes('rejected')) return 'rejected';
    return 'pending_details';
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setIsApproving(true);
    
    const res = await verifyQuoraAccount(selectedUser.id);
    if (res.error) {
      alert("Approval failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified' } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          quora_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
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
    
    const res = await rejectQuoraAccount(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected', rejection_reason: finalReason } : u);
      setUsers(updatedUsers);
      setIsRejectingMode(false);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          quora_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
    setIsRejecting(false);
  };

  const handleBanAccount = async () => {
    if (!selectedUser) return;
    const reason = prompt("Enter ban reason for this Quora handle:");
    if (reason === null) return;

    const res = await banQuoraAccount(selectedUser.id, reason || 'Banned for policy violation');
    if (res.error) {
      alert("Ban failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'banned', ban_reason: reason } : u);
      setUsers(updatedUsers);
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          quora_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
  };

  const handleUnbanAccount = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to unban and verify this Quora handle?")) return;

    const res = await unbanQuoraAccount(selectedUser.id);
    if (res.error) {
      alert("Unban failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified', ban_reason: undefined } : u);
      setUsers(updatedUsers);
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          quora_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    }
  };

  const handleRemoveAccount = async () => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to permanently delete this Quora handle?")) return;

    const res = await adminRemoveQuoraAccount(selectedUser.id);
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
          setSelectedGroupUser({ ...selectedGroupUser, quora_accounts: remaining });
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
              background: '#b92b27', color: '#fff', fontSize: '18px', fontWeight: 900 
            }}>
              Q
            </span>
            Quora Users
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Verify, reject, or manage worker Quora profiles.</p>
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

      {/* Users Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Worker / Email</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Quora Handles</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Registered</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroupedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No Quora workers found.
                </td>
              </tr>
            ) : (
              filteredGroupedUsers.map((gUser) => {
                const status = getGroupedStatus(gUser);
                const isPending = status === 'pending_approval';
                const displayName = gUser.full_name?.trim() || gUser.quora_accounts[0]?.username || gUser.email.split('@')[0];
                const displayInitial = (displayName.charAt(0) || 'Q').toUpperCase();

                return (
                  <tr key={gUser.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '38px', height: '38px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #b92b27, #e53935)',
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {gUser.quora_accounts.map(acc => (
                          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a
                              href={acc.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              q/{acc.username} <ExternalLink size={11} />
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
                      <button
                        onClick={() => {
                          setSelectedGroupUser(gUser);
                          setSelectedUser(gUser.quora_accounts[0] || null);
                          setIsRejectingMode(false);
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: isPending ? 'linear-gradient(135deg, #b92b27, #aa221e)' : 'var(--bg-elevated)',
                          color: isPending ? '#fff' : 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {isPending ? 'Review Accounts' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
                  background: '#b92b27', color: '#fff', fontSize: '14px', fontWeight: 900 
                }}>
                  Q
                </span>
                Quora Account Review
              </h2>

              {/* Account Switcher if user has multiple handles */}
              {selectedGroupUser.quora_accounts.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {selectedGroupUser.quora_accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedUser(acc);
                        setIsRejectingMode(false);
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        background: selectedUser.id === acc.id ? '#b92b27' : 'var(--bg-card)',
                        color: selectedUser.id === acc.id ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)', cursor: 'pointer'
                      }}
                    >
                      q/{acc.username} ({acc.status})
                    </button>
                  ))}
                </div>
              )}

              {/* Current Account Details Card */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      q/{selectedUser.username}
                      <a href={selectedUser.profile_url} target="_blank" rel="noreferrer" style={{ color: '#ef4444' }}>
                        <ExternalLink size={14} />
                      </a>
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Worker: {selectedGroupUser.full_name?.trim() || selectedGroupUser.quora_accounts[0]?.username || selectedGroupUser.email.split('@')[0]} ({selectedGroupUser.email})
                    </p>
                  </div>

                  <span style={{
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                    background: selectedUser.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : selectedUser.status === 'pending_approval' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedUser.status === 'verified' ? '#22c55e' : selectedUser.status === 'pending_approval' ? '#eab308' : '#ef4444'
                  }}>
                    {selectedUser.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <strong>Profile URL:</strong> <a href={selectedUser.profile_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', wordBreak: 'break-all' }}>{selectedUser.profile_url}</a>
                </div>

                {selectedUser.rejection_reason && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px' }}>
                    <strong>Rejection Reason:</strong> {selectedUser.rejection_reason}
                  </div>
                )}

                {selectedUser.ban_reason && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px' }}>
                    <strong>Ban Reason:</strong> {selectedUser.ban_reason}
                  </div>
                )}
              </div>

              {/* Rejection Form */}
              {isRejectingMode ? (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Select Rejection Reason:
                  </label>
                  <select
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px', outline: 'none'
                    }}
                  >
                    <option value="Your Quora account does not meet our current verification standards.">Does not meet verification standards</option>
                    <option value="Quora profile URL is inaccessible or invalid.">Profile URL invalid or broken</option>
                    <option value="Quora account lacks sufficient activity or answers.">Insufficient account activity / answers</option>
                    <option value="custom">Other / Custom Reason</option>
                  </select>

                  {rejectReason === 'custom' && (
                    <textarea
                      rows={3}
                      placeholder="Type custom rejection explanation..."
                      value={customRejectReason}
                      onChange={e => setCustomRejectReason(e.target.value)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
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
                      <CheckCircle2 size={16} /> {selectedUser.status === 'verified' ? 'Already Verified' : 'Approve Handle'}
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
                        Unban Handle
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
                        Ban Handle
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
                      Delete Handle
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
