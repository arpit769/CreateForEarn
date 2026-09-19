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
          full_name: u.users?.full_name,
          created_at: u.users?.created_at || u.created_at,
          linkedin_accounts: []
        });
      }
      map.get(u.user_id)!.linkedin_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return groupedUsers;
    const q = userSearchQuery.toLowerCase();
    return groupedUsers.filter(gu => 
      gu.email.toLowerCase().includes(q) ||
      (gu.full_name && gu.full_name.toLowerCase().includes(q)) ||
      gu.linkedin_accounts.some(a => a.username.toLowerCase().includes(q))
    );
  }, [groupedUsers, userSearchQuery]);

  const handleVerify = async (accountId: string) => {
    setIsApproving(true);
    const res = await verifyLinkedInAccount(accountId);
    if (!res.error) {
      setUsers(prev => prev.map(u => u.id === accountId ? { ...u, status: 'verified', rejection_reason: undefined, ban_reason: undefined } : u));
      if (selectedUser?.id === accountId) setSelectedUser(null);
    } else {
      alert('Error verifying: ' + res.error);
    }
    setIsApproving(false);
  };

  const handleReject = async (accountId: string) => {
    const finalReason = rejectReason === 'Other (specify below)' ? customRejectReason : rejectReason;
    if (!finalReason) {
      alert('Please specify a rejection reason');
      return;
    }
    setIsRejecting(true);
    const res = await rejectLinkedInAccount(accountId, finalReason);
    if (!res.error) {
      setUsers(prev => prev.map(u => u.id === accountId ? { ...u, status: 'rejected', rejection_reason: finalReason } : u));
      setIsRejectingMode(false);
      setSelectedUser(null);
    } else {
      alert('Error rejecting: ' + res.error);
    }
    setIsRejecting(false);
  };

  const handleBan = async (accountId: string) => {
    if (!banReason.trim()) {
      alert('Please provide a reason for the ban.');
      return;
    }
    setIsBanning(true);
    const res = await banLinkedInAccount(accountId, banReason);
    if (!res.error) {
      setUsers(prev => prev.map(u => u.id === accountId ? { ...u, status: 'banned', ban_reason: banReason } : u));
      setUserToBan(null);
    } else {
      alert('Error banning: ' + res.error);
    }
    setIsBanning(false);
  };

  const handleUnban = async (accountId: string) => {
    if (!confirm('Are you sure you want to unban this LinkedIn account?')) return;
    const res = await unbanLinkedInAccount(accountId);
    if (!res.error) {
      setUsers(prev => prev.map(u => u.id === accountId ? { ...u, status: 'verified', ban_reason: undefined } : u));
    } else {
      alert('Error unbanning: ' + res.error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to permanently delete this LinkedIn account record?')) return;
    setIsDeleting(true);
    const res = await adminRemoveLinkedInAccount(accountId);
    if (!res.error) {
      setUsers(prev => prev.filter(u => u.id !== accountId));
      setUserToDelete(null);
    } else {
      alert('Error deleting: ' + res.error);
    }
    setIsDeleting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Verified</span>;
      case 'rejected':
        return <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Rejected</span>;
      case 'banned':
        return <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>Banned</span>;
      default:
        return <span style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Pending Approval</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <input 
          type="text"
          placeholder="Search workers by email, name or LinkedIn username..."
          value={userSearchQuery}
          onChange={(e) => setUserSearchQuery(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            width: '100%',
            maxWidth: '420px',
            outline: 'none'
          }}
        />
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredUsers.length} total workers
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>Worker</th>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>LinkedIn Account</th>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>Date Added</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No LinkedIn workers found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(gu => (
                <React.Fragment key={gu.user_id}>
                  {gu.linkedin_accounts.map((acc, index) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                      {/* Worker info only on the first row of user */}
                      {index === 0 ? (
                        <td rowSpan={gu.linkedin_accounts.length} style={{ padding: '16px 18px', verticalAlign: 'top', borderRight: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gu.full_name || gu.email.split('@')[0]}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{gu.email}</div>
                        </td>
                      ) : null}

                      {/* LinkedIn Account Details */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <LinkedInIcon size={16} />
                          <a 
                            href={acc.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0A66C2', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            in/{acc.username}
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {acc.headline && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {acc.headline}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        {getStatusBadge(acc.status)}
                        {acc.rejection_reason && (
                          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                            Reason: {acc.rejection_reason}
                          </div>
                        )}
                        {acc.ban_reason && (
                          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                            Ban Reason: {acc.ban_reason}
                          </div>
                        )}
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '16px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {new Date(acc.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {acc.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleVerify(acc.id)}
                                disabled={isApproving}
                                style={{
                                  background: 'rgba(34, 197, 94, 0.12)',
                                  color: '#22c55e',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(acc);
                                  setIsRejectingMode(true);
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {acc.status === 'verified' && (
                            <button
                              onClick={() => {
                                setUserToBan({
                                  user_id: acc.user_id,
                                  email: gu.email,
                                  full_name: gu.full_name,
                                  created_at: gu.created_at,
                                  linkedin_accounts: [acc]
                                });
                              }}
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Ban
                            </button>
                          )}

                          {acc.status === 'banned' && (
                            <button
                              onClick={() => handleUnban(acc.id)}
                              style={{
                                background: 'rgba(34, 197, 94, 0.12)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Unban
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(acc.id)}
                            title="Delete Account"
                            style={{
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {isRejectingMode && selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Reject LinkedIn Account: in/{selectedUser.username}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select or enter a reason for rejecting this profile.
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}
            >
              <option value="Your LinkedIn profile does not meet our current verification standards.">Does not meet standards</option>
              <option value="Profile appears incomplete or lacks authentic details/connections.">Incomplete / Low Activity Profile</option>
              <option value="Profile link is inaccessible, private, or invalid.">Invalid / Broken URL</option>
              <option value="Other (specify below)">Other (custom reason)</option>
            </select>

            {rejectReason === 'Other (specify below)' && (
              <textarea
                placeholder="Enter custom rejection reason..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  minHeight: '80px',
                  marginBottom: '16px'
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setIsRejectingMode(false);
                  setSelectedUser(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedUser.id)}
                disabled={isRejecting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {userToBan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
              Ban LinkedIn Account
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter the reason for banning in/{userToBan.linkedin_accounts[0]?.username}.
            </p>

            <textarea
              placeholder="e.g. Fraudulent submissions, policy violation..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                minHeight: '80px',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setUserToBan(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBan(userToBan.linkedin_accounts[0]?.id)}
                disabled={isBanning}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isBanning ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
