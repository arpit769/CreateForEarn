'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MoreVertical, ExternalLink, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { verifyUser, createSubreddit, rejectUser, deleteUserAccount } from '@/actions/users';

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  reddit_profile_link: string | null;
  reddit_karma: number | null;
  reddit_account_age: string | null;
  created_at: string;
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(userToDelete.id);
    if (res.error) {
      alert("Failed to delete user: " + res.error);
    } else {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    }
    setIsDeleting(false);
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
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'verified' } : u));
      setSelectedUser(null);
      setSelectedTags([]);
      setNewTag('');
    }
    setIsApproving(false);
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    setIsRejecting(true);
    
    const finalReason = rejectReason === 'custom' ? customRejectReason : rejectReason;
    
    const res = await rejectUser(selectedUser.id, finalReason);
    if (res.error) {
      alert("Rejection failed: " + res.error);
    } else {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'rejected' } : u));
      setSelectedUser(null);
      setIsRejectingMode(false);
    }
    setIsRejecting(false);
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
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{users.filter(u => u.role === 'worker').length}</p>
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
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: 'var(--gradient-purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'var(--btn-text)', fontSize: '16px'
                    }}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {user.status === 'pending_approval' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></span> Pending Review
                    </span>
                  )}
                  {user.status === 'rejected' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span> Rejected
                    </span>
                  )}
                  {user.status === 'verified' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span> Verified
                    </span>
                  )}
                  {user.status === 'pending_details' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></span> Onboarding
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user.role}</span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                  {user.status === 'pending_approval' ? (
                    <button 
                      onClick={() => setSelectedUser(user)}
                      style={{
                        padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
                        borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <ShieldCheck size={16} /> Review
                    </button>
                  ) : (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        onClick={() => setActionMenuOpenFor(actionMenuOpenFor === user.id ? null : user.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {actionMenuOpenFor === user.id && (
                        <div style={{
                          position: 'absolute', right: '0', top: '100%', marginTop: '8px', zIndex: 10,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '160px', overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setActionMenuOpenFor(null);
                            }}
                            style={{
                              width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                              background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={16} /> Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedUser(null); setIsRejectingMode(false); setSelectedTags([]); setNewTag(''); }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-card)', 
                borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Review Application</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{selectedUser.email}</p>
              
              <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Account Age</p>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.reddit_account_age}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Karma</p>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.reddit_karma}</p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Profile Link</p>
                    <a href={selectedUser.reddit_profile_link || '#'} target="_blank" rel="noreferrer" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {selectedUser.reddit_profile_link} <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

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
                  onClick={() => { setSelectedUser(null); setIsRejectingMode(false); setSelectedTags([]); setNewTag(''); }}
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
                Are you sure you want to delete the account for <strong style={{ color: 'var(--text-primary)' }}>{userToDelete.email}</strong>? This action cannot be undone and all data will be permanently removed.
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
    </div>
  );
}
