'use client';

import { useState } from 'react';
import { users } from '@/data/mockData';
import type { UserProfile } from '@/data/mockData';

const roleColors: Record<string, string> = {
  admin: 'badge-red',
  moderator: 'badge-purple',
  member: 'badge-blue',
  banned: 'badge-red',
  muted: 'badge-orange',
};

const roleIcons: Record<string, string> = {
  admin: '',
  moderator: '',
  member: '',
  banned: '',
  muted: '',
};

export default function UsersPage() {
  const [userList, setUserList] = useState<UserProfile[]>(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'karma' | 'joinDate' | 'postsCount'>('karma');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const filteredUsers = userList
    .filter(u => {
      if (searchQuery && !u.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'karma') return b.karma - a.karma;
      if (sortBy === 'joinDate') return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      return b.postsCount - a.postsCount;
    });

  const handleAction = (userId: string, action: 'ban' | 'unban' | 'mute' | 'unmute' | 'promote') => {
    setUserList(prev => prev.map(u => {
      if (u.id !== userId) return u;
      switch (action) {
        case 'ban': return { ...u, role: 'banned' as const, warnings: u.warnings + 1 };
        case 'unban': return { ...u, role: 'member' as const };
        case 'mute': return { ...u, role: 'muted' as const };
        case 'unmute': return { ...u, role: 'member' as const };
        case 'promote': return { ...u, role: 'moderator' as const };
        default: return u;
      }
    }));
    setSelectedUser(null);
  };

  const roleCounts = {
    all: userList.length,
    member: userList.filter(u => u.role === 'member').length,
    moderator: userList.filter(u => u.role === 'moderator').length,
    admin: userList.filter(u => u.role === 'admin').length,
    banned: userList.filter(u => u.role === 'banned').length,
    muted: userList.filter(u => u.role === 'muted').length,
  };

  return (
    <div className="page-enter">
      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="input-field"
              style={{ paddingLeft: '36px' }}
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select className="select-field" style={{ width: 'auto', minWidth: '140px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="karma">Sort: Karma</option>
            <option value="joinDate">Sort: Join Date</option>
            <option value="postsCount">Sort: Post Count</option>
          </select>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="tab-bar" style={{ marginBottom: '20px', width: 'fit-content' }}>
        {(['all', 'member', 'moderator', 'admin', 'banned', 'muted'] as const).map((role) => (
          <button
            key={role}
            className={`tab-item ${roleFilter === role ? 'active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
            <span style={{ marginLeft: '6px', opacity: 0.7 }}>({roleCounts[role]})</span>
          </button>
        ))}
      </div>

      {/* User Detail Panel (if selected) */}
      {selectedUser && (
        <div className="glass-card-static" style={{
          padding: '24px',
          marginBottom: '20px',
          animation: 'scale-in 0.2s ease-out',
          borderLeft: '3px solid var(--accent-purple)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-elevated)',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>u/{selectedUser.username}</h3>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                  <span className={`badge ${roleColors[selectedUser.role]}`}>
                    {roleIcons[selectedUser.role]} {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </span>
                  {selectedUser.flair && <span className="badge badge-purple">{selectedUser.flair}</span>}
                  {selectedUser.warnings > 0 && <span className="badge badge-orange"> {selectedUser.warnings} warnings</span>}
                </div>
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setSelectedUser(null)}> Close</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '20px' }}>
            {[
              { label: 'Total Karma', value: selectedUser.karma.toLocaleString(), color: '#a855f7' },
              { label: 'Post Karma', value: selectedUser.postKarma.toLocaleString(), color: '#d4d4d4' },
              { label: 'Comment Karma', value: selectedUser.commentKarma.toLocaleString(), color: '#a3a3a3' },
              { label: 'Posts', value: selectedUser.postsCount.toString(), color: '#737373' },
              { label: 'Comments', value: selectedUser.commentsCount.toString(), color: '#525252' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {selectedUser.role !== 'banned' && (
              <button className="btn-danger" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleAction(selectedUser.id, 'ban')}>
                 Ban User
              </button>
            )}
            {selectedUser.role === 'banned' && (
              <button className="btn-success" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleAction(selectedUser.id, 'unban')}>
                 Unban
              </button>
            )}
            {selectedUser.role !== 'muted' && selectedUser.role !== 'banned' && (
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleAction(selectedUser.id, 'mute')}>
                 Mute
              </button>
            )}
            {selectedUser.role === 'muted' && (
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleAction(selectedUser.id, 'unmute')}>
                 Unmute
              </button>
            )}
            {selectedUser.role === 'member' && (
              <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleAction(selectedUser.id, 'promote')}>
                 Make Moderator
              </button>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card-static" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['User', 'Role', 'Karma', 'Posts', 'Comments', 'Joined', 'Status', ''].map(header => (
                <th key={header} style={{
                  padding: '14px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  animation: `fade-in 0.3s ease-out forwards`,
                  animationDelay: `${index * 30}ms`,
                  opacity: 0,
                }}
                onClick={() => setSelectedUser(user)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', fontSize: '14px', fontWeight: 'bold' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>u/{user.username}</p>
                      {user.flair && <p style={{ fontSize: '11px', color: 'var(--accent-purple)' }}>{user.flair}</p>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge ${roleColors[user.role]}`}>
                    {roleIcons[user.role]} {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>
                  {user.karma.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {user.postsCount}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {user.commentsCount}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {user.warnings > 0 ? (
                    <span className="badge badge-orange"> {user.warnings}</span>
                  ) : (
                    <span className="badge badge-green">Clean</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
