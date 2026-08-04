'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ExternalLink, ShieldCheck, Trash2, AlertTriangle, Ban } from 'lucide-react';
import { verifyUser, updateUserTags, createSubreddit, rejectUser, deleteUserAccount, banUser, unbanUser, banEntireUser, removeRedditAccount } from '@/actions/users';

type User = {
  id: string; // Reddit Account ID
  user_id: string; // Auth User ID
  status: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  reddit_account_age: string | null;
  created_at: string;
  users: {
    email: string;
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
  created_at: string;
  reddit_accounts: User[];
};

type Subreddit = {
  id: string;
  name: string;
};

export default function UsersTable({ 
  initialUsers, 
  initialSubreddits 
}: { 
  initialUsers: User[], 
  initialSubreddits: Subreddit[] 
}) {
  const [users, setUsers] = useState(initialUsers);
  const [subreddits, setSubreddits] = useState(initialSubreddits);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection State
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your account does not meet our current requirements.');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Deletion State
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<GroupedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Ban State
  const [userToBan, setUserToBan] = useState<GroupedUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  const handleReject = async () => {
    if (!selectedUser) return;
    setIsRejecting(true);
    
    const finalReason = rejectReason === 'custom' ? customRejectReason : rejectReason;
    
    const res = await rejectUser(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected' } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          reddit_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
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
    // userToBan is now a GroupedUser in the context of the main table
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


  const groupedUsers = useMemo(() => {
    const map = new Map<string, GroupedUser>();
    users.forEach(u => {
      if (!map.has(u.user_id)) {
        map.set(u.user_id, {
          user_id: u.user_id,
          email: u.users?.email || 'Unknown',
          created_at: u.users?.created_at || u.created_at,
          reddit_accounts: []
        });
      }
      map.get(u.user_id)!.reddit_accounts.push(u);
    });
    return Array.from(map.values());
  }, [users]);

  const [selectedGroupUser, setSelectedGroupUser] = useState<GroupedUser | null>(null);

  const getGroupedStatus = (g: GroupedUser) => {
    const statuses = g.reddit_accounts.map(a => a.status);
    if (statuses.includes('pending_approval')) return 'pending_approval';
    if (statuses.includes('verified')) return 'verified';
    if (statuses.every(s => s === 'banned')) return 'banned';
    if (statuses.includes('rejected')) return 'rejected';
    return 'pending_details';
  };

  const handleUpdateTags = async () => {
    if (!selectedUser) return;
    setIsApproving(true);
    
    let tagsToAssign = [...selectedTags];
    let newlyCreatedSubreddits = [];
    
    if (tagsToAssign.includes('create_new')) {
      if (!newTag.trim()) {
        setIsApproving(false);
        return;
      }
      
      tagsToAssign = tagsToAssign.filter(t => t !== 'create_new');
      const newTagNames = newTag.split(',').map(t => t.trim()).filter(t => t);
      
      for (const tagName of newTagNames) {
        const res = await createSubreddit(tagName);
        if (res.error || !res.subreddit) {
          alert(`Failed to create tag "${tagName}": ` + res.error);
          setIsApproving(false);
          return;
        }
        tagsToAssign.push(res.subreddit.id);
        newlyCreatedSubreddits.push(res.subreddit);
      }
      
      setSubreddits([...subreddits, ...newlyCreatedSubreddits]);
    }

    const res = await updateUserTags(selectedUser.id, tagsToAssign);
    if (res.error) {
      alert("Update failed: " + res.error);
    } else {
      const updatedSubreddits = tagsToAssign.map(id => ({ subreddit_id: id }));
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, reddit_account_subreddits: updatedSubreddits } : u);
      setUsers(updatedUsers);
      
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          reddit_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
      alert("Tags updated successfully!");
    }
    setIsApproving(false);
  };

  const handleApprove = async () => {
    if (!selectedUser || selectedTags.length === 0) return;
    setIsApproving(true);
    
    let tagsToAssign = [...selectedTags];
    let newlyCreatedSubreddits = [];
    
    if (tagsToAssign.includes('create_new')) {
      if (!newTag.trim()) {
        setIsApproving(false);
        return;
      }
      
      tagsToAssign = tagsToAssign.filter(t => t !== 'create_new');
      const newTagNames = newTag.split(',').map(t => t.trim()).filter(t => t);
      
      for (const tagName of newTagNames) {
        const res = await createSubreddit(tagName);
        if (res.error || !res.subreddit) {
          alert(`Failed to create tag "${tagName}": ` + res.error);
          setIsApproving(false);
          return;
        }
        tagsToAssign.push(res.subreddit.id);
        newlyCreatedSubreddits.push(res.subreddit);
      }
      
      setSubreddits([...subreddits, ...newlyCreatedSubreddits]);
    }

    const res = await verifyUser(selectedUser.id, tagsToAssign);
    if (res.error) {
      alert("Approval failed: " + res.error);
    } else {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified' } : u);
      setUsers(updatedUsers);
      
      // Update selectedGroupUser so modal reflects immediately
      if (selectedGroupUser) {
        setSelectedGroupUser({
          ...selectedGroupUser,
          reddit_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
        });
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }

      setSelectedTags([]);
      setNewTag('');
    }
    setIsApproving(false);
  };


  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Manage Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Review and approve pending worker applications.</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Workers</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{users.length}</p>
          </div>
          <div style={{ width: '1px', background: 'var(--border-subtle)' }}></div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-amber)' }}>{users.filter(u => u.status === 'pending_approval').length}</p>
          </div>
        </div>
      </div>

      <div style={{ 
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
            {groupedUsers.map((gUser) => {
              const summaryStatus = getGroupedStatus(gUser);
              return (
              <tr key={gUser.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: 'var(--gradient-purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'var(--btn-text)', fontSize: '16px'
                    }}>
                      {(gUser.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{gUser.email}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Joined {new Date(gUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Worker ({gUser.reddit_accounts.length} Accounts)</span>
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
                            if (gUser.reddit_accounts.length > 0) {
                              const firstAcc = gUser.reddit_accounts[0];
                              setSelectedUser(firstAcc);
                              if ((firstAcc as any).reddit_account_subreddits) {
                                setSelectedTags((firstAcc as any).reddit_account_subreddits.map((ts: any) => ts.subreddit_id));
                              } else {
                                setSelectedTags([]);
                              }
                            } else {
                              setSelectedUser(null);
                              setSelectedTags([]);
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

      {/* Review Modal */}
      <AnimatePresence>
        {selectedUser && selectedGroupUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); setSelectedTags([]); setNewTag(''); }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-card)', 
                borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                maxHeight: '90vh', overflowY: 'auto'
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                User Profiles for {selectedGroupUser.email}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>Select an account below to view its details.</p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {selectedGroupUser.reddit_accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedUser(acc);
                      if ((acc as any).reddit_account_subreddits) {
                        setSelectedTags((acc as any).reddit_account_subreddits.map((ts: any) => ts.subreddit_id));
                      } else {
                        setSelectedTags([]);
                      }
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: selectedUser.id === acc.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                      background: selectedUser.id === acc.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-elevated)',
                      color: selectedUser.id === acc.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: selectedUser.id === acc.id ? 600 : 500
                    }}
                  >
                    {acc.reddit_profile_link ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() : 'Account'} 
                    <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '12px', textTransform: 'capitalize' }}>({acc.status.replace('_', ' ')})</span>
                  </button>
                ))}
              </div>
              
              {(() => {
                const claims = selectedUser.task_claims || [];
                let earnings = 0, approvals = 0, submissions = 0, rejections = 0;
                claims.forEach(c => {
                  if (c.status === 'submitted' || c.status === 'approved' || c.status === 'rejected') submissions++;
                  if (c.status === 'approved') {
                    approvals++;
                    earnings += c.tasks?.payment_amount || 0;
                  }
                  if (c.status === 'rejected') rejections++;
                });

                return (
                  <>
                    <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Account Age</p>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.reddit_account_age || 'N/A'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Karma</p>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.reddit_karma || 'N/A'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Profile Link</p>
                          <a href={selectedUser.reddit_profile_link || '#'} target="_blank" rel="noreferrer" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            View on Reddit <ExternalLink size={14} />
                          </a>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Join Date</p>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {selectedUser.status !== 'pending_approval' && (
                      <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Account Performance</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Earnings</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>${earnings.toFixed(2)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Submissions</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{submissions}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Approvals</p>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>{approvals}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Rejections</p>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444' }}>{rejections}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {selectedUser.status === 'pending_approval' ? (
                <>
                  {isRejectingMode ? (
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>Select Rejection Reason <span style={{color: '#ef4444'}}>*</span></label>
                      <select 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ 
                          width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                          borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '12px'
                        }}
                      >
                        <option value="Your account does not meet our current requirements.">Your account does not meet our current requirements.</option>
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
                  ) : (
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>Assign Subreddit Tags <span style={{color: '#ef4444'}}>*</span></label>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>The user will only see tasks assigned to these tags.</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {subreddits.map(s => {
                          const isSelected = selectedTags.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== s.id) : [...prev, s.id])}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-elevated)',
                                color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              r/{s.name}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => setSelectedTags(prev => prev.includes('create_new') ? prev.filter(t => t !== 'create_new') : [...prev, 'create_new'])}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: `1px dashed ${selectedTags.includes('create_new') ? 'var(--accent-blue)' : 'var(--text-muted)'}`,
                            background: selectedTags.includes('create_new') ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            color: selectedTags.includes('create_new') ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          + Create New Tag
                        </button>
                      </div>

                      {selectedTags.includes('create_new') && (
                        <div style={{ marginTop: '16px' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. AiWritingLounge, VideoEditors (comma separated)" 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            style={{ 
                              width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
                              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {!isRejectingMode ? (
                      <button 
                        onClick={() => setIsRejectingMode(true)}
                        style={{ marginRight: 'auto', padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reject Application
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsRejectingMode(false)}
                        style={{ marginRight: 'auto', padding: '12px 24px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Back to Approve
                      </button>
                    )}

                    <button 
                      onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); setSelectedTags([]); setNewTag(''); }}
                      style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    
                    {isRejectingMode ? (
                      <button 
                        onClick={handleReject}
                        disabled={isRejecting || (rejectReason === 'custom' && !customRejectReason.trim())}
                        style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (isRejecting || (rejectReason === 'custom' && !customRejectReason.trim())) ? 0.5 : 1 }}
                      >
                        {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    ) : (
                      <button 
                        onClick={handleApprove}
                        disabled={selectedTags.length === 0 || isApproving}
                        style={{ padding: '12px 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (selectedTags.length === 0 || isApproving) ? 0.5 : 1 }}
                      >
                        {isApproving ? 'Approving...' : 'Approve & Assign Tags'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {selectedUser.status === 'verified' && (
                    <div style={{ marginBottom: '32px', background: 'var(--bg-elevated)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>Assign Subreddit Tags</label>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>The user will only see tasks assigned to these tags.</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {subreddits.map(s => {
                          const isSelected = selectedTags.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== s.id) : [...prev, s.id])}
                              style={{
                                padding: '6px 12px', borderRadius: '20px',
                                border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                                color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                                fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
                              }}
                            >
                              r/{s.name}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => setSelectedTags(prev => prev.includes('create_new') ? prev.filter(t => t !== 'create_new') : [...prev, 'create_new'])}
                          style={{
                            padding: '6px 12px', borderRadius: '20px',
                            border: `1px dashed ${selectedTags.includes('create_new') ? 'var(--accent-blue)' : 'var(--text-muted)'}`,
                            background: selectedTags.includes('create_new') ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            color: selectedTags.includes('create_new') ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          + Create New
                        </button>
                      </div>

                      {selectedTags.includes('create_new') && (
                        <div style={{ marginTop: '16px' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. AiWritingLounge, VideoEditors (comma separated)" 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            style={{ 
                              width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', 
                              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' 
                            }}
                          />
                        </div>
                      )}

                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                        <button 
                          onClick={handleUpdateTags}
                          disabled={isApproving}
                          style={{ padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isApproving ? 0.5 : 1 }}
                        >
                          {isApproving ? 'Saving...' : 'Save Tags'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                    <button 
                      onClick={() => { setSelectedGroupUser(null); setSelectedUser(null); setIsRejectingMode(false); setSelectedTags([]); setNewTag(''); }}
                      style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Close Profile
                    </button>
                    
                    {selectedUser.status === 'verified' && (
                      <button 
                        onClick={async () => {
                          const reason = prompt('Enter reason to ban this specific account:');
                          if (reason) {
                            const res = await banUser(selectedUser.id, reason);
                            if (!res.error) {
                              const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'banned', ban_reason: reason } : u);
                              setUsers(updatedUsers);
                              if (selectedGroupUser) {
                                setSelectedGroupUser({
                                  ...selectedGroupUser,
                                  reddit_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
                                });
                                setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
                              }
                            }
                          }
                        }}
                        style={{ padding: '12px 24px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Ban Account
                      </button>
                    )}
                    
                    {selectedUser.status === 'banned' && (
                      <button 
                        onClick={async () => {
                          const res = await unbanUser(selectedUser.id);
                          if (!res.error) {
                            const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified', ban_reason: null } : u);
                            setUsers(updatedUsers);
                            if (selectedGroupUser) {
                              setSelectedGroupUser({
                                ...selectedGroupUser,
                                reddit_accounts: updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id)
                              });
                              setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
                            }
                          }
                        }}
                        style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Unban Account
                      </button>
                    )}
                    
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this specific Reddit account?')) {
                          const res = await removeRedditAccount(selectedUser.id);
                          if (!res.error) {
                            const updatedUsers = users.filter(u => u.id !== selectedUser.id);
                            setUsers(updatedUsers);
                            if (selectedGroupUser) {
                              const remainingAccounts = updatedUsers.filter(u => u.user_id === selectedGroupUser.user_id);
                              setSelectedGroupUser({
                                ...selectedGroupUser,
                                reddit_accounts: remainingAccounts
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
                      style={{ padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
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
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete User Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>
                Are you sure you want to delete the account for <strong style={{ color: 'var(--text-primary)' }}>{userToDelete.email || 'Unknown User'}</strong>? This action cannot be undone and all data will be permanently removed.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', flex: 1, opacity: isDeleting ? 0.7 : 1 }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Ban User Modal */}
      <AnimatePresence>
        {userToBan && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUserToBan(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: '440px', background: 'var(--bg-card)', 
                borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Ban User</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                You are about to ban <strong>{userToBan.email || 'Unknown User'}</strong>. They will lose access to all tasks.
              </p>

              <div style={{ marginBottom: '24px' }}>
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
                  style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBanEntireUser}
                  disabled={isBanning || !banReason.trim()}
                  style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (isBanning || !banReason.trim()) ? 0.5 : 1 }}
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
